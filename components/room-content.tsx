"use client"

import { useState, useEffect } from "react"
import {useLocale, useTranslations} from "next-intl"
import { PlayerCard } from "@/components/player-card"
import { Button } from "@/components/ui/button"
import { startGame, resetGame } from "@/app/actions"
import ThemeInput from "@/components/theme-input"
import AnswerInput from "@/components/answer-input"
import AnswerReviewScreen from "@/components/answer-review-screen"
import GameResults from "@/components/game-results"
import GameProgress from "@/components/game-progress"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Copy, Check } from "lucide-react"
import { useGameChannel } from "@/contexts/GameChannelContext"

interface RoomContentProps {
    roomId: string
    currentUserId: string
}

export default function RoomContent({ roomId, currentUserId }: RoomContentProps) {
    const { gameState } = useGameChannel()
    const [isCopied, setIsCopied] = useState(false)
    const [isStartingGame, setIsStartingGame] = useState(false)
    const t = useTranslations("RoomContent")
    const locale = useLocale()

    const handleStartGame = async () => {
        if (isStartingGame) return
        setIsStartingGame(true)
        try {
            await startGame(roomId)
        } catch (error) {
            console.error("Failed to start game:", error)
            setIsStartingGame(false)
        }
    }

    const handleResetGame = async () => {
        try {
            await resetGame(roomId)
        } catch (error) {
            console.error("Failed to reset game:", error)
        }
    }

    const copyGameLink = () => {
        const gameLink = `${window.location.origin}/${locale}/room/${roomId}`
        navigator.clipboard.writeText(gameLink).then(
            () => {
                setIsCopied(true)
                setTimeout(() => setIsCopied(false), 2000)
            },
            (err) => {
                console.error("Failed to copy: ", err)
            },
        )
    }

    if (!gameState) {
        return (
            <Card className="w-full">
                <CardContent className="flex flex-col items-center space-y-4 p-6">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-purple-700">{t("loadingGameState")}</CardTitle>
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </CardContent>
            </Card>
        )
    }

    const isHost = gameState?.players?.some((player) => player.user_id === currentUserId && player.is_host) || false
    const currentTheme = gameState?.themes?.[gameState.current_round]
    const hasAnswered = currentTheme?.answers?.some((answer) => answer.player_id === currentUserId) || false

    const renderGameContent = () => {
        switch (gameState.game_state) {
            case "theme_input":
                return <ThemeInput roomId={roomId} />
            case "answer_input":
                return currentTheme && !hasAnswered ? (
                    <AnswerInput roomId={roomId} theme={currentTheme.question} />
                ) : (
                    <Card className="w-full">
                        <CardContent className="flex flex-col items-center space-y-4 p-6">
                            <CardTitle className="text-xl sm:text-2xl font-bold text-purple-700">
                                {t("waitingForOtherPlayers")}
                            </CardTitle>
                            <CardDescription className="text-center">{t("answerSubmitted")}</CardDescription>
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                        </CardContent>
                    </Card>
                )
            case "review":
                return currentTheme ? (
                    <AnswerReviewScreen roomId={roomId} theme={currentTheme} isHost={isHost} />
                ) : (
                    <Card className="w-full">
                        <CardContent className="flex flex-col items-center space-y-4 p-6">
                            <CardTitle className="text-xl sm:text-2xl font-bold text-purple-700">{t("reviewNotAvailable")}</CardTitle>
                            <CardDescription className="text-center">{t("waitForGameProgress")}</CardDescription>
                        </CardContent>
                    </Card>
                )
            case "game_over":
                return (
                    <GameResults
                        players={
                            gameState.players.map((player) => ({
                                id: player.id,
                                name: player.name,
                                avatar: player.avatar,
                                score: player.score,
                            })) || []
                        }
                        themes={gameState.themes || []}
                        roomId={roomId}
                        isHost={isHost}
                    />
                )
            default:
                return null
        }
    }

    return (
        <div className="flex flex-col md:flex-row justify-center items-start gap-4 w-full max-w-7xl mx-auto">
            <div
                className={`w-full ${gameState.game_state !== "waiting" && gameState.game_state !== "theme_input" ? "md:w-3/4" : "md:max-w-2xl"}`}
            >
                <Card className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
                    <CardHeader className="space-y-2">
                        <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-indigo-800">
                            {t("gameName")}
                        </CardTitle>
                        {gameState.game_state === "waiting" && (
                            <div className="flex flex-col items-center space-y-2">
                                <CardDescription className="text-lg sm:text-xl text-center bg-amber-200 py-2 px-4 rounded-full inline-block">
                                    {t("roomId")}: <span className="font-bold text-indigo-700">{roomId}</span>
                                </CardDescription>
                                <Button
                                    onClick={copyGameLink}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-full inline-flex items-center transition-colors duration-300"
                                >
                                    {isCopied ? (
                                        <>
                                            <Check className="w-4 h-4 mr-2" />
                                            {t("copied")}
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4 mr-2" />
                                            {t("copyGameLink")}
                                        </>
                                    )}
                                </Button>
                                <p className="text-sm text-gray-600 mt-2">{t("shareLink")}</p>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {gameState.game_state === "waiting" ? (
                            <div className="space-y-4">
                                <h2 className="text-xl sm:text-2xl text-indigo-800">{t("players")}:</h2>
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                    {gameState.players.map((player, index) => (
                                        <PlayerCard
                                            key={index}
                                            name={player.name}
                                            avatar={player.avatar}
                                            isHost={player.is_host}
                                            ready={player.ready}
                                        />
                                    ))}
                                </div>
                                {gameState.players.length < 3 && (
                                    <div className="mt-4 p-4 bg-yellow-100 rounded-lg">
                                        <p className="text-yellow-800 text-sm sm:text-base">{t("needMorePlayers")}</p>
                                    </div>
                                )}
                                {isHost && gameState.players.length >= 3 && (
                                    <Button
                                        onClick={handleStartGame}
                                        disabled={isStartingGame}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full text-lg transform hover:scale-105 transition-transform duration-200"
                                    >
                                        {isStartingGame ? t("startingGame") : t("startGame")}
                                    </Button>
                                )}
                                {isHost && gameState.players.length < 3 && (
                                    <Button
                                        disabled
                                        className="w-full bg-gray-400 text-white font-bold py-2 px-4 rounded-full text-lg cursor-not-allowed"
                                    >
                                        {t("needThreePlayers")}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            renderGameContent()
                        )}
                    </CardContent>
                </Card>
            </div>
            {gameState.game_state !== "waiting" &&
                gameState.game_state !== "theme_input" &&
                gameState.game_state !== "game_over" && (
                    <div className="w-full md:w-1/4">
                        <GameProgress roomState={gameState} />
                    </div>
                )}
        </div>
    )
}

