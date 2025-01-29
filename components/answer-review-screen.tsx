"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { markAnswerInvalid, finishReview } from "@/app/actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Lightbulb, Users } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Theme } from "@/lib/types"
import { useTranslations } from "next-intl"

interface AnswerReviewScreenProps {
    roomId: string
    theme: Theme
    isHost: boolean
}

export default function AnswerReviewScreen({ roomId, theme, isHost }: AnswerReviewScreenProps) {
    const [isFinishingReview, setIsFinishingReview] = useState(false)
    const t = useTranslations("AnswerReviewScreen")

    const handleMarkInvalid = async (answerId: string) => {
        if (!isHost) return
        try {
            await markAnswerInvalid(roomId, answerId)
        } catch (error) {
            console.error("Failed to mark answer as invalid:", error)
        }
    }

    const handleFinishReview = async () => {
        if (isFinishingReview) return
        setIsFinishingReview(true)
        try {
            await finishReview(roomId, theme.id)
        } catch (error) {
            console.error("Failed to finish review:", error)
            setIsFinishingReview(false)
        }
    }

    // Identify duplicate answers
    const answerCounts = theme.answers.reduce((acc: Record<string, string[]>, answer) => {
        const lowerCaseAnswer = answer.answer.toLowerCase()
        if (!acc[lowerCaseAnswer]) {
            acc[lowerCaseAnswer] = []
        }
        acc[lowerCaseAnswer].push(answer.id)
        return acc
    }, {})

    const duplicateAnswers = Object.values(answerCounts)
        .filter((players) => players.length > 1)
        .flat()

    // Identify players who won't earn points this round
    const playersWithoutPoints = theme.answers
        .filter((answer) => duplicateAnswers.includes(answer.id) || answer.invalid)
        .map((answer) => answer.player_name)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-4xl mx-auto"
        >
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-indigo-800">
                        {t("answersForTheme")} {theme.question}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                        {t("themeBy")} <span className="font-bold text-indigo-600">{theme.author.name}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isHost && (
                        <Alert className="bg-amber-100 border-amber-200">
                            <Info className="h-4 w-4 text-amber-500" />
                            <AlertTitle className="text-amber-700">{t("hostInstructions")}</AlertTitle>
                            <AlertDescription className="text-amber-600 text-sm">{t("hostInstructionsText")}</AlertDescription>
                        </Alert>
                    )}
                    {playersWithoutPoints.length > 0 && (
                        <Alert className="bg-indigo-100 border-indigo-200">
                            <Users className="h-4 w-4 text-indigo-500" />
                            <AlertTitle className="text-indigo-700">{t("playersNotEarningPoints")}</AlertTitle>
                            <AlertDescription className="text-indigo-600 text-sm">{playersWithoutPoints.join(", ")}</AlertDescription>
                        </Alert>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <AnimatePresence>
                            {theme.answers.map((answer, index) => {
                                const isDuplicate = duplicateAnswers.includes(answer.id)
                                const isInvalid = answer.invalid
                                const isUnique = !isDuplicate && !isInvalid
                                return (
                                    <motion.div
                                        key={`${answer.id}-${index}`}
                                        layout
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Card
                                            className={`
                        ${isUnique ? "border-green-500 bg-green-50" : "border-yellow-500 bg-yellow-50"}
                        ${isInvalid ? "border-red-500 bg-red-50" : ""}
                        hover:bg-indigo-100 transition-colors duration-200 border-2 flex flex-col w-full h-[200px]
                      `}
                                        >
                                            <CardContent className="p-5 flex flex-col justify-between h-full">
                                                <div>
                                                    <p className="font-bold text-base text-indigo-700">{answer.player_name}</p>
                                                    <p className="text-gray-700 text-sm mt-1 line-clamp-2">{answer.answer}</p>
                                                </div>
                                                <div className="mt-2">
                                                    {(isDuplicate || isInvalid) && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Alert
                                                                        variant="default"
                                                                        className={`${isDuplicate ? "bg-yellow-100 border-yellow-200" : "bg-red-100 border-red-200"} p-2`}
                                                                    >
                                                                        <div className="flex items-center w-full">
                                                                            <Lightbulb className="h-4 w-4 flex-shrink-0 mr-2" />
                                                                            <AlertTitle
                                                                                className={`${isDuplicate ? "text-yellow-700" : "text-red-700"} text-sm font-semibold flex-grow`}
                                                                            >
                                                                                {isDuplicate ? t("duplicateAnswer") : t("invalidAnswer")}
                                                                            </AlertTitle>
                                                                        </div>
                                                                    </Alert>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top">
                                                                    <p className="text-xs max-w-xs">
                                                                        {isDuplicate ? t("duplicateTooltip") : t("invalidTooltip")}
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                    {isHost && !isInvalid && !isDuplicate && (
                                                        <Button
                                                            onClick={() => handleMarkInvalid(answer.id)}
                                                            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg transform hover:scale-105 transition-transform duration-200 text-sm"
                                                        >
                                                            {t("markAsInvalid")}
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                    {isHost && (
                        <Button
                            onClick={handleFinishReview}
                            disabled={isFinishingReview}
                            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-full text-lg transform hover:scale-105 transition-transform duration-200 mt-6"
                        >
                            {isFinishingReview ? t("finishingReview") : t("finishReview")}
                        </Button>
                    )}
                    {!isHost && <p className="text-base sm:text-lg text-indigo-600 font-bold mt-6">{t("waitingForHost")}</p>}
                </CardContent>
            </Card>
        </motion.div>
    )
}

