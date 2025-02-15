"use server"

import { createClient } from "@/utils/supabase/server"
import { getCurrentUser, signInAnonymously } from "@/lib/auth"
import { nanoid } from "nanoid"
import type { RoomState, Answer, Player } from "@/lib/types"

const SECRET_KEY = process.env.RECAPTCHA_SECRETKEY
const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=`

const verifyRecaptchaToken = async (token: string) => {
    try {
        const tokenUrl = verifyUrl + token
        const recaptchaRes = await fetch(tokenUrl, { method: "POST" })
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

    const { error: roomError } = await supabase
        .from("rooms")
        .insert({ room_id: roomId, game_state: "waiting", current_round: 0 })

    if (roomError) {
        console.error("Error creating room:", roomError)
        throw new Error("Failed to create room")
    }

    const { data: playerData, error: playerError } = await supabase
        .from("players")
        .insert({
            room_id: roomId,
            user_id: user.id,
            name: playerName,
            avatar: avatarKeyword,
            is_host: true,
            score: 0,
            answer_ready: false,
        })
        .select()
        .single()

    if (playerError) {
        console.error("Error creating player:", playerError)
        throw new Error("Failed to create player")
    }

    // The broadcast will be handled on the client side

    return { roomId, avatarKeyword }
}

export async function joinRoom(roomId: string, playerName: string) {
    const supabase = await createClient()

    let user = await getCurrentUser()
    if (!user) {
        user = await signInAnonymously()
    }

    if (!user) throw new Error("User not authenticated")

    const avatarKeyword = ["cat", "dog", "rabbit", "fox", "koala", "panda", "lion"][Math.floor(Math.random() * 7)]

    const { data: playerData, error: playerError } = await supabase
        .from("players")
        .insert({
            room_id: roomId,
            user_id: user.id,
            name: playerName,
            avatar: avatarKeyword,
            is_host: false,
            score: 0,
            answer_ready: false,
        })
        .select()
        .single()

    if (playerError) {
        console.error("Error joining room:", playerError)
        throw new Error("Failed to join room")
    }

    return playerData
}

export async function startGame(
    roomId: string,
    gameSettings: {
        themeSource: "custom" | "pack"
        selectedThemePack: number | null
        numThemes: number
        isTimedMode: boolean
    },
) {
    const supabase = await createClient()

    const newGameState = gameSettings.themeSource === "custom" ? "theme_input" : "answer_input"
    let themes = null

    if (gameSettings.themeSource === "pack" && gameSettings.selectedThemePack && gameSettings.numThemes) {
        try {
            // Use the updated database function to fetch and insert random themes
            const { error: randomThemesError } = await supabase.rpc("get_random_themes", {
                p_room_id: roomId,
                p_theme_pack_id: gameSettings.selectedThemePack,
                p_num_themes: gameSettings.numThemes,
            })

            if (randomThemesError) {
                console.error("Error fetching and inserting random themes:", randomThemesError)
                throw randomThemesError
            }

            // Fetch the first theme
            const { data: allThemes, error: themesError } = await supabase
                .from("themes")
                .select("id, question")
                .eq("room_id", roomId)
                .order("id", { ascending: true })

            themes = allThemes

            if (themesError) {
                console.error("Error fetching first theme:", themesError)
                throw themesError
            }
        } catch (error) {
            console.error("Error in theme selection process:", error)
            throw new Error("Failed to fetch and insert random themes")
        }
    }

    // Update the room with the new game state and settings
    try {
        const { data, error } = await supabase
            .from("rooms")
            .update({
                game_state: newGameState,
                is_timed_mode: gameSettings.isTimedMode,
                current_round: 0,
                selected_theme_pack_id: gameSettings.selectedThemePack,
                num_themes: gameSettings.numThemes,
                theme_source: gameSettings.themeSource,
            })
            .eq("room_id", roomId)
            .select()
            .single()

        if (error) {
            console.error("Error updating room:", error)
            throw error
        }

        // The broadcast will be handled on the client side

        return { ...data, themes }
    } catch (error) {
        console.error("Error starting game:", error)
        throw new Error("Failed to start game")
    }
}

export async function sendAllThemesSubmittedEvent(roomId: string, themeCount: number) {
    const supabase = await createClient()
    const user = await getCurrentUser()
    if (!user) throw new Error("User not authenticated")

    // Update the game state to "answer_input"
    const { error: updateError } = await supabase
        .from("rooms")
        .update({ game_state: "answer_input", current_round: 0, num_themes: themeCount })
        .eq("room_id", roomId)

    if (updateError) {
        console.error("Error updating game state:", updateError)
        throw new Error("Failed to update game state")
    }

    // The broadcast will be handled on the client side
}

export async function submitAnswer(roomId: string, playerId: number, themeId: number, answer: string) {
    const supabase = await createClient()
    const user = await getCurrentUser()
    if (!user) throw new Error("User not authenticated")

    // Call the submit_answer function
    const { data, error } = await supabase.rpc("submit_answer", {
        p_room_id: roomId,
        p_player_id: playerId,
        p_theme_id: themeId,
        p_answer: answer,
    })

    if (error) {
        console.error("Error submitting answer:", error)
        throw new Error("Failed to submit answer")
    }

    return data[0]
}

export async function markAnswerInvalid(roomId: string, answerId: number) {
    const supabase = await createClient()

    // Update the answer in the database
    const { data, error } = await supabase.from("answers").update({ invalid: true }).eq("id", answerId).select().single()

    if (error) {
        console.error("Error marking answer as invalid:", error)
        throw new Error("Failed to mark answer as invalid")
    }

    // The broadcast will be handled on the client side

    return data
}

export async function setGameState(roomId: string, state: string) {
    const supabase = await createClient()

    // Update the answer in the database
    const { error: updateError } = await supabase.from("rooms").update({ game_state: state }).eq("room_id", roomId)

    if (updateError) {
        console.error("Error setting game state:", updateError)
        throw new Error("Failed to set state")
    }
}

export async function finishReview(roomId: string, themeId: number) {
    const supabase = await createClient()

    // Call the finish_review_and_calculate_scores function
    const { error } = await supabase.rpc("finish_review_and_calculate_scores", {
        p_room_id: roomId,
        p_theme_id: themeId,
    })

    if (error) {
        console.error("Error finishing review:", error)
        throw new Error("Failed to finish review")
    }

    // Fetch the updated room state
    const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("game_state, current_round")
        .eq("room_id", roomId)
        .single()

    if (roomError) {
        console.error("Error fetching updated room state:", roomError)
        throw new Error("Failed to fetch updated room state")
    }

    // Fetch updated player scores
    const { data: players, error: playersError } = await supabase
        .from("players")
        .select("id, score")
        .eq("room_id", roomId)

    if (playersError) {
        console.error("Error fetching updated player scores:", playersError)
        throw new Error("Failed to fetch updated player scores")
    }

    // The broadcast will be handled on the client side

    return { room, playerScores: players }
}

export async function resetGame(roomId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("reset_game", { p_room_id: roomId })

    if (error) {
        console.error("Error resetting game:", error)
        throw new Error("Failed to reset game")
    }
}

export async function fetchRoomData(roomId: string): Promise<RoomState> {
    const supabase = await createClient()

    const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select(`
      id, 
      room_id, 
      game_state, 
      current_round,
      is_timed_mode,
      selected_theme_pack_id,
      num_themes,
      theme_source,
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
        is_custom,
        theme_pack_id,
        theme_order,
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

    // Transform the data to include player_name in answers, add empty answers for non-submitting players, and sort themes
    const transformedRoom = {
        ...room,
        themes: room.themes
            .map((theme) => {
                const themeAnswers = theme.answers || []
                const answeredPlayerIds = new Set(themeAnswers.map((answer) => answer.player_id))

                const emptyAnswers = room.players
                    .filter((player) => !answeredPlayerIds.has(player.id))
                    .map((player, index) => ({
                        id: -(index + 1), // Use negative numbers as IDs for empty answers
                        theme_id: theme.id,
                        player_id: player.id,
                        player_name: player.name,
                        answer: "",
                        invalid: true,
                        created_at: new Date().toISOString(),
                    }))

                return {
                    ...theme,
                    answers: [
                        ...themeAnswers.map((answer) => ({
                            ...answer,
                            player_name: answer.player.name,
                        })),
                        ...emptyAnswers,
                    ],
                }
            })
            .sort((a, b) => (a.theme_order ?? -1) - (b.theme_order ?? -1)),
    }

    return transformedRoom as RoomState
}

