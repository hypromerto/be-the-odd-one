"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import {
    fetchAnswersForTheme,
    fetchRoomData,
    startGame,
    fetchPlayerScores,
    submitAnswer,
    submitTheme,
    removeTheme,
    finishReview,
    resetGame,
    joinRoom,
    markAnswerInvalid, setGameState, sendAllThemesSubmittedEvent, submitInvalidationVote,
} from "@/app/actions"
import { getCurrentUser, signInAnonymously } from "@/lib/client_auth"
import type { Answer, Player, Theme } from "@/lib/types"
import { getOrCreateChannel, removeChannel } from "@/utils/supabase/channel"

interface RoomState {
    id: string
    game_state: "waiting" | "theme_input" | "answer_input" | "review" | "game_over" | "loading"
    players: Player[]
    themes: Theme[]
    current_round: number
    is_timed_mode: boolean
    selected_theme_pack_id: number | null
    num_themes: number
    currentUserId: string | null
    theme_pack_language?: string
    theme_source: "custom" | "pack"
    timer_started: boolean
    current_theme_id: number | null
    first_submit_player_id: number
}

interface GameSettings {
    isTimedMode: boolean
    selectedThemePack: number | null
    numThemes: number
    themePackLanguage?: string
    themeSource: "custom" | "pack"
}

// Define action types
type Action =
    | { type: "SET_INITIAL_STATE"; payload: RoomState }
    | { type: "PLAYER_JOINED"; payload: Player }
    | { type: "ANSWER_SUBMITTED"; payload: Answer }
    | { type: "ANSWER_INVALIDATED"; payload: { answerId: number; themeId: number } }
    | { type: "GAME_STARTED"; payload: { gameState: string; themes: Theme[] } }
    | { type: "ALL_THEMES_SUBMITTED" }
    | { type: "ALL_ANSWERS_SUBMITTED"; payload: { themeId: number; answers: Answer[] } }
    | {
    type: "REVIEW_FINISHED"
    payload: { newGameState: string; newRound: number; updatedScores: { id: number; score: number }[] }
}
    | { type: "GAME_RESET"; payload: RoomState }
    | { type: "THEME_REMOVED"; payload: { themeId: number } }
    | { type: "THEME_SUBMITTED"; payload: { theme: Theme } }
    | { type: "GAME_SETTINGS_UPDATED"; payload: GameSettings }
    | { type: "THEMES_FETCHED"; payload: Theme[] }
    | { type: "NEXT_THEME_FETCHED"; payload: Theme }
    | { type: "TIMER_STARTED"; payload: { themeId: number, playerId: number } }
    | { type: "VOTE_TO_INVALIDATE"; payload: { themeId: number, answerId: number; voterId: number } }

// Reducer function
function gameReducer(state: RoomState, action: Action): RoomState {
    switch (action.type) {
        case "SET_INITIAL_STATE":
            return action.payload
        case "PLAYER_JOINED":
            return { ...state, players: [...state.players, action.payload] }
        case "ANSWER_SUBMITTED":
            return {
                ...state,
                players: state.players.map((player) =>
                    player.id === action.payload.player_id ? { ...player, answer_ready: true } : player,
                ),
            }
        case "ANSWER_INVALIDATED":
            return {
                ...state,
                themes: state.themes.map((theme) =>
                    theme.id === action.payload.themeId
                        ? {
                            ...theme,
                            answers: theme.answers.map((answer) =>
                                answer.id === action.payload.answerId ? { ...answer, invalid: true } : answer,
                            ),
                        }
                        : theme,
                ),
            }
        case "GAME_STARTED":
            return {
                ...state,
                game_state: action.payload.gameState,
                current_round: 0,
                themes: action.payload.themes,
            }
        case "ALL_THEMES_SUBMITTED":
            return { ...state, game_state: "answer_input", current_round: 0 }
        case "ALL_ANSWERS_SUBMITTED":
            return {
                ...state,
                game_state: "review",
                themes: state.themes.map((theme) =>
                    theme.id === action.payload.themeId
                        ? {
                            ...theme,
                            answers: action.payload.answers,
                        }
                        : theme,
                ),
                timer_started: false,
                first_submit_player_id: null,
            }
        case "REVIEW_FINISHED":
            return {
                ...state,
                game_state: action.payload.newGameState,
                current_round: action.payload.newRound,
                players: state.players.map((player) => {
                    const updatedScore = action.payload.updatedScores.find((s) => s.id === player.id)?.score
                    return updatedScore !== undefined ? { ...player, score: updatedScore, answer_ready: false } : player
                }),
                timer_started: false,
                first_submit_player_id: null,
            }
        case "GAME_RESET":
            return { ...action.payload, currentUserId: state?.currentUserId, timer_started: false, current_theme_id: null, first_submit_player_id: null }
        case "THEME_REMOVED":
            return { ...state, themes: state.themes.filter((theme) => theme.id !== action.payload.themeId) }
        case "THEME_SUBMITTED":
            return { ...state, themes: [...state.themes, action.payload.theme] }
        case "GAME_SETTINGS_UPDATED":
            return {
                ...state,
                is_timed_mode: action.payload.isTimedMode,
                selected_theme_pack_id: action.payload.selectedThemePack,
                num_themes: action.payload.numThemes,
                theme_pack_language: action.payload.themePackLanguage,
                theme_source: action.payload.themeSource,
            }
        case "THEMES_FETCHED":
            return {
                ...state,
                themes: action.payload,
            }
        case "NEXT_THEME_FETCHED":
            return {
                ...state,
                themes: [...state.themes, action.payload],
            }
        case "TIMER_STARTED":
            return {
                ...state,
                timer_started: true,
                first_submit_player_id: action.payload.playerId,
                current_theme_id: action.payload.themeId,
            }
        case "VOTE_TO_INVALIDATE":
            console.log("VOTE_TO_INVALIDATE", action.payload)
            return {
                ...state,
                themes: state.themes.map((theme) =>
                    theme.id === action.payload.themeId
                        ? {
                            ...theme,
                            answers: theme.answers.map((answer) =>
                                answer.id === action.payload.answerId ? { ...answer, invalidation_votes: [...answer.invalidation_votes, action.payload.voterId] } : answer,
                            ),
                        }
                        : theme,
                ),
            }
        default:
            return state
    }
}

