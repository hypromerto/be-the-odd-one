"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import type { RoomState} from "@/lib/types"
import { fetchRoomData, fetchAnswersForTheme, fetchFinalGameData, fetchPlayers } from "@/app/actions"
import { getCurrentUser, signInAnonymously } from "@/lib/client_auth"
import {createClient} from "@/utils/supabase/client";

interface GameChannelContextType {
    gameState: RoomState | null
    setGameState: React.Dispatch<React.SetStateAction<RoomState | null>>
}

const GameChannelContext = createContext<GameChannelContextType | undefined>(undefined)

export const useGameChannel = (): GameChannelContextType => {
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
    const [gameState, setGameState] = useState<RoomState | null>(null)
    const supabase = createClient()
    const channelRef = useRef<RealtimeChannel | null>(null)

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                let user = await getCurrentUser()

                if (!user) {
                    // If no user, attempt to sign in anonymously
                    user = await signInAnonymously()
                }

                if (!user) {
                    throw new Error("Failed to authenticate user")
                }

                const roomData = await fetchRoomData(roomId)
                setGameState((prev) => ({
                    ...roomData,
                    currentUserId: user.id,
                }))
                console.log("Context user id", user.id)
            } catch (error) {
                console.error("Error fetching initial game data:", error)
                setGameState(null) // Set game state to null to indicate an error
            }
        }

        fetchInitialData()
    }, [roomId])

    useEffect(() => {
        const channel = supabase.channel(`room:${roomId}`)

        channel
            .on("broadcast", { event: "player_joined" }, ({ payload }) => {
                setGameState((prev): RoomState | null =>
                    prev
                        ? {
                            ...prev,
                            players: [...prev.players, payload.player],
                        }
                        : null,
                )
            })
            .on("broadcast", { event: "answer_submitted" }, ({ payload }) => {
                setGameState((prev): RoomState | null =>
                    prev
                        ? {
                            ...prev,
                            themes: prev.themes.map((theme) =>
                                theme.id === payload.answer.theme_id
                                    ? {
                                        ...theme,
                                        answers: [...(theme.answers || []), payload.answer],
                                    }
                                    : theme,
                            ),
                            players: prev.players.map((player) =>
                                player.id === payload.answer.player_id ? { ...player, answer_ready: true } : player,
                            ),
                        }
                        : null,
                )
            })
            .on("broadcast", { event: "answer_invalidated" }, ({ payload }) => {
                setGameState((prev): RoomState | null =>
                    prev
                        ? {
                            ...prev,
                            themes: prev.themes.map((theme) =>
                                theme.id === payload.themeId
                                    ? {
                                        ...theme,
                                        answers: theme.answers.map((answer) =>
                                            answer.id === payload.answerId ? { ...answer, invalid: true } : answer,
                                        ),
                                    }
                                    : theme,
                            ),
                        }
                        : null,
                )
            })
            .on("broadcast", { event: "game_started" }, () => {
                setGameState((prev): RoomState | null =>
                    prev
                        ? {
                            ...prev,
                            game_state: "theme_input",
                            current_round: 0,
                        }
                        : null,
                )
            })
            .on("broadcast", { event: "all_themes_submitted" }, async () => {
                setGameState((prev): RoomState | null =>
                    prev
                        ? {
                            ...prev,
                            game_state: "answer_input",
                            current_round: 0,
                        }
                        : null,
                )
            })
            .on("broadcast", { event: "all_answers_submitted" }, ({ payload }) => {
                setGameState((prev): RoomState | null => {
                    if (!prev) return null

                    const currentTheme = prev.themes.find((theme) => theme.id === payload.themeId)
                    if (!currentTheme) return prev

                    const expectedAnswerCount = prev.players.length
                    const currentAnswerCount = currentTheme.answers ? currentTheme.answers.length : 0

                    if (currentAnswerCount !== expectedAnswerCount) {
                        fetchAnswersForTheme(roomId, payload.themeId).then((answers) => {
                            setGameState((prevState): RoomState | null =>
                                prevState
                                    ? {
                                        ...prevState,
                                        themes: prevState.themes.map((theme) =>
                                            theme.id === payload.themeId ? { ...theme, answers } : theme,
                                        ),
                                        game_state: "review",
                                    }
                                    : null,
                            )
                        })
                    }

                    return {
                        ...prev,
                        game_state: "review",
                    }
                })
            })
            .on("broadcast", { event: "review_finished" }, async ({ payload }) => {
                if (payload.isGameOver) {
                    try {
                        const { players, themes } = await fetchFinalGameData(roomId)
                        setGameState((prev): RoomState | null =>
                            prev
                                ? {
                                    ...prev,
                                    game_state: "game_over",
                                    players: players.map((player) => ({ ...player, answer_ready: false })),
                                    themes,
                                }
                                : null,
                        )
                    } catch (error) {
                        console.error("Error fetching final game data:", error)
                    }
                } else {
                    try {
                        const updatedPlayers = await fetchPlayers(roomId)
                        setGameState((prev): RoomState | null =>
                            prev
                                ? {
                                    ...prev,
                                    game_state: payload.newGameState,
                                    current_round: payload.newRound,
                                    players: updatedPlayers.map((player) => ({ ...player, answer_ready: false })),
                                }
                                : null,
                        )
                    } catch (error) {
                        console.error("Error fetching updated player data:", error)
                    }
                }
            })
            .on("broadcast", { event: "game_reset" }, async () => {
                try {
                    const roomData = await fetchRoomData(roomId)
                    setGameState(
                        (prev): RoomState => ({
                            ...roomData,
                            players: roomData.players.map((player) => ({
                                ...player,
                                answer_ready: false,
                                score: 0,
                            })),
                            themes: [],
                            currentUserId: prev ? prev.currentUserId : null,
                        }),
                    )
                } catch (error) {
                    console.error("Error fetching room data after game reset:", error)
                }
            })
            .on("broadcast", { event: "theme_removed" }, ({ payload }) => {
                setGameState((prev): RoomState | null =>
                    prev
                        ? {
                            ...prev,
                            themes: prev.themes.filter((theme) => theme.id !== payload.themeId),
                        }
                        : null,
                )
            })
            .on("broadcast", { event: "theme_submitted" }, ({ payload }) => {
                setGameState((prev): RoomState | null =>
                    prev
                        ? {
                            ...prev,
                            themes: [...prev.themes, payload.theme],
                        }
                        : null,
                )
            })
            .subscribe((status) => {})

        channelRef.current = channel

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
                channelRef.current = null
            }
        }
    }, [roomId, supabase]) // Added supabase to the dependency array

    useEffect(() => {
        if (gameState?.game_state === "answer_input") {
            setGameState((prev): RoomState | null =>
                prev
                    ? {
                        ...prev,
                        players: prev.players.map((player) => ({ ...player, answer_ready: false })),
                    }
                    : null,
            )
        }
    }, [gameState?.current_round, gameState?.game_state])

    return <GameChannelContext.Provider value={{ gameState, setGameState }}>{children}</GameChannelContext.Provider>
}

