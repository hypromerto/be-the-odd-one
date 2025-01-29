"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { submitThemes } from "@/app/actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useGameChannel } from "@/contexts/GameChannelContext"

interface ThemeInputProps {
    roomId: string
}

export default function ThemeInput({ roomId }: ThemeInputProps) {
    const [theme, setTheme] = useState("")
    const [themes, setThemes] = useState<Array<string>>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [localIsReady, setLocalIsReady] = useState(false)
    const { gameState } = useGameChannel()

    const currentPlayer = gameState?.players.find((player) => player.user_id === gameState.currentUserId) || null
    const isReady = currentPlayer?.theme_ready || false

    const handleAddTheme = () => {
        if (theme.trim()) {
            setThemes((prevThemes) => [...prevThemes, theme.trim()])
            setTheme("")
        }
    }

    const handleRemoveTheme = (index: number) => {
        setThemes((prevThemes) => prevThemes.filter((_, i) => i !== index))
    }

    const handleReady = async () => {
        if (themes.length > 0 && !isSubmitting) {
            setIsSubmitting(true)
            try {
                await submitThemes(roomId, themes)
                setLocalIsReady(true)
            } catch (error) {
                console.error("Failed to submit themes:", error)
                setError("Failed to submit themes. Please try again.")
            } finally {
                setIsSubmitting(false)
            }
        }
    }

    if (isReady || localIsReady) {
        return (
            <Card className="w-full">
                <CardContent className="flex flex-col items-center space-y-4 p-6">
                    <CardTitle className="text-2xl font-bold text-purple-700">Themes Submitted!</CardTitle>
                    <CardDescription className="text-center">
                        Your themes have been recorded. Please wait for other players to submit their themes.
                    </CardDescription>
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl font-bold text-indigo-800">Enter Themes</CardTitle>
                <CardDescription className="text-sm sm:text-base text-indigo-600">
                    The game will continue until all themes from all players are played. You can enter multiple themes to make the
                    game longer and more fun!
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Input
                        type="text"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        placeholder="Enter a theme"
                        className="w-full sm:w-2/3 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <Button
                        onClick={handleAddTheme}
                        className="w-full sm:w-1/3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg"
                    >
                        Add
                    </Button>
                </div>
                <div className="bg-amber-100 p-4 rounded-lg">
                    <h3 className="font-bold mb-2 text-indigo-800">Your Themes:</h3>
                    <ul className="space-y-2">
                        {themes.map((t, index) => (
                            <li key={index} className="flex items-center justify-between">
                                <span className="text-indigo-700 text-sm">{t}</span>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleRemoveTheme(index)}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                >
                                    Remove
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
                <Button
                    onClick={handleReady}
                    disabled={themes.length === 0 || isSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full text-lg transform hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? "Submitting..." : "Ready"}
                </Button>
                {error && <p className="text-red-500 text-sm">{error}</p>}
            </CardContent>
        </Card>
    )
}

