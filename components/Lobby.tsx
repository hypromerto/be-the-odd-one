"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import GameSettings from "@/components/game-settings"
import { Copy, Check, Users, Settings } from "lucide-react"
import { PlayerList } from "@/components/player-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import HowToPlay from "@/components/HowToPlay"
import { motion, AnimatePresence } from "framer-motion"

interface LobbyProps {
    roomId: string
    players: any[]
    isHost: boolean
    onStartGame: () => void
    isStartingGame: boolean
}

export default function Lobby({ roomId, players, isHost, onStartGame, isStartingGame }: LobbyProps) {
    const [isCopied, setIsCopied] = useState(false)
    const t = useTranslations("Lobby")
    const locale = useLocale()

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

    const showNeedMorePlayers = players.length < 3

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 flex flex-col bg-gradient-to-br from-indigo-50/30 via-purple-50/30 to-pink-50/30 backdrop-blur-3xl overflow-y-auto"
        >
            <div className="flex-1 p-4 pt-28 lg:p-8 lg:pt-24">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                >
                    <Card className="mx-auto max-w-[90rem] h-fit lg:h-[calc(100vh-12rem)] backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/20 bg-white/10 overflow-hidden">
                        <motion.div
                            className="flex flex-col h-full p-6 pb-2 lg:p-6"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex-shrink-0 mb-4 sm:mb-2">
                                <motion.div
                                    className="text-center"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <div className="inline-flex items-center bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-6 py-3 rounded-full border border-indigo-200/20">
                                        <span className="text-base text-indigo-600 mr-2">{t("roomId")}:</span>
                                        <span className="text-lg font-bold text-indigo-800">{roomId}</span>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Mobile Layout */}
                            <div className="lg:hidden flex-1 min-h-0 flex flex-col">
                                <Tabs defaultValue="players" className="flex-1 flex flex-col">
                                    <TabsList className="grid w-full grid-cols-3 mb-4 bg-white/5 rounded-2xl backdrop-blur-xl border border-white/10">
                                        <TabsTrigger
                                            value="players"
                                            className="flex items-center justify-center data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md transition-all py-2 text-xs sm:text-base"
                                        >
                                            <Users className="w-4 h-4 mr-2" />
                                            <span className="truncate">{t("players")}</span>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="settings"
                                            className="flex items-center justify-center data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md transition-all py-2 text-xs sm:text-base"
                                        >
                                            <Settings className="w-4 h-4 mr-2" />
                                            <span className="truncate">{t("settings")}</span>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="howToPlay"
                                            className="flex items-center justify-center data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-xl transition-all py-2 text-xs sm:text-base"
                                        >
                                            <span className="truncate">{t("howToPlay")}</span>
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="flex-1 min-h-0 flex flex-col">
                                        <div className="overflow-hidden flex flex-col h-7/10">
                                            <AnimatePresence mode="wait">
                                                <TabsContent value="players" className="h-full m-0 data-[state=active]:flex flex-col flex-1">
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 20 }}
                                                        className="flex-1 overflow-hidden"
                                                    >
                                                        <ScrollArea className="h-[calc(100vh-35rem)] sm:h-[calc(100vh-28rem)]">
                                                            <PlayerList players={players} />
                                                        </ScrollArea>
                                                    </motion.div>
                                                </TabsContent>
                                                <TabsContent value="settings" className="h-full m-0 data-[state=active]:flex flex-col flex-1">
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 20 }}
                                                        className="flex-1 overflow-hidden"
                                                    >
                                                        <ScrollArea className="h-[calc(100vh-35rem)] sm:h-[calc(100vh-28rem)]">
                                                            <GameSettings roomId={roomId} isHost={isHost} />
                                                        </ScrollArea>
                                                    </motion.div>
                                                </TabsContent>
                                                <TabsContent value="howToPlay" className="h-full m-0 data-[state=active]:flex flex-col flex-1">
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 20 }}
                                                        className="flex-1 overflow-hidden"
                                                    >
                                                        <ScrollArea className="h-[calc(100vh-35rem)] sm:h-[calc(100vh-28rem)]">
                                                            <HowToPlay />
                                                        </ScrollArea>
                                                    </motion.div>
                                                </TabsContent>
                                            </AnimatePresence>
                                        </div>

                                        <div className="flex-shrink-0 mt-2 sm:mt-4 space-y-2 sm:space-y-4">
                                            <AnimatePresence>
                                                {showNeedMorePlayers && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -20 }}
                                                        className="p-2 bg-yellow-100 rounded-lg border-2 border-yellow-200"
                                                    >
                                                        <p className="text-yellow-800 text-sm font-medium">{t("needMorePlayers")}</p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <div className={`grid ${isHost ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
                                                <Button
                                                    onClick={copyGameLink}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-full inline-flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl"
                                                >
                                                    {isCopied ? (
                                                        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex items-center">
                                                            <Check className="w-4 h-4 mr-2" />
                                                            {t("copied")}
                                                        </motion.div>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-4 h-4 mr-2" />
                                                            {t("copyGameLink")}
                                                        </>
                                                    )}
                                                </Button>

                                                {isHost && (
                                                    <Button
                                                        onClick={onStartGame}
                                                        disabled={isStartingGame || players.length < 3}
                                                        className={`font-bold py-2 px-4 rounded-xl text-base transition-all duration-300 shadow-lg hover:shadow-xl
                                ${
                                                            players.length >= 3
                                                                ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                                                                : "bg-gray-400 text-white cursor-not-allowed"
                                                        }`}
                                                    >
                                                        {isStartingGame ? t("startingGame") : t("startGame")}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Tabs>
                            </div>

                            {/* Desktop Layout */}
                            <div className="hidden lg:flex flex-grow min-h-0 gap-8">
                                <motion.div
                                    className="w-1/3 bg-stone-100 rounded-2xl p-6 backdrop-blur-xl border border-white/10 "
                                    initial={{x: -50, opacity: 0}}
                                    animate={{x: 0, opacity: 1}}
                                    transition={{delay: 0.5}}
                                >
                                    <div className="flex items-center space-x-3 justify-center mb-4">
                                        <Users className="w-6 h-6 text-indigo-600"/>
                                        <h2 className="text-2xl font-bold text-indigo-800 text-center">{t("players")}</h2>
                                    </div>

                                    <ScrollArea className="h-[calc(100%-2rem)] pr-4">
                                        <PlayerList players={players} variant="vertical"/>
                                    </ScrollArea>
                                </motion.div>

                                <Separator orientation="vertical" className="bg-white/10"/>

                                <motion.div
                                    className="w-1/3 bg-stone-100 rounded-2xl p-6 backdrop-blur-xl border border-white/10 overflow-y-auto"
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <h2 className="text-2xl font-bold text-indigo-800 mb-4 text-center">{t("gameSettings")}</h2>
                                    <div className="pr-4">
                                        <GameSettings roomId={roomId} isHost={isHost} />
                                    </div>
                                </motion.div>

                                <Separator orientation="vertical" className="bg-white/10" />

                                <motion.div
                                    className="w-1/3 bg-stone-100 rounded-2xl p-6 backdrop-blur-xl border border-white/10"
                                    initial={{ x: 50, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                >
                                    <HowToPlay />
                                </motion.div>
                            </div>

                            <motion.div
                                className="hidden lg:block flex-shrink-0 mt-6 space-y-4"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.8 }}
                            >
                                <AnimatePresence>
                                    {showNeedMorePlayers && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 backdrop-blur-xl"
                                        >
                                            <p className="text-yellow-700 text-base font-medium">{t("needMorePlayers")}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className={`grid ${isHost ? "grid-cols-2" : "grid-cols-1"} gap-4`}>
                                    <Button
                                        onClick={copyGameLink}
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl inline-flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                                    >
                                        {isCopied ? (
                                            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex items-center">
                                                <Check className="w-5 h-5 mr-2" />
                                                {t("copied")}
                                            </motion.div>
                                        ) : (
                                            <>
                                                <Copy className="w-5 h-5 mr-2" />
                                                {t("copyGameLink")}
                                            </>
                                        )}
                                    </Button>

                                    {isHost && (
                                        <Button
                                            onClick={onStartGame}
                                            disabled={isStartingGame || players.length < 3}
                                            className={`font-bold py-3 px-6 rounded-xl text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1
                                                ${
                                                players.length >= 3
                                                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                                                    : "bg-gray-400 text-white cursor-not-allowed"
                                            }`}
                                        >
                                            {isStartingGame
                                                ? t("startingGame")
                                                : players.length >= 3
                                                    ? t("startGame")
                                                    : t("needThreePlayers")}
                                        </Button>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    )
}

