"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import confetti from "canvas-confetti"
import { resetGame } from "@/app/actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface PlayerScore {
    id: string
    name: string
    avatar: string
    score: number
}

interface GameResultsProps {
    players: PlayerScore[]
    themes: Array<{
        question: string
        author: string
        answers: Array<{
            playerId: string
            playerName: string
            answer: string
            pointAwarded: boolean
        }>
    }>
    roomId: string
    isHost: boolean
}

export default function GameResults({ players, themes, roomId, isHost }: GameResultsProps) {
    const [isResettingGame, setIsResettingGame] = useState(false)

    const doConfetti = () => {
        confetti({
            particleCount: 200,
            spread: 70,
            origin: { y: 0.6 },
        })
    }

    const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
    const winner = sortedPlayers[0]

    const handlePlayAgain = async () => {
        if (isResettingGame) return
        setIsResettingGame(true)
        try {
            await resetGame(roomId)
        } catch (error) {
            console.error("Failed to reset game:", error)
        } finally {
            setIsResettingGame(false)
        }
    }

    return (
        <div className="flex flex-col items-center space-y-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-2xl mx-auto text-indigo-800">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Game Results</h2>

            <Card className="w-full max-w-md bg-amber-100 rounded-lg shadow-xl p-4 sm:p-6">
                <CardHeader>
                    <CardTitle className="text-2xl sm:text-3xl font-bold text-purple-700 mb-4 text-center">Winner</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center space-x-4">
                        <Image
                            src={`/avatars/${winner.avatar}.png`}
                            alt={`${winner.name}'s avatar`}
                            width={60}
                            height={60}
                            className="rounded-full border-4 border-yellow-400"
                        />
                        <div>
                            <p className="text-xl sm:text-2xl font-bold text-purple-700">{winner.name}</p>
                            <p className="text-lg sm:text-xl text-gray-600">{winner.score} points</p>
                        </div>
                    </div>
                    <Button
                        className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300"
                        onClick={doConfetti}
                    >
                        Celebrate!
                    </Button>
                </CardContent>
            </Card>

            <div className="w-full space-y-4">
                {sortedPlayers.slice(1).map((player, index) => (
                    <Card key={player.id} className="bg-white/80 rounded-lg shadow-md p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-grow">
                            <Image
                                src={`/avatars/${player.avatar}.png`}
                                alt={`${player.name}'s avatar`}
                                width={50}
                                height={50}
                                className="rounded-full border-2 border-purple-500 flex-shrink-0"
                            />
                            <div className="flex-grow min-w-0">
                                <p className="text-base font-semibold text-purple-700 truncate">{player.name}</p>
                                <p className="text-sm text-gray-600">{player.score} points</p>
                            </div>
                        </div>
                        <div className="text-xl font-bold text-purple-700 ml-2">#{index + 2}</div>
                    </Card>
                ))}
            </div>

            <div className="w-full mt-6">
                <h3 className="text-xl sm:text-2xl font-bold mb-4">Theme Summary</h3>
                {themes.map((theme, index) => (
                    <Card key={index} className="bg-white rounded-lg shadow-md p-4 mb-4">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg sm:text-xl font-semibold text-indigo-800">{theme.question}</CardTitle>
                            <CardDescription className="text-sm text-indigo-600">by {theme.author}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {theme.answers.map((answer, i) => (
                                    <li
                                        key={i}
                                        className="text-sm sm:text-base flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0"
                                    >
                                        <span className="font-semibold text-indigo-700 mr-2">{answer.playerName}:</span>
                                        <span className={`flex-1 ${answer.pointAwarded ? "text-green-600 font-medium" : "text-gray-600"}`}>
                      {answer.answer}
                    </span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {isHost && (
                <Button
                    onClick={handlePlayAgain}
                    disabled={isResettingGame}
                    className="mt-4 sm:mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-full text-lg sm:text-xl"
                >
                    {isResettingGame ? "Resetting Game..." : "Play Again"}
                </Button>
            )}
            {!isHost && (
                <p className="text-lg sm:text-xl text-indigo-600 font-bold mt-4 sm:mt-6">
                    Waiting for the host to start a new game...
                </p>
            )}
        </div>
    )
}

