"use server"

import { nanoid } from "nanoid"
import { createClient } from "@/utils/supabase/server"
import type { RoomState, Player, Theme, Answer } from "@/lib/types"
import { getCurrentUser, signInAnonymously } from "@/lib/auth"

const AVATAR_KEYWORDS = ["cat", "dog", "rabbit", "fox", "koala", "panda", "lion"]

async function updateRoomWithRetry(
    supabase: any,
    roomId: string,
    updateFunction: (room: RoomState) => Partial<RoomState>,
    maxRetries = 3,
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { data: room, error: fetchError } = await supabase.from("rooms").select("*").eq("roomId", roomId).single()

    if (fetchError) {
      console.error("Error fetching room:", fetchError)
      throw new Error("Failed to fetch room")
    }

    const updates = updateFunction(room)
    const newVersion = (room.version || 0) + 1

    const { data, error: updateError } = await supabase
        .from("rooms")
        .update({ ...updates, version: newVersion })
        .eq("roomId", roomId)
        .eq("version", room.version || 0)
        .select()

    if (!updateError && data) {
      return { success: true, room: data[0] }
    }

    if (updateError && updateError.code === "23514") {
      // Postgres check constraint violation
      console.log("Optimistic lock failed, retrying...")
      continue
    }

    console.error("Error updating room:", updateError)
    throw new Error("Failed to update room")
  }

  throw new Error("Failed to update room after multiple attempts")
}

export async function createRoom(playerName: string) {
  const supabase = await createClient()

  let user = await getCurrentUser()
  if (!user) {
    user = await signInAnonymously()
  }

  if (!user) throw new Error("User not authenticated")

  const roomId = nanoid(10)
  const avatarKeyword = AVATAR_KEYWORDS[Math.floor(Math.random() * AVATAR_KEYWORDS.length)]

  const initialRoomState: RoomState = {
    roomId: roomId,
    players: [{ id: user.id, name: playerName, avatar: avatarKeyword, isHost: true, ready: false }],
    gameState: "waiting",
    currentRound: 0,
    themes: [],
    version: 1,
  }

  const { data, error } = await supabase.from("rooms").insert(initialRoomState).select()

  if (error) {
    console.error("Error creating room:", error)
    throw new Error("Failed to create room")
  }

  await supabase.channel(roomId).subscribe()

  return { roomId, avatarKeyword }
}

export async function joinRoom(roomId: string, playerName: string) {
  const supabase = await createClient()

  let user = await getCurrentUser()
  if (!user) {
    user = await signInAnonymously()
  }

  if (!user) throw new Error("User not authenticated")

  const avatarKeyword = AVATAR_KEYWORDS[Math.floor(Math.random() * AVATAR_KEYWORDS.length)]

  const result = await updateRoomWithRetry(supabase, roomId, (room) => {
    if (room.gameState !== "waiting") {
      throw new Error("Game has already started")
    }

    const updatedPlayers = [
      ...(room.players || []),
      { id: user.id, name: playerName, avatar: avatarKeyword, isHost: false, ready: false },
    ]
    return { players: updatedPlayers }
  })

  await supabase.channel(roomId).send({
    type: "broadcast",
    event: "player_joined",
    payload: { player_id: user.id, player_name: playerName, avatar: avatarKeyword },
  })

  return { avatarKeyword }
}

export async function startGame(roomId: string) {
  const supabase = await createClient()

  const result = await updateRoomWithRetry(supabase, roomId, (room) => {
    if (room.players.length < 3) {
      throw new Error("At least 3 players are required to start the game")
    }

    return { gameState: "theme_input" }
  })

  await supabase.channel(roomId).send({
    type: "broadcast",
    event: "game_started",
    payload: {},
  })
}

export async function submitThemes(roomId: string, themes: Array<{ theme: string; submissionId: string }>) {
  const supabase = await createClient()

  let user = await getCurrentUser()
  if (!user) {
    user = await signInAnonymously()
  }

  if (!user) throw new Error("User not authenticated")

  const result = await updateRoomWithRetry(supabase, roomId, (room) => {
    const currentPlayer = room.players.find((p: Player) => p.id === user.id)
    if (!currentPlayer) throw new Error("Player not found in room")

    const newThemes = themes
        .filter((theme) => !room.themes.some((existingTheme) => existingTheme.submissionId === theme.submissionId))
        .map((theme) => ({
          question: theme.theme,
          author: currentPlayer.name,
          answers: [],
          submissionId: theme.submissionId,
        }))

    const updatedThemes = [...(room.themes || []), ...newThemes]
    const updatedPlayers = room.players.map((player: Player) =>
        player.id === user.id ? { ...player, ready: true } : player,
    )

    const allReady = updatedPlayers.every((player: Player) => player.ready)
    const newGameState = allReady ? "answer_input" : room.gameState
    const newCurrentRound = allReady ? 0 : room.currentRound

    return {
      themes: updatedThemes,
      players: updatedPlayers,
      gameState: newGameState,
      currentRound: newCurrentRound,
    }
  })

  if (result.room.gameState === "answer_input") {
    await supabase.channel(roomId).send({
      type: "broadcast",
      event: "all_players_ready",
      payload: {},
    })
  }
}