const GameChannelContext = createContext<
    | {
    state: RoomState | null
    dispatch: React.Dispatch<Action>
    sendBroadcast: (event: string, payload: any) => Promise<void>
}
    | undefined
>(undefined)

export const useGameChannel = (): {
    state: RoomState | null
    dispatch: React.Dispatch<Action>
    sendBroadcast: (event: string, payload: any) => Promise<void>
} => {
    const context = useContext(GameChannelContext)
    if (context === undefined) {
        throw new Error("useGameChannel must be used within a GameChannelProvider")
    }
    return context
}

interface GameChannelProviderProps {
    children: React.ReactNode
    roomId: string
}

export const GameChannelProvider: React.FC<GameChannelProviderProps> = ({ children, roomId }) => {
    const [state, dispatch] = useReducer(gameReducer, {
        id: roomId,
        game_state: "loading",
        players: [],
        themes: [],
        current_round: 0,
        is_timed_mode: false,
        selected_theme_pack_id: null,
        num_themes: 0,
        currentUserId: null,
        timer_started: false,
        current_theme_id: null,
        theme_source: "custom",
    })

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                let user = await getCurrentUser()
                if (!user) {
                    user = await signInAnonymously()
                }
                if (!user) {
                    throw new Error("Failed to authenticate user")
                }
                const roomData = await fetchRoomData(roomId)
                dispatch({
                    type: "SET_INITIAL_STATE",
                    payload: { ...roomData, currentUserId: user.id, timer_started: false, current_theme_id: null },
                })
            } catch (error) {
                console.error("Error fetching initial game data:", error)
            }
        }

        fetchInitialData()
    }, [roomId])

    useEffect(() => {
        const channel = getOrCreateChannel(roomId)

        channel
            .on("broadcast", { event: "player_joined" }, ({ payload }) => {
                dispatch({ type: "PLAYER_JOINED", payload: payload.player })
            })
            .on("broadcast", { event: "answer_submitted" }, ({ payload }) => {
                dispatch({ type: "ANSWER_SUBMITTED", payload: payload.answer })
            })
            .on("broadcast", { event: "answer_invalidated" }, ({ payload }) => {
                dispatch({ type: "ANSWER_INVALIDATED", payload: payload })
            })
            .on("broadcast", { event: "game_started" }, ({ payload }) => {
                dispatch({
                    type: "GAME_STARTED",
                    payload: {
                        gameState: payload.gameState,
                        themes: payload.themes,
                    },
                })
            })
            .on("broadcast", { event: "all_themes_submitted" }, () => {
                dispatch({ type: "ALL_THEMES_SUBMITTED" })
            })
            .on("broadcast", { event: "all_answers_submitted" }, async ({ payload }) => {
                try {
                    const answers = await fetchAnswersForTheme(roomId, payload.themeId)
                    dispatch({ type: "ALL_ANSWERS_SUBMITTED", payload: { themeId: payload.themeId, answers } })
                } catch (error) {
                    console.error("Error fetching answers:", error)
                }
            })
            .on("broadcast", { event: "review_finished" }, async ({ payload }) => {
                try {
                    const updatedScores = await fetchPlayerScores(roomId)
                    dispatch({
                        type: "REVIEW_FINISHED",
                        payload: { ...payload, updatedScores },
                    })
                } catch (error) {
                    console.error("Error fetching updated scores:", error)
                }
            })
            .on("broadcast", { event: "game_reset" }, async () => {
                try {
                    const roomData = await fetchRoomData(roomId)
                    dispatch({
                        type: "GAME_RESET",
                        payload: roomData,
                    })
                } catch (error) {
                    console.error("Error fetching room data after game reset:", error)
                }
            })
            .on("broadcast", { event: "theme_removed" }, ({ payload }) => {
                dispatch({ type: "THEME_REMOVED", payload: payload })
            })
            .on("broadcast", { event: "theme_submitted" }, ({ payload }) => {
                dispatch({ type: "THEME_SUBMITTED", payload: payload })
            })
            .on("broadcast", { event: "game_settings_updated" }, ({ payload }) => {
                dispatch({ type: "GAME_SETTINGS_UPDATED", payload: payload.settings })
            })
            .on("broadcast", { event: "timer_started" }, ({ payload }) => {
                dispatch({ type: "TIMER_STARTED", payload: { themeId: payload.themeId, playerId: payload.playerId }})
            })
            .on("broadcast", { event: "vote_to_invalidate" }, ({ payload }) => {
                dispatch({ type: "VOTE_TO_INVALIDATE", payload: { themeId: payload.themeId, answerId: payload.answerId, voterId: payload.voterId } })
            })
            .subscribe((status) => {
                console.log("Channel status:", status)
            })

        return () => {
            removeChannel(roomId)
        }
    }, [roomId])

    const sendBroadcast = async (event: string, payload: any) => {
        const channel = getOrCreateChannel(roomId)
        await channel.send({
            type: "broadcast",
            event: event,
            payload: payload,
        })
    }

    return (
        <GameChannelContext.Provider value={{ state, dispatch, sendBroadcast }}>{children}</GameChannelContext.Provider>
    )
}

