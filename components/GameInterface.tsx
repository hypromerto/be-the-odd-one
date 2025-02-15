"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslations } from "next-intl"
import type { RoomState } from "@/lib/types"
import type React from "react"

interface GameInterfaceProps {
    roomState: RoomState
    children: React.ReactNode
}

export function GameInterface({ roomState, children }: GameInterfaceProps) {
    const [progress, setProgress] = useState(0)
    const t = useTranslations("GameInterface")

    useEffect(() => {
        const totalQuestions = roomState.themes.length
        const answeredQuestions = roomState.current_round + 1
        const calculatedProgress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0
        setProgress(calculatedProgress)
    }, [roomState.themes.length, roomState.current_round])

    const sortedPlayers = [...roomState.players].sort((a, b) => b.score - a.score)

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-200 to-indigo-700 p-4">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Scoreboard */}
                    <Card className="lg:col-span-1 overflow-hidden bg-indigo-900/70 backdrop-blur-sm">
                        <CardContent className="p-4">
                            <h2 className="text-2xl font-bold mb-4 text-center text-white">{t("scoreboard")}</h2>
                            <ScrollArea className="max-h-[calc(100vh-200px)]">
                                <div className="space-y-2">
                                    {sortedPlayers.map((player, index) => (
                                        <motion.div
                                            key={player.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                            className="flex items-center space-x-4 p-3 rounded-lg border-b border-white/20 last:border-b-0"
                                        >
                                            <Avatar className="h-10 w-10 border-2 border-white/50">
                                                <AvatarImage src={`/avatars/${player.avatar}.png`} alt={player.name} />
                                                <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-semibold text-white">{player.name}</p>
                                                <p className="text-sm text-indigo-200">
                                                    {t("score")}: {player.score}
                                                </p>
                                            </div>
                                            {index === 0 && (
                                                <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                          {t("leader")}
                        </span>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Main game area */}
                    <Card className="lg:col-span-3 bg-indigo-900/70 backdrop-blur-sm h-fit">
                        <CardContent className="p-4">
                            {/* Game progress */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-semibold text-white">{t("gameProgress")}</h3>
                                    <div className="text-sm font-medium text-indigo-200">
                                        {t("questions")}: {roomState.current_round + 1} / {roomState.themes.length}
                                    </div>
                                </div>
                                <Progress value={progress} className="h-2" />
                            </div>

                            {/* Game content */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={roomState.current_round}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {children}
                                </motion.div>
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