export async function submitAnswer(roomId: string, answer: string, submissionId: string) {
  const supabase = await createClient()

  let user = await getCurrentUser()
  if (!user) {
    user = await signInAnonymously()
  }

  if (!user) throw new Error("User not authenticated")

  const result = await updateRoomWithRetry(supabase, roomId, (room) => {
    const currentPlayer = room.players.find((p: Player) => p.id === user.id)
    if (!currentPlayer) throw new Error("Player not found in room")

    const currentTheme = room.themes[room.currentRound]

    // Check if this submission already exists
    const existingSubmission = currentTheme.answers.find((a: Answer) => a.submissionId === submissionId)
    if (existingSubmission) {
      // If it exists, don't update anything
      return {}
    }

    const newAnswer: Answer = {
      playerId: user.id,
      playerName: currentPlayer.name,
      answer,
      invalid: false,
      submissionId,
    }

    const updatedThemes = room.themes.map((theme: Theme, index: number) =>
        index === room.currentRound ? { ...theme, answers: [...theme.answers, newAnswer] } : theme,
    )

    const allAnswered = updatedThemes[room.currentRound].answers.length === room.players.length
    const newGameState = allAnswered ? "review" : room.gameState

    return { themes: updatedThemes, gameState: newGameState }
  })

  if (result.success) {
    await supabase.channel(roomId).send({
      type: "broadcast",
      event: "answer_submitted",
      payload: { playerName: user.name, submissionId },
    })

    if (result.room.gameState === "review") {
      await supabase.channel(roomId).send({
        type: "broadcast",
        event: "all_answers_submitted",
        payload: {},
      })
    }
  }

  return result
}

export async function markAnswerInvalid(roomId: string, answerId: string) {
  const supabase = await createClient()

  const result = await updateRoomWithRetry(supabase, roomId, (room) => {
    const updatedThemes = room.themes.map((theme: Theme, index: number) =>
        index === room.currentRound
            ? {
              ...theme,
              answers: theme.answers.map((answer: any) =>
                  answer.playerId === answerId ? { ...answer, invalid: true } : answer,
              ),
            }
            : theme,
    )

    return { themes: updatedThemes }
  })

  await supabase.channel(roomId).send({
    type: "broadcast",
    event: "answer_invalidated",
    payload: { answerId },
  })
}

export async function calculateFinalScores(roomId: string) {
  const supabase = await createClient()

  const result = await updateRoomWithRetry(supabase, roomId, (room) => {
    // Use the existing scores from the players
    const updatedPlayers = room.players.map((player: Player) => ({
      ...player,
      score: player.score || 0,
    }))

    return { players: updatedPlayers, gameState: "game_over" }
  })

  await supabase.channel(roomId).send({
    type: "broadcast",
    event: "game_over",
    payload: { players: result.room.players },
  })
}

export async function finishReview(roomId: string) {
  const supabase = await createClient()

  const result = await updateRoomWithRetry(supabase, roomId, (room) => {
    const playerScores = room.players.reduce((scores: { [key: string]: number }, player: Player) => {
      scores[player.id] = player.score || 0
      return scores
    }, {})

    const currentTheme = room.themes[room.currentRound]
    const validAnswers = currentTheme.answers.filter((answer) => !answer.invalid)
    const answerCounts = validAnswers.reduce((counts: { [key: string]: number }, answer) => {
      const lowerCaseAnswer = answer.answer.toLowerCase()
      counts[lowerCaseAnswer] = (counts[lowerCaseAnswer] || 0) + 1
      return counts
    }, {})

    validAnswers.forEach((answer) => {
      if (answerCounts[answer.answer.toLowerCase()] === 1) {
        playerScores[answer.playerId]++
      }
    })

    const updatedPlayers = room.players.map((player: Player) => ({
      ...player,
      score: playerScores[player.id],
    }))

    const nextRound = room.currentRound + 1
    if (nextRound < room.themes.length) {
      return { players: updatedPlayers, gameState: "answer_input", currentRound: nextRound }
    } else {
      return { players: updatedPlayers, gameState: "game_over" }
    }
  })

  if (result.room.gameState === "answer_input") {
    await supabase.channel(roomId).send({
      type: "broadcast",
      event: "review_finished",
      payload: { nextGameState: "answer_input", nextRound: result.room.currentRound },
    })
  } else {
    await calculateFinalScores(roomId)
  }
}

export async function resetGame(roomId: string) {
  const supabase = await createClient()

  const result = await updateRoomWithRetry(supabase, roomId, (room) => {
    return {
      gameState: "waiting",
      currentRound: 0,
      themes: [],
      players: room.players.map((player: Player) => ({ ...player, ready: false, score: 0 })),
    }
  })

  await supabase.channel(roomId).send({
    type: "broadcast",
    event: "game_reset",
    payload: {},
  })
}