// Custom hooks for game actions
export const useStartGame = (roomId: string) => {
    const { dispatch, sendBroadcast } = useContext(GameChannelContext)
    return async (gameSettings: {
        themeSource: "custom" | "pack"
        selectedThemePack: number | null
        numThemes: number
        isTimedMode: boolean
    }) => {
        try {
            const result = await startGame(roomId, gameSettings)

            if (!result.themes) {
                result.themes = []
            }

            dispatch({
                type: "GAME_STARTED",
                payload: { gameState: result.game_state, themes: result.themes },
            })
            await sendBroadcast("game_started", { gameState: result.game_state, themes: result.themes })
        } catch (error) {
            console.error("Failed to start game:", error)
        }
    }
}

export const useSubmitAnswer = (roomId: string) => {
    const { dispatch, sendBroadcast } = useContext(GameChannelContext)
    return async (playerId: number, themeId: number, answer: string) => {
        try {
            const result = await submitAnswer(roomId, playerId, themeId, answer)
            const answerData = { player_id: playerId, theme_id: themeId }

            if (result.is_first_answer) {
                dispatch({ type: "TIMER_STARTED", payload: { themeId, playerId } })
                await sendBroadcast("timer_started", { themeId, playerId })
            }

            dispatch({ type: "ANSWER_SUBMITTED", payload: answerData })
            await sendBroadcast("answer_submitted", { answer: answerData })
            if (result.all_answered) {
                const answers = await fetchAnswersForTheme(roomId, themeId)
                dispatch({ type: "ALL_ANSWERS_SUBMITTED", payload: { themeId: themeId, answers } })
                await sendBroadcast("all_answers_submitted", { themeId })
            }
        } catch (error) {
            console.error("Failed to submit answer:", error)
        }
    }
}

export const useSubmitTheme = (roomId: string) => {
    const { dispatch, sendBroadcast } = useContext(GameChannelContext)
    return async (question: string, playerId: number) => {
        try {
            const newTheme = await submitTheme(roomId, question, playerId)
            dispatch({ type: "THEME_SUBMITTED", payload: { theme: newTheme } })
            await sendBroadcast("theme_submitted", { theme: newTheme })
        } catch (error) {
            console.error("Failed to submit theme:", error)
        }
    }
}

export const useMarkAsInvalid = (roomId: string) => {
    const { dispatch, sendBroadcast } = useContext(GameChannelContext)
    return async (answerId: number, themeId: number) => {
        try {
            await markAnswerInvalid(roomId, answerId)
            dispatch({ type: "ANSWER_INVALIDATED", payload: { answerId, themeId } })
            await sendBroadcast("answer_invalidated", { answerId, themeId })
        } catch (error) {
            console.error("Failed to mark answer as invalid:", error)
        }
    }
}