export async function fetchPlayers(roomId: string): Promise<Player[]> {
    const supabase = await createClient()
    const { data, error } = await supabase.from("players").select("*").eq("room_id", roomId)

    if (error) {
        console.error("Error fetching players:", error)
        throw error
    }

    return data as Player[]
}

export async function fetchAnswersForTheme(roomId: string, themeId: number): Promise<Answer[]> {
    const supabase = await createClient()

    // First, fetch all players in the room
    const { data: players, error: playersError } = await supabase.from("players").select("id, name").eq("room_id", roomId)

    if (playersError) {
        console.error("Error fetching players:", playersError)
        throw playersError
    }

    // Then, fetch all submitted answers for the theme
    const { data: submittedAnswers, error: answersError } = await supabase
        .from("answers")
        .select("*, player:players(id, name)")
        .eq("theme_id", themeId)

    if (answersError) {
        console.error("Error fetching answers:", answersError)
        throw answersError
    }

    // Create a map of player IDs to their submitted answers
    const answerMap = new Map(submittedAnswers.map((answer) => [answer.player_id, answer]))

    // Create the final array of answers, including empty invalid answers for non-submitting players
    const allAnswers = players.map((player, index) => {
        const submittedAnswer = answerMap.get(player.id)
        if (submittedAnswer) {
            return {
                id: submittedAnswer.id,
                theme_id: submittedAnswer.theme_id,
                player_id: player.id,
                player_name: player.name,
                answer: submittedAnswer.answer,
                invalid: submittedAnswer.invalid,
                created_at: submittedAnswer.created_at,
            }
        } else {
            return {
                id: -(index + 1), // Use negative numbers as IDs for empty answers
                theme_id: themeId,
                player_id: player.id,
                player_name: player.name,
                answer: "",
                invalid: true,
                created_at: new Date().toISOString(),
            }
        }
    })

    return allAnswers
}

