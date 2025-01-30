"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { RoomState, Player } from "@/lib/types"
import { useTranslations } from "next-intl"
import { Check, Loader2 } from "lucide-react"

interface GameProgressProps {
    roomState: RoomState
}

export default function GameProgress({ roomState }: GameProgressProps) {
    const [progress, setProgress] = useState(0)
    const t = useTranslations("GameProgress")

    useEffect(() => {
        const totalQuestions = roomState.themes.length
        const answeredQuestions = roomState.current_round + 1
        const calculatedProgress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0
        setProgress(calculatedProgress)
    }, [roomState.themes.length, roomState.current_round, roomState.players])

    const sortedPlayers = [...roomState.players].sort((a, b) => b.score - a.score)

    return (
        <Card className="w-full bg-white shadow-sm">
            <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-medium text-indigo-600 whitespace-nowrap">
                        {t("questions")}: {roomState.current_round + 1} / {roomState.themes.length}
                    </div>
                </div>
                <Progress value={progress} className="w-full h-2" />
                <div>
                    <h3 className="text-sm font-semibold text-indigo-800 mb-2">{t("playerScores")}</h3>
                    <div className="space-y-1">
                        {sortedPlayers.map((player: Player) => (
                            <div key={player.id} className="flex justify-between items-center text-sm">
                                <div className="flex items-center space-x-2">
                                    {player.answer_ready ? (
                                        <Check className="h-4 w-4 text-green-500" aria-label={t("playerReady")} />
                                    ) : (
                                        <Loader2 className="h-4 w-4 text-amber-500 animate-spin" aria-label={t("playerNotReady")} />
                                    )}
                                    <span className="font-medium text-indigo-600 truncate max-w-[60%]">{player.name}</span>
                                </div>
                                <span className="font-bold text-indigo-800">{player.score || 0}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

