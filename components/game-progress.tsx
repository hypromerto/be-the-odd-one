"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import type { RoomState, Player } from "@/lib/types"
import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"
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
    }, [roomState.themes.length, roomState.current_round])

    const sortedPlayers = [...roomState.players].sort((a, b) => b.score - a.score)

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="w-full bg-white/90 backdrop-blur-sm shadow-md">
                <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-indigo-800">{t("gameProgress")}</h3>
                        <div className="text-sm font-medium text-indigo-600">
                            {t("questions")}: {roomState.current_round + 1} / {roomState.themes.length}
                        </div>
                    </div>
                    <Progress value={progress} className="w-full h-2" />
                    <AnimatePresence>
                        {roomState.game_state !== "review" && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ScrollArea className="w-full whitespace-nowrap">
                                    <div className="flex space-x-4">
                                        {sortedPlayers.map((player, index) => (
                                            <PlayerProgressItem key={player.id} player={player} rank={index + 1} />
                                        ))}
                                    </div>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    )
}

interface PlayerProgressItemProps {
    player: Player
    rank: number
}

function PlayerProgressItem({ player, rank }: PlayerProgressItemProps) {
    return (
        <div className="flex flex-col items-center space-y-2">
            <div className="relative">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={`/avatars/${player.avatar}.png`} alt={player.name} />
                    <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold px-1 py-0.5 rounded-full">
                    #{rank}
                </div>
            </div>
            <div className="text-center">
                <p className="text-sm font-medium text-indigo-800 truncate max-w-[80px]">{player.name}</p>
                <p className="text-xs text-indigo-600 font-semibold">{player.score}</p>
            </div>
            <div className="h-4">
                {player.answer_ready ? (
                    <Check className="w-4 h-4 text-green-500" />
                ) : (
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                )}
            </div>
        </div>
    )
}

