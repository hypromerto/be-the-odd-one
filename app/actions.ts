'use server'

import { nanoid } from 'nanoid'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { RoomState, Player, Theme } from '@/lib/types'

const AVATAR_KEYWORDS = ['cat', 'dog', 'rabbit', 'fox', 'owl', 'penguin', 'koala', 'panda', 'tiger', 'lion']

export async function createRoom(playerName: string) {
  const supabase = createServerActionClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const roomId = nanoid(10)
  const avatarKeyword = AVATAR_KEYWORDS[Math.floor(Math.random() * AVATAR_KEYWORDS.length)]

  const initialRoomState: RoomState = {
    roomId: roomId,
    players: [{ id: user.id, name: playerName, avatar: avatarKeyword, isHost: true, ready: false }],
    gameState: 'waiting',
    currentRound: 0,
    themes: []
  }

  const { data, error } = await supabase
      .from('rooms')
      .insert(initialRoomState)
      .select()

  if (error) {
    console.error('Error creating room:', error)
    throw new Error('Failed to create room')
  }

  await supabase.channel(roomId).subscribe()

  return { roomId, avatarKeyword }
}

export async function joinRoom(roomId: string, playerName: string) {
  const supabase = createServerActionClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const avatarKeyword = AVATAR_KEYWORDS[Math.floor(Math.random() * AVATAR_KEYWORDS.length)]

  const { data: room, error: fetchError } = await supabase
      .from('rooms')
      .select('players, gameState')
      .eq('roomId', roomId)
      .single()

  if (fetchError) {
    console.error('Error fetching room:', fetchError)
    throw new Error('Failed to join room')
  }

  if (room.gameState !== 'waiting') {
    throw new Error('Game has already started')
  }

  const updatedPlayers = [...(room.players || []), { id: user.id, name: playerName, avatar: avatarKeyword, isHost: false, ready: false }]

  const { error: updateError } = await supabase
      .from('rooms')
      .update({ players: updatedPlayers })
      .eq('roomId', roomId)

  if (updateError) {
    console.error('Error updating room:', updateError)
    throw new Error('Failed to join room')
  }

  await supabase.channel(roomId).send({
    type: 'broadcast',
    event: 'player_joined',
    payload: { player_id: user.id, player_name: playerName, avatar: avatarKeyword }
  })

  return { avatarKeyword }
}

export async function startGame(roomId: string) {
  const supabase = createServerActionClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: room, error: fetchError } = await supabase
      .from('rooms')
      .select('players')
      .eq('roomId', roomId)
      .single()

  if (fetchError) {
    console.error('Error fetching room:', fetchError)
    throw new Error('Failed to start game')
  }

  if (room.players.length < 3) {
    throw new Error('Not enough players to start the game')
  }

  const { error } = await supabase
      .from('rooms')
      .update({
        gameState: 'theme_input'
      })
      .eq('roomId', roomId)

  if (error) {
    console.error('Error starting game:', error)
    throw new Error('Failed to start game')
  }

  await supabase.channel(roomId).send({
    type: 'broadcast',
    event: 'game_started',
    payload: {}
  })
}

export async function submitThemes(roomId: string, themes: string[]) {
  const supabase = createServerActionClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: room, error: fetchError } = await supabase
      .from('rooms')
      .select('themes, players')
      .eq('roomId', roomId)
      .single()

  if (fetchError) {
    console.error('Error fetching room:', fetchError)
    throw new Error('Failed to submit themes')
  }

  const currentPlayer = room.players.find((p: Player) => p.id === user.id)
  if (!currentPlayer) throw new Error('Player not found in room')

  const updatedThemes = [...(room.themes || []), ...themes.map(theme => ({ question: theme, author: currentPlayer.name, answers: [] }))]
  const updatedPlayers = room.players.map((player: Player) =>
      player.id === user.id ? { ...player, ready: true } : player
  )

  const { error: updateError } = await supabase
      .from('rooms')
      .update({ themes: updatedThemes, players: updatedPlayers })
      .eq('roomId', roomId)

  if (updateError) {
    console.error('Error updating room:', updateError)
    throw new Error('Failed to submit themes')
  }

  await supabase.channel(roomId).send({
    type: 'broadcast',
    event: 'themes_submitted',
    payload: { playerName: currentPlayer.name }
  })

  // Check if all players are ready
  const allReady = updatedPlayers.every((player: Player) => player.ready)
  if (allReady) {
    await supabase.from('rooms').update({ gameState: 'answer_input', currentRound: 0 }).eq('roomId', roomId)
    await supabase.channel(roomId).send({
      type: 'broadcast',
      event: 'all_players_ready',
      payload: {}
    })
  }
}

