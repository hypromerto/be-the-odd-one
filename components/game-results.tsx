'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import confetti from 'canvas-confetti'
import { resetGame } from '@/app/actions'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    isTwoPlayerMode: boolean
    cooperativeScore: number
}

export default function GameResults({ players, themes, roomId, isHost, isTwoPlayerMode, cooperativeScore }: GameResultsProps) {
    const [showConfetti, setShowConfetti] = useState(false)

    useEffect(() => {
        if (showConfetti) {
            confetti({
                particleCount: 200,
                spread: 70,
                origin: { y: 0.6 }
            })
        }
    }, [showConfetti])

    const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
    const winner = sortedPlayers[0]

    const handlePlayAgain = async () => {
        if (isHost) {
            try {
                await resetGame(roomId)
            } catch (error) {
                console.error('Failed to reset game:', error)
            }
        }
    }

    return (
        <div className="flex flex-col items-center space-y-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 sm:p-6 w-full mx-auto text-indigo-800">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Game Results</h2>

            {isTwoPlayerMode ? (
                <Card className="w-full max-w-md bg-amber-100 rounded-lg shadow-xl p-4 sm:p-6 transform hover:scale-105 transition-transform duration-300">
                    <CardHeader>
                        <CardTitle className="text-2xl sm:text-3xl font-bold text-purple-700 mb-4 text-center">Cooperative Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center">
                            <p className="text-3xl sm:text-4xl font-bold text-purple-700">{cooperativeScore} points</p>
                        </div>
                        <Button
                            className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300"
                            onClick={() => setShowConfetti(true)}
                        >
                            Celebrate!
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card className="w-full max-w-md bg-amber-100 rounded-lg shadow-xl p-4 sm:p-6 transform hover:scale-105 transition-transform duration-300">
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
                            onClick={() => setShowConfetti(true)}
                        >
                            Celebrate!
                        </Button>
                    </CardContent>
                </Card>
            )}

            {!isTwoPlayerMode && (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedPlayers.slice(1).map((player, index) => (
                        <Card key={player.id} className="bg-white/80 rounded-lg shadow-md p-3 flex items-center space-x-4 transform hover:scale-105 transition-transform duration-300">
                            <div className="flex-shrink-0">
                                <Image
                                    src={`/avatars/${player.avatar}.png`}
                                    alt={`${player.name}'s avatar`}
                                    width={40}
                                    height={40}
                                    className="rounded-full"
                                />
                            </div>
                            <div className="flex-grow">
                                <p className="text-base sm:text-lg font-semibold text-purple-700">{player.name}</p>
                                <p className="text-sm sm:text-base text-gray-600">{player.score} points</p>
                            </div>
                            <div className="flex-shrink-0 text-xl sm:text-2xl font-bold text-purple-700">
                                #{index + 2}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <div className="w-full mt-6">
                <h3 className="text-xl sm:text-2xl font-bold mb-4">Theme Summary</h3>
                {themes.map((theme, index) => (
                    <Card key={index} className="bg-amber-100 bg-opacity-80 rounded-lg p-3 sm:p-4 mb-4">
                        <CardContent>
                            <p className="text-lg sm:text-xl font-semibold mb-2 text-indigo-800">{theme.question}</p>
                            <p className="text-sm sm:text-base mb-2 text-indigo-600">by {theme.author}</p>
                            <ul className="list-disc list-inside">
                                {theme.answers.filter(a => a.pointAwarded).map((answer, i) => (
                                    <li key={i} className="text-sm sm:text-base text-indigo-700">{answer.playerName}: {answer.answer}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {isHost && (
                <Button
                    onClick={handlePlayAgain}
                    className="mt-4 sm:mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-full text-lg sm:text-xl transform hover:scale-105 transition-transform duration-200"
                >
                    Play Again
                </Button>
            )}
            {!isHost && (
                <p className="text-lg sm:text-xl text-indigo-600 font-bold mt-4 sm:mt-6">Waiting for the host to start a new game...</p>
            )}
        </div>
    )
}

