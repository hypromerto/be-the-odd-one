"use server"

import {createClient} from "@/utils/supabase/server"
import {getCurrentUser, signInAnonymously} from "@/lib/auth"
import {nanoid} from "nanoid"
import type {RoomState, Theme, Answer, Player} from "@/lib/types"
const SECRET_KEY = process.env.RECAPTCHA_SECRETKEY
const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=`

const verifyRecaptchaToken = async (token) => {
    try {
        const tokenUrl = verifyUrl + token
        const recaptchaRes = await fetch(tokenUrl, {method: "POST"})

        const recaptchaJson = await recaptchaRes.json()
    } catch (e) {
        throw new Error("Captcha Failed")
    }
}

export async function createRoom(token: string, playerName: string) {
    const tokenErr = await verifyRecaptchaToken(token)

    if (tokenErr) {
        throw new Error("Captcha Failed")
    }

    const supabase = await createClient()

    let user = await getCurrentUser()
    if (!user) {
        user = await signInAnonymously()
    }

    if (!user) throw new Error("User not authenticated")

    const roomId = nanoid(10)
    const avatarKeyword = ["cat", "dog", "rabbit", "fox", "koala", "panda", "lion"][Math.floor(Math.random() * 7)]

    const {error: roomError} = await supabase
        .from("rooms")
        .insert({room_id: roomId, game_state: "waiting", current_round: 0})

    if (roomError) {
        console.error("Error creating room:", roomError)
        throw new Error("Failed to create room")
    }

    const {data: playerData, error: playerError} = await supabase
        .from("players")
        .insert({
            room_id: roomId,
            user_id: user.id,
            name: playerName,
            avatar: avatarKeyword,
            is_host: true,
        })
        .select()
        .single()

    if (playerError) {
        console.error("Error creating player:", playerError)
        throw new Error("Failed to create player")
    }

    await supabase.channel(`room:${roomId}`).send({
        type: "broadcast",
        event: "player_joined",
        payload: {player: playerData},
    })

    return {roomId, avatarKeyword}
}

export async function joinRoom(roomId: string, playerName: string, token: string) {
    const tokenErr = await verifyRecaptchaToken(token)

    if (tokenErr) {
        throw new Error("Captcha Failed")
    }

    const supabase = await createClient()

    let user = await getCurrentUser()
    if (!user) {
        user = await signInAnonymously()
    }

    if (!user) throw new Error("User not authenticated")

    const avatarKeyword = ["cat", "dog", "rabbit", "fox", "koala", "panda", "lion"][Math.floor(Math.random() * 7)]

    const {data: roomData, error: roomError} = await supabase
        .from("rooms")
        .select("id, game_state")
        .eq("room_id", roomId)
        .single()

    if (roomError || !roomData) {
        throw new Error("Room not found")
    }

    if (roomData.game_state !== "waiting") {
        throw new Error("Game has already started")
    }

    const {data: playerData, error: playerError} = await supabase
        .from("players")
        .insert({
            room_id: roomId,
            user_id: user.id,
            name: playerName,
            avatar: avatarKeyword,
        })
        .select()
        .single()

    if (playerError) {
        console.error("Error joining room:", playerError)
        throw new Error("Failed to join room")
    }

    await supabase.channel(`room:${roomId}`).send({
        type: "broadcast",
        event: "player_joined",
        payload: {player: playerData},
    })

    return {avatarKeyword}
}

export async function startGame(roomId: string) {
    const supabase = await createClient()

    const {data, error} = await supabase
        .from("rooms")
        .update({game_state: "theme_input"})
        .eq("room_id", roomId)
        .select()
        .single()

    if (error) {
        console.error("Error starting game:", error)
        throw new Error("Failed to start game")
    }

    // Broadcast the game started event
    await supabase.channel(`room:${roomId}`).send({
        type: "broadcast",
        event: "game_started",
        payload: {roomId},
    })

    return data
}

export async function sendAllThemesSubmittedEvent(roomId: string) {
    const supabase = await createClient()
    const user = await getCurrentUser()
    if (!user) throw new Error("User not authenticated")

    // Update the game state to "answer_input"
    const { error: updateError } = await supabase
        .from("rooms")
        .update({ game_state: "answer_input", current_round: 0 })
        .eq("room_id", roomId)

    if (updateError) {
        console.error("Error updating game state:", updateError)
        throw new Error("Failed to update game state")
    }

    await supabase.channel(`room:${roomId}`).send({
        type: "broadcast",
        event: "all_themes_submitted",
        payload: {roomId}
    })
}

export async function submitAnswer(roomId: string, playerId: number, answer: string) {
    const supabase = await createClient()
    const user = await getCurrentUser()
    if (!user) throw new Error("User not authenticated")

    const {data: room, error: roomError} = await supabase
        .from("rooms")
        .select("current_round, themes(id)")
        .eq("room_id", roomId)
        .single()

    if (roomError) {
        console.error("Error fetching room:", roomError)
        throw new Error("Failed to fetch room data")
    }

    console.log(room)

    const currentTheme = room.themes[room.current_round]

    const {data: answerData, error: answerError} = await supabase
        .from("answers")
        .insert({
            theme_id: currentTheme.id,
            player_id: playerId,
            answer,
        })
        .select("*, player:players(id, name)")
        .single()

    if (answerError) {
        console.error("Error submitting answer:", answerError)
        throw new Error("Failed to submit answer")
    }

    const {error: playerUpdateError} = await supabase
        .from("players")
        .update({answer_ready: true})
        .eq("id", playerId)

    if (playerUpdateError) {
        console.error("Error updating player answer_ready status:", playerUpdateError)
        throw new Error("Failed to update player status")
    }

    const answerToSend: Answer = {
        id: answerData.id,
        theme_id: answerData.theme_id,
        player_id: answerData.player.id,
        player_name: answerData.player.name,
        answer: answerData.answer,
        invalid: answerData.invalid,
    }

    await supabase.channel(`room:${roomId}`).send({
        type: "broadcast",
        event: "answer_submitted",
        payload: {answer: answerToSend},
    })

    // Check if all players have submitted their answers
    const {count: playerCount, error: playerCountError} = await supabase
        .from("players")
        .select("id", {count: "exact"})
        .eq("room_id", roomId)

    const {count: answerCount, error: answerCountError} = await supabase
        .from("answers")
        .select("id", {count: "exact"})
        .eq("theme_id", currentTheme.id)

    if (playerCountError || answerCountError) {
        console.error("Error checking answer submission status:", playerCountError || answerCountError)
    } else if (answerCount === playerCount) {
        // All players have submitted answers
        await supabase.channel(`room:${roomId}`).send({
            type: "broadcast",
            event: "all_answers_submitted",
            payload: {roomId, themeId: currentTheme.id},
        })
    }

    return answerData
}

export async function markAnswerInvalid(roomId: string, answerId: string) {
    const supabase = await createClient()

    // Update the answer in the database
    const {data, error} = await supabase.from("answers").update({invalid: true}).eq("id", answerId).select().single()

    if (error) {
        console.error("Error marking answer as invalid:", error)
        throw new Error("Failed to mark answer as invalid")
    }

    // Broadcast the change to all clients
    await supabase.channel(`room:${roomId}`).send({
        type: "broadcast",
        event: "answer_invalidated",
        payload: {answerId, themeId: data.theme_id},
    })

    return data
}

export async function finishReview(roomId: string, themeId: number) {
    const supabase = await createClient()

    // Call the finish_review_and_calculate_scores function with both parameters
    const {error} = await supabase.rpc("finish_review_and_calculate_scores", {
        p_room_id: roomId,
        p_theme_id: themeId,
    })

    if (error) {
        console.error("Error finishing review:", error)
        throw new Error("Failed to finish review")
    }

    // Fetch the updated room state
    const {data: room, error: roomError} = await supabase
        .from("rooms")
        .select("game_state, current_round")
        .eq("room_id", roomId)
        .single()

    if (roomError) {
        console.error("Error fetching updated room state:", roomError)
        throw new Error("Failed to fetch updated room state")
    }

    // Broadcast the updated game state
    await supabase.channel(`room:${roomId}`).send({
        type: "broadcast",
        event: "review_finished",
        payload: {
            roomId,
            newGameState: room.game_state,
            isGameOver: room.game_state === "game_over",
            newRound: room.current_round,
        },
    })

    return room
}

export async function resetGame(roomId: string) {
    const supabase = await createClient()
    const {data, error} = await supabase.rpc("reset_game", {p_room_id: roomId})

    if (error) {
        console.error("Error resetting game:", error)
        throw new Error("Failed to reset game")
    }

    await supabase.channel(`room:${roomId}`).send({
        type: "broadcast",
        event: "game_reset",
        payload: {roomId},
    })

    return data
}

export async function fetchRoomData(roomId: string): Promise<RoomState> {
    const supabase = await createClient()

    const {data: room, error: roomError} = await supabase
        .from("rooms")
        .select(`
      id, 
      room_id, 
      game_state, 
      current_round,
      players (
        id,
        user_id,
        room_id,
        name,
        avatar,
        is_host,
        answer_ready,
        score
      ),
      themes (
        id,
        room_id,
        question,
        author:players!themes_author_id_fkey (name),
        answers (
          id,
          theme_id,
          player_id,
          answer,
          invalid,
          player:players!answers_player_id_fkey (name)
        )
      )
    `)
        .eq("room_id", roomId)
        .single()

    if (roomError) {
        console.error("Error fetching room data:", roomError)
        throw roomError
    }

    console.log(room)

    // Transform the data to include player_name in answers
    const transformedRoom = {
        ...room,
        themes: room.themes.map((theme: any) => ({
            ...theme,
            answers: theme.answers.map((answer: any) => ({
                ...answer,
                player_name: answer.player.name,
            })),
        })),
    }

    console.log("tr: ", transformedRoom)

    return transformedRoom as RoomState
}

export async function fetchPlayers(roomId: string): Promise<Player[]> {
    const supabase = await createClient()
    const {data, error} = await supabase.from("players").select("*").eq("room_id", roomId)

    if (error) {
        console.error("Error fetching players:", error)
        throw error
    }

    return data as Player[]
}

export async function fetchAnswersForTheme(roomId: string, themeId: number): Promise<Answer[]> {
    const supabase = await createClient()

    const {data, error} = await supabase.from("answers").select("*, player:players(id, name)").eq("theme_id", themeId)

    if (error) {
        console.error("Error fetching answers:", error)
        throw error
    }

    return data.map((answer: any) => ({
        id: answer.id,
        theme_id: answer.theme_id,
        player_id: answer.player.id,
        player_name: answer.player.name,
        answer: answer.answer,
        invalid: answer.invalid,
    }))
}

export async function fetchFinalGameData(roomId: string) {
    const supabase = await createClient()

    const {data: players, error: playersError} = await supabase
        .from("players")
        .select("*")
        .eq("room_id", roomId)
        .order("score", {ascending: false})

    if (playersError) {
        console.error("Error fetching players:", playersError)
        throw new Error("Failed to fetch players")
    }

    const {data: themes, error: themesError} = await supabase
        .from("themes")
        .select(`
      id,
      question,
      author:players!themes_author_id_fkey(name),
      answers(id, player_id, answer, invalid, player:players!answers_player_id_fkey(name))
    `)
        .eq("room_id", roomId)
        .order("id", {ascending: true})

    if (themesError) {
        console.error("Error fetching themes:", themesError)
        throw new Error("Failed to fetch themes")
    }

    // Transform the data to include player_name directly in answers
    const transformedThemes = themes.map((theme) => ({
        ...theme,
        answers: theme.answers.map((answer) => ({
            ...answer,
            player_name: answer.player.name,
        })),
    }))

    return {players, themes: transformedThemes}
}

export async function submitTheme(roomId: string, question: string, playerId: number) {
    const supabase = await createClient()
    const user = await getCurrentUser()
    if (!user) throw new Error("User not authenticated")

    const {data, error} = await supabase
        .from("themes")
        .insert({
            room_id: roomId,
            question: question,
            author_id: playerId,
        })
        .select("*, author:players!themes_author_id_fkey(name)")
        .single()

    if (error) {
        console.error("Error submitting theme:", error)
        throw new Error("Failed to submit theme")
    }

    await supabase.channel(`room:${roomId}`).send({
        type: "broadcast",
        event: "theme_submitted",
        payload: {theme: data},
    })

    return data
}

export async function removeTheme(roomId: string, themeId: number) {
    const supabase = await createClient()
    const user = await getCurrentUser()
    if (!user) throw new Error("User not authenticated")

    const {data, error} = await supabase.from("themes").delete().eq("id", themeId).eq("room_id", roomId)

    if (error) {
        console.error("Error removing theme:", error)
        throw new Error("Failed to remove theme")
    }

    await supabase.channel(`room:${roomId}`).send({
        type: "broadcast",
        event: "theme_removed",
        payload: {themeId},
    })

    return data
}
