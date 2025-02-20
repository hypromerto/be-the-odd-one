"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import confetti from "canvas-confetti"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { PlayerScore, Theme } from "@/lib/types"
import { useTranslations } from "next-intl"
import { useResetGame } from "@/contexts/GameChannelContext"
import { Trophy, Medal } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface GameResultsProps {
    players: PlayerScore[]
    themes: Theme[]
    roomId: string
    isHost: boolean
    isTimedMode: boolean
    themeSource: string
    onResetGame: () => void
}

export default function GameResults({
                                        players,
                                        themes,
                                        roomId,
                                        isHost,
                                        isTimedMode,
                                        themeSource,
                                        onResetGame,
                                    }: GameResultsProps) {
    const [confettiTrigger, setConfettiTrigger] = useState(0)
    const [isResettingGame, setIsResettingGame] = useState(false)
    const [showThemeSummary, setShowThemeSummary] = useState(false)
    const t = useTranslations("GameResults")
    const resetGame = useResetGame(roomId)

    useEffect(() => {
        if (confettiTrigger > 0) {
            confetti({
                particleCount: 200,
                spread: 70,
                origin: { y: 0.6 },
            })
        }
    }, [confettiTrigger])

    const sortedPlayers = players.sort((a, b) => b.score - a.score)
    const topPlayers = sortedPlayers.slice(0, 3)

    const handlePlayAgain = async () => {
        if (isResettingGame) return
        setIsResettingGame(true)
        try {
            await resetGame()
            onResetGame()
        } catch (error) {
            console.error("Failed to reset game:", error)
        } finally {
            setIsResettingGame(false)
        }
    }

    const renderPodium = () => {
        const podiumOrder = [1, 0, 2] // Center, Left, Right
        return (
            <div className="flex justify-center items-end space-x-4 mb-8">
                {podiumOrder.map((index) => {
                    const player = topPlayers[index]
                    if (!player) return null
                    const isWinner = index === 0
                    const podiumHeight = isWinner ? "h-32" : index === 1 ? "h-24" : "h-16"
                    return (
                        <div key={player.id} className="flex flex-col items-center">
                            <div className="mb-2">
                                <Image
                                    src={`/avatars/${player.avatar}.png`}
                                    alt={`${player.name}'s avatar`}
                                    width={isWinner ? 80 : 60}
                                    height={isWinner ? 80 : 60}
                                    className="rounded-full border-4 border-yellow-400"
                                />
                            </div>
                            <div className="text-center mb-2">
                                <p className="font-bold text-indigo-700">{player.name}</p>
                                <p className="text-indigo-600">
                                    {player.score} {t("points")}
                                </p>
                            </div>
                            <div className={`w-24 ${podiumHeight} bg-indigo-600 rounded-t-lg flex items-center justify-center`}>
                                {isWinner ? (
                                    <Trophy className="text-yellow-400 w-8 h-8" />
                                ) : (
                                    <Medal className="text-yellow-400 w-6 h-6" />
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center space-y-6 backdrop-blur-sm rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-2xl mx-auto text-indigo-800">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">{t("gameResults")}</h2>

            {renderPodium()}

            <Button
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300"
                onClick={() => setConfettiTrigger((prev) => prev + 1)}
            >
                {t("celebrate")}
            </Button>

            <div className="w-full space-y-4">
                {sortedPlayers.slice(3).map((player, index) => (
                    <Card key={player.id} className="bg-white/80 rounded-lg shadow-md p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-grow">
                            <Image
                                src={`/avatars/${player.avatar}.png`}
                                alt={`${player.name}'s avatar`}
                                width={50}
                                height={50}
                                className="rounded-full border-2 border-indigo-500 flex-shrink-0"
                            />
                            <div className="flex-grow min-w-0">
                                <p className="text-base font-semibold text-indigo-700 truncate">{player.name}</p>
                                <p className="text-sm text-indigo-600">
                                    {player.score} {t("points")}
                                </p>
                            </div>
                        </div>
                        <div className="text-xl font-bold text-indigo-700 ml-2">#{index + 4}</div>
                    </Card>
                ))}
            </div>

            <Button
                className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold py-3 px-6 rounded-full transition-colors duration-300 text-lg"
                onClick={() => setShowThemeSummary(!showThemeSummary)}
            >
                {showThemeSummary ? t("hideThemeSummary") : t("showThemeSummary")}
            </Button>

            <AnimatePresence>
                {showThemeSummary && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full overflow-hidden"
                    >
                        <div className="w-full mt-6">
                            <h3 className="text-xl sm:text-2xl font-bold mb-4">{t("themeSummary")}</h3>
                            {themes.map((theme) => (
                                <Card key={theme.id} className="bg-white rounded-lg shadow-md p-4 mb-4">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg sm:text-xl font-semibold text-indigo-800">{theme.question}</CardTitle>
                                        {themeSource === "custom" && (
                                            <CardDescription className="text-sm text-indigo-600">
                                                {t("by")} {theme.author.name}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {theme.answers.map((answer) => (
                                                <li
                                                    key={answer.id}
                                                    className="text-sm sm:text-base flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0"
                                                >
                                                    <span className="font-semibold text-indigo-700 mr-2">{answer.player_name}:</span>
                                                    <span
                                                        className={`flex-1 ${!answer.invalid ? "text-green-600 font-medium" : "text-gray-600"}`}
                                                    >
                            {answer.answer}
                          </span>
                                                    <span className="text-indigo-600 font-medium">
                            {isTimedMode
                                ? answer.points === 2
                                    ? "+2 pts (First)"
                                    : answer.points === 1
                                        ? "+1 pt"
                                        : "0 pts"
                                : answer.points > 0
                                    ? "+1 pt"
                                    : "0 pts"}
                          </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isHost && (
                <Button
                    onClick={handlePlayAgain}
                    disabled={isResettingGame}
                    className="mt-4 sm:mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-full text-lg sm:text-xl"
                >
                    {isResettingGame ? t("resettingGame") : t("playAgain")}
                </Button>
            )}
            {!isHost && <p className="text-lg sm:text-xl text-indigo-600 font-bold mt-4 sm:mt-6">{t("waitingForHost")}</p>}
        </div>
    )
}