export async function submitAnswer(roomId: string, answer: string) {
  const supabase = createServerActionClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: room, error: fetchError } = await supabase
      .from('rooms')
      .select('themes, players, currentRound')
      .eq('roomId', roomId)
      .single()

  if (fetchError) {
    console.error('Error fetching room:', fetchError)
    throw new Error('Failed to submit answer')
  }

  const currentPlayer = room.players.find((p: Player) => p.id === user.id)
  if (!currentPlayer) throw new Error('Player not found in room')

  const currentTheme = room.themes[room.currentRound]
  const updatedThemes = room.themes.map((theme: Theme, index: number) =>
      index === room.currentRound
          ? { ...theme, answers: [...theme.answers, { playerId: user.id, playerName: currentPlayer.name, answer, invalid: false }] }
          : theme
  )


  const { error: updateError } = await supabase
      .from('rooms')
      .update({
        themes: updatedThemes
      })
      .eq('roomId', roomId)

  if (updateError) {
    console.error('Error updating room:', updateError)
    throw new Error('Failed to submit answer')
  }

  await supabase.channel(roomId).send({
    type: 'broadcast',
    event: 'answer_submitted',
    payload: { playerName: currentPlayer.name }
  })

  // Check if all players have answered
  const updatedCurrentTheme = updatedThemes[room.currentRound]
  if (updatedCurrentTheme.answers.length === room.players.length) {
    await supabase.from('rooms').update({ gameState: 'review' }).eq('roomId', roomId)
    await supabase.channel(roomId).send({
      type: 'broadcast',
      event: 'all_answers_submitted',
      payload: {}
    })
  }
}

export async function markAnswerInvalid(roomId: string, answerId: string) {
  const supabase = createServerActionClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: room, error: fetchError } = await supabase
      .from('rooms')
      .select('themes, players, currentRound')
      .eq('roomId', roomId)
      .single()

  if (fetchError) {
    console.error('Error fetching room:', fetchError)
    throw new Error('Failed to mark answer as invalid')
  }

  const currentTheme = room.themes[room.currentRound]
  const updatedThemes = room.themes.map((theme: Theme, index: number) =>
      index === room.currentRound
          ? {
            ...theme,
            answers: theme.answers.map((answer: any) =>
                answer.playerId === answerId
                    ? { ...answer, invalid: true }
                    : answer
            )
          }
          : theme
  )

  const { error: updateError } = await supabase
      .from('rooms')
      .update({ themes: updatedThemes })
      .eq('roomId', roomId)

  if (updateError) {
    console.error('Error updating room:', updateError)
    throw new Error('Failed to mark answer as invalid')
  }

  await supabase.channel(roomId).send({
    type: 'broadcast',
    event: 'answer_invalidated',
    payload: { answerId }
  })
}

export async function calculateFinalScores(roomId: string) {
  const supabase = createServerActionClient({ cookies })
  const { data: room, error: fetchError } = await supabase
      .from('rooms')
      .select('themes, players')
      .eq('roomId', roomId)
      .single()

  if (fetchError) {
    console.error('Error fetching room:', fetchError)
    throw new Error('Failed to calculate final scores')
  }

  const playerScores = room.players.reduce((scores: {[key: string]: number}, player: Player) => {
    scores[player.id] = 0
    return scores
  }, {})

  room.themes.forEach((theme: Theme) => {
    theme.answers.forEach(answer => {
      if (!theme.answers.some(a => a.playerId !== answer.playerId && a.answer.toLowerCase() === answer.answer.toLowerCase()) && !answer.invalid) {
        playerScores[answer.playerId]++
      }
    })
  })

  const updatedPlayers = room.players.map((player: Player) => ({
    ...player,
    score: playerScores[player.id]
  }))

  const { error: updateError } = await supabase
      .from('rooms')
      .update({ players: updatedPlayers, gameState: 'game_over' })
      .eq('roomId', roomId)

  if (updateError) {
    console.error('Error updating room:', updateError)
    throw new Error('Failed to update final scores')
  }

  await supabase.channel(roomId).send({
    type: 'broadcast',
    event: 'game_over',
    payload: { players: updatedPlayers }
  })
}

export async function finishReview(roomId: string) {
  const supabase = createServerActionClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: room, error: fetchError } = await supabase
      .from('rooms')
      .select('themes, players, currentRound')
      .eq('roomId', roomId)
      .single()

  if (fetchError) {
    console.error('Error fetching room:', fetchError)
    throw new Error('Failed to finish review')
  }

  const nextRound = room.currentRound + 1
  if (nextRound < room.themes.length) {
    const { error: updateError } = await supabase
        .from('rooms')
        .update({ gameState: 'answer_input', currentRound: nextRound })
        .eq('roomId', roomId)

    if (updateError) {
      console.error('Error updating room:', updateError)
      throw new Error('Failed to finish review')
    }

    await supabase.channel(roomId).send({
      type: 'broadcast',
      event: 'review_finished',
      payload: { nextGameState: 'answer_input', nextRound }
    })
  } else {
    await calculateFinalScores(roomId)
  }
}

export async function resetGame(roomId: string) {
  const supabase = createServerActionClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: room, error: fetchError } = await supabase
      .from('rooms')
      .select('players')
      .eq('roomId', roomId)
      .single()

  if (fetchError) {
    console.error('Error fetching room:', fetchError)
    throw new Error('Failed to reset game')
  }

  const { error: updateError } = await supabase
      .from('rooms')
      .update({
        gameState: 'waiting',
        currentRound: 0,
        themes: [],
        players: room.players.map((player: Player) => ({ ...player, ready: false, score: 0 }))
      })
      .eq('roomId', roomId)

  if (updateError) {
    console.error('Error resetting game:', updateError)
    throw new Error('Failed to reset game')
  }

  await supabase.channel(roomId).send({
    type: 'broadcast',
    event: 'game_reset',
    payload: {}
  })
}

