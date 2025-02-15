"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"
import ThemeInput from "@/components/theme-input"
import AnswerInput from "@/components/answer-input"
import AnswerReviewScreen from "@/components/answer-review-screen"
import GameResults from "@/components/game-results"
import GameProgress from "@/components/game-progress"
import FirstAnswerDisplay from "@/components/FirstAnswerDisplay"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { useGameChannel, useStartGame, useResetGame } from "@/contexts/GameChannelContext"
import Lobby from "@/components/Lobby"
import {Theme} from "@/lib/types";

interface RoomContentProps {
    roomId: string
    currentUserId: string
}

export default function RoomContent({ roomId, currentUserId }: RoomContentProps) {
    const { state: gameState } = useGameChannel()
    const [isStartingGame, setIsStartingGame] = useState(false)
    const [showFirstAnswerDisplay, setShowFirstAnswerDisplay] = useState(false)
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)
    const t = useTranslations("RoomContent")
    const startGame = useStartGame(roomId)
    const resetGame = useResetGame(roomId)

    const isHost = gameState?.players?.some((player) => player.user_id === currentUserId && player.is_host) || false

    let currentTheme: Theme;

    if (gameState?.themes) {
        currentTheme = gameState?.themes[gameState?.current_round] || null
    }
    const currentPlayer = gameState?.players?.find((player) => player.user_id === currentUserId) || null

    useEffect(() => {
        if (gameState?.timer_started) {
            setShowFirstAnswerDisplay(true)
            const timer = setTimeout(() => {
                setShowFirstAnswerDisplay(false)
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [gameState?.timer_started])

    const handleStartGame = async () => {
        if (isStartingGame) return
        setIsStartingGame(true)
        try {
            const gameSettings = {
                themeSource: gameState.theme_source,
                selectedThemePack: gameState.selected_theme_pack_id,
                numThemes: gameState.num_themes,
                isTimedMode: gameState.is_timed_mode,
            }
            await startGame(gameSettings)
        } catch (error) {
            console.error("Failed to start game:", error)
        } finally {
            setIsStartingGame(false)
        }
    }

    const handleResetGame = async () => {
        try {
            await resetGame()
        } catch (error) {
            console.error("Failed to reset game:", error)
        }
    }

    const handleAnswerSubmitStateChange = (isSubmitted: boolean) => {
        setIsAnswerSubmitted(isSubmitted)
    }

    if (gameState.game_state === "loading") {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardContent className="flex flex-col items-center space-y-4 p-6">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-purple-700">{t("loadingGameState")}</CardTitle>
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </CardContent>
            </Card>
        )
    }

    const renderGameContent = () => {
        switch (gameState.game_state) {
            case "waiting":
                return (
                    <Lobby
                        roomId={roomId}
                        players={gameState.players}
                        isHost={isHost}
                        onStartGame={handleStartGame}
                        isStartingGame={isStartingGame}
                    />
                )
            case "theme_input":
                    return (<ThemeInput roomId={roomId} />)
            case "answer_input":
                return (
                    currentTheme && (
                        <AnswerInput
                            roomId={roomId}
                            theme={currentTheme}
                            currentPlayer={currentPlayer}
                            onSubmitStateChange={handleAnswerSubmitStateChange}
                        />
                    )
                )
            case "review":
                return currentTheme && <AnswerReviewScreen roomId={roomId} theme={currentTheme} isHost={isHost} />
            case "game_over":
                return (
                    <GameResults
                        players={gameState.players}
                        themes={gameState.themes}
                        roomId={roomId}
                        isHost={isHost}
                        isTimedMode={gameState.is_timed_mode}
                        themeSource={gameState.theme_source}
                        onResetGame={handleResetGame}
                    />
                )
            default:
                return null
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4 relative">
            <div className="h-16 relative">
                <AnimatePresence>
                    {gameState.is_timed_mode && showFirstAnswerDisplay && !isAnswerSubmitted && (
                        <motion.div
                            className="absolute w-full"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <FirstAnswerDisplay
                                playerName={
                                    gameState?.players.find((p) => p.id === gameState?.first_submit_player_id)?.name || t("someoneElse")
                                }
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {gameState.game_state !== "waiting" && gameState.game_state !== "game_over" && gameState.game_state !== "theme_input" && (
                <GameProgress roomState={gameState} />
            )}
            {renderGameContent()}
        </div>
    )
}