export async function fetchFinalGameData(roomId: string) {
    const supabase = await createClient()

    const { data: players, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", roomId)
        .order("score", { ascending: false })

    if (playersError) {
        console.error("Error fetching players:", playersError)
        throw new Error("Failed to fetch players")
    }

    const { data: themes, error: themesError } = await supabase
        .from("themes")
        .select(`
      id,
      question,
      author:players!themes_author_id_fkey(name),
      answers(id, player_id, answer, invalid, player:players!answers_player_id_fkey(name))
    `)
        .eq("room_id", roomId)
        .order("theme_order", { ascending: true })

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

    return { players, themes: transformedThemes }
}

export async function submitTheme(roomId: string, question: string, playerId: number) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("themes")
        .insert({
            room_id: roomId,
            question: question,
            author_id: playerId,
            is_custom: true,
            theme_pack_id: null, // Custom themes don't belong to a theme pack
        })
        .select("*, author:players!themes_author_id_fkey(name)")
        .single()

    if (error) {
        console.error("Error submitting theme:", error)
        throw new Error("Failed to submit theme")
    }

    // The broadcast will be handled on the client side

    return data
}

export async function removeTheme(roomId: string, themeId: number) {
    const supabase = await createClient()
    const user = await getCurrentUser()
    if (!user) throw new Error("User not authenticated")

    const { data, error } = await supabase.from("themes").delete().eq("id", themeId).eq("room_id", roomId)

    if (error) {
        console.error("Error removing theme:", error)
        throw new Error("Failed to remove theme")
    }

    // The broadcast will be handled on the client side

    return data
}

export async function fetchPlayerScores(roomId: string) {
    const supabase = await createClient()

    const { data: players, error } = await supabase.from("players").select("id, score").eq("room_id", roomId)

    if (error) {
        console.error("Error fetching player scores:", error)
        throw new Error("Failed to fetch player scores")
    }

    return players
}

