"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { RoomState, Player } from "@/lib/types"

interface GameProgressProps {
    roomState: RoomState
}

export default function GameProgress({ roomState }: GameProgressProps) {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const totalQuestions = roomState.themes.length
        const answeredQuestions = roomState.currentRound
        const calculatedProgress = (answeredQuestions / totalQuestions) * 100
        setProgress(calculatedProgress)
    }, [roomState.themes.length, roomState.currentRound])

    const sortedPlayers = [...roomState.players].sort((a, b) => (b.score || 0) - (a.score || 0))

    return (
        <Card className="w-full bg-white shadow-sm">
            <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-medium text-indigo-600 whitespace-nowrap">
                        Questions: {roomState.currentRound} / {roomState.themes.length}
                    </div>
                </div>
                <Progress value={progress} className="w-full h-2" />
                <div>
                    <h3 className="text-sm font-semibold text-indigo-800 mb-2">Player Scores</h3>
                    <div className="space-y-1">
                        {sortedPlayers.map((player: Player) => (
                            <div key={player.id} className="flex justify-between items-center text-sm">
                                <span className="font-medium text-indigo-600 truncate max-w-[70%]">{player.name}</span>
                                <span className="font-bold text-indigo-800">{player.score || 0}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

