"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { submitAnswer } from "@/app/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGameChannel } from "@/contexts/GameChannelContext"
import { useTranslations } from "next-intl"

interface AnswerInputProps {
    roomId: string
    theme: string
}

export default function AnswerInput({ roomId, theme }: AnswerInputProps) {
    const [answer, setAnswer] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [localIsSubmitted, setLocalIsSubmitted] = useState(false)
    const { gameState } = useGameChannel()
    const t = useTranslations("AnswerInput")

    const currentPlayer = gameState?.players.find((player) => player.user_id === gameState.currentUserId) || null
    const isSubmitted = currentPlayer?.answer_ready || localIsSubmitted

    useEffect(() => {
        // Reset localIsSubmitted when the game state changes
        setLocalIsSubmitted(false)
    }, [gameState])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!answer || isSubmitting) return
        setIsSubmitting(true)
        setError(null)

        try {
            await submitAnswer(roomId, currentPlayer.id, answer)
            setAnswer("")
            setLocalIsSubmitted(true)
        } catch (error) {
            console.error("Failed to submit answer:", error)
            setError("Failed to submit answer. Please try again.")
            setIsSubmitting(false)
        }
    }

    if (isSubmitted) {
        return (
            <motion.div
                key="answer-submitted"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="w-full">
                    <CardContent className="flex flex-col items-center space-y-4 p-6">
                        <CardTitle className="text-xl sm:text-2xl font-bold text-purple-700">{t("answerSubmitted")}</CardTitle>
                        <CardDescription className="text-center">{t("waitingForOthers")}</CardDescription>
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </CardContent>
                </Card>
            </motion.div>
        )
    }

    return (
        <motion.div
            key="answer-input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-purple-700">
                        {t("theme")} {theme}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">{t("enterAnswer")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            type="text"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder={t("enterAnswerPlaceholder")}
                            className="w-full border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <Button
                            type="submit"
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full text-lg transform hover:scale-105 transition-transform duration-200"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? t("submitting") : t("submitAnswer")}
                        </Button>
                    </form>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </CardContent>
            </Card>
        </motion.div>
    )
}