export const useRemoveTheme = (roomId: string) => {
    const { dispatch, sendBroadcast } = useContext(GameChannelContext)
    return async (themeId: number) => {
        try {
            await removeTheme(roomId, themeId)
            dispatch({ type: "THEME_REMOVED", payload: { themeId } })
            await sendBroadcast("theme_removed", { themeId })
        } catch (error) {
            console.error("Failed to remove theme:", error)
        }
    }
}

export const useSubmitAllThemes = (roomId: string) => {
    const { dispatch, sendBroadcast } = useContext(GameChannelContext)
    return async (themeCount: number) => {
        try {
            await sendAllThemesSubmittedEvent(roomId, themeCount)
            await sendBroadcast("all_themes_submitted", {})
            dispatch({ type: "ALL_THEMES_SUBMITTED" })
        } catch (error) {
            console.error("Failed to submit all themes:", error)
        }
    }

}

export const useFinishReview = (roomId: string) => {
    const { dispatch, sendBroadcast } = useContext(GameChannelContext)
    return async (themeId: number) => {
        try {
            const result = await finishReview(roomId, themeId)
            dispatch({
                type: "REVIEW_FINISHED",
                payload: {
                    newGameState: result.room.game_state,
                    newRound: result.room.current_round,
                    updatedScores: result.playerScores,
                },
            })
            await sendBroadcast("review_finished", {
                newGameState: result.room.game_state,
                newRound: result.room.current_round,
                updatedScores: result.playerScores,
            })
        } catch (error) {
            console.error("Failed to finish review:", error)
        }
    }
}

export const useResetGame = (roomId: string) => {
    const { dispatch, sendBroadcast } = useContext(GameChannelContext)
    return async () => {
        try {
            await resetGame(roomId)
            try {
                const roomData = await fetchRoomData(roomId)
                dispatch({
                    type: "GAME_RESET",
                    payload: roomData,
                })
            } catch (error) {
                console.error("Error fetching room data after game reset:", error)
            }
            await sendBroadcast("game_reset", {})
        } catch (error) {
            console.error("Failed to reset game:", error)
        }
    }
}

export const useUpdateGameSettings = (roomId: string) => {
    const { dispatch, sendBroadcast } = useContext(GameChannelContext)
    return async (settings: GameSettings) => {
        try {
            dispatch({ type: "GAME_SETTINGS_UPDATED", payload: settings })
            await sendBroadcast("game_settings_updated", { settings })
        } catch (error) {
            console.error("Failed to update game settings:", error)
        }
    }
}

export const useJoinRoom = (roomId: string) => {
    const { dispatch, sendBroadcast } = useContext(GameChannelContext)
    return async (playerName: string, token: string) => {
        try {
            const result = await joinRoom(roomId, playerName, token)
            if (result) {
                dispatch({ type: "PLAYER_JOINED", payload: result })
                await sendBroadcast("player_joined", { player: result })
            } else {
                throw new Error("Failed to join room")
            }
        } catch (error) {
            console.error("Failed to join room:", error)
            throw error
        }
    }
}

export const useExpireTimer = (roomId: string) => {
    const { dispatch, sendBroadcast } = useContext(GameChannelContext)
    return async (themeId: number) => {
        try {
            const answers = await fetchAnswersForTheme(roomId, themeId)
            dispatch({ type: "ALL_ANSWERS_SUBMITTED", payload: { themeId, answers } })
            await sendBroadcast("all_answers_submitted", { themeId })

            await setGameState(roomId, "review")
        } catch (error) {
            console.error("Failed to expire timer:", error)
        }
    }
}

export const useVoteToInvalidate = (roomId: string) => {
    const { dispatch, sendBroadcast } = useContext(GameChannelContext)
    return async (themeId: number, answerId: number, playerId: number, shouldInvalidate: boolean) => {
        try {
            if (shouldInvalidate) {
                // If this vote will make it the majority, invalidate the answer
                dispatch({
                    type: "ANSWER_INVALIDATED",
                    payload: { answerId, themeId },
                })
                await sendBroadcast("answer_invalidated", { answerId, themeId })

                // Also mark the answer as invalid in the database
                await markAnswerInvalid(roomId, answerId)
            } else {
                // Otherwise, just add the vote
                const newVote = await submitInvalidationVote(roomId, answerId, playerId, themeId)
                dispatch({
                    type: "VOTE_TO_INVALIDATE",
                    payload: { themeId, answerId, voterId: playerId },
                })
                await sendBroadcast("vote_to_invalidate", { themeId, answerId, voterId: playerId })
            }
        } catch (error) {
            console.error("Failed to vote for invalidation:", error)
        }
    }
}

