"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import GameSettings from "@/components/game-settings"
import { Copy, Check } from "lucide-react"
import { CompactPlayerList } from "@/components/compact-player-list"

interface LobbyProps {
    roomId: string
    players: any[]
    isHost: boolean
    onStartGame: () => void
    isStartingGame: boolean
}

export default function Lobby({ roomId, players, isHost, onStartGame, isStartingGame }: LobbyProps) {
    const [isCopied, setIsCopied] = useState(false)
    const t = useTranslations("RoomContent")
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

    return (
        <div className="w-full max-w-2xl mx-auto">
            <Card className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg mt-5">
                <CardHeader className="space-y-2">
                    <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-indigo-800">{t("gameName")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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

                    <div className="bg-white/30 backdrop-blur-sm rounded-lg p-2 mb-4">
                        <CompactPlayerList players={players} />
                    </div>

                    <GameSettings roomId={roomId} isHost={isHost} />

                    {players.length < 3 && (
                        <div className="p-4 bg-yellow-100 rounded-lg">
                            <p className="text-yellow-800 text-sm sm:text-base">{t("needMorePlayers")}</p>
                        </div>
                    )}

                    {isHost && (
                        <div className="mt-4">
                            {players.length >= 3 ? (
                                <Button
                                    onClick={onStartGame}
                                    disabled={isStartingGame}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full text-lg transform hover:scale-105 transition-transform duration-200"
                                >
                                    {isStartingGame ? t("startingGame") : t("startGame")}
                                </Button>
                            ) : (
                                <Button
                                    disabled
                                    className="w-full bg-gray-400 text-white font-bold py-2 px-4 rounded-full text-lg cursor-not-allowed"
                                >
                                    {t("needThreePlayers")}
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

