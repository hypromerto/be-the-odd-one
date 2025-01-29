"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { submitTheme, removeTheme, sendAllThemesSubmittedEvent } from "@/app/actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useGameChannel } from "@/contexts/GameChannelContext"
import { SharedThemePool } from "./shared-theme-pool"

interface ThemeInputProps {
    roomId: string
}

export default function ThemeInput({ roomId }: ThemeInputProps) {
    const [theme, setTheme] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")
    const { gameState, setGameState } = useGameChannel()
    const t = useTranslations("ThemeInput")

    const currentPlayer = gameState?.players.find((player) => player.user_id === gameState.currentUserId) || null
    const isHost = currentPlayer?.is_host || false

    const handleAddTheme = async () => {
        if (theme.trim()) {
            try {
                const newTheme = await submitTheme(roomId, theme.trim(), currentPlayer.id)
                setTheme("")
            } catch (error) {
                console.error("Failed to add theme:", error)
                setError("Failed to add theme. Please try again.")
            }
        }
    }

    const handleRemoveTheme = async (themeId: number) => {
        if (isHost) {
            try {
                await removeTheme(roomId, themeId)
            } catch (error) {
                console.error("Failed to remove theme:", error)
                setError("Failed to remove theme. Please try again.")
            }
        }
    }

    const handleStartGame = async () => {
        if (isHost && gameState?.themes.length > 0) {
            setIsSubmitting(true)
            try {
                await sendAllThemesSubmittedEvent(roomId)
            } catch (error) {
                console.error("Failed to start game:", error)
                setError("Failed to start game. Please try again.")
            } finally {
                setIsSubmitting(false)
            }
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl font-bold text-indigo-800">{t("enterThemes")}</CardTitle>
                <CardDescription className="text-sm sm:text-base text-indigo-600">
                    {t("addThemesInstructions")} {isHost ? t("hostInstructions") : t("waitForHost")}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Input
                        type="text"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        placeholder={t("enterTheme")}
                        className="w-full sm:w-2/3 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <Button
                        onClick={handleAddTheme}
                        className="w-full sm:w-1/3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg"
                    >
                        {t("add")}
                    </Button>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <SharedThemePool themes={gameState?.themes || []} isHost={isHost} onRemove={handleRemoveTheme} t={t} />
                {isHost && (
                    <Button
                        onClick={handleStartGame}
                        disabled={isSubmitting || gameState?.themes.length === 0}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full text-lg transform hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? t("startingGame") : t("startGame")}
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

