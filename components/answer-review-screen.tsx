"use client"

import { useState, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Zap, ThumbsDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Theme, Answer, Player } from "@/lib/types"
import { useTranslations } from "next-intl"
import { useGameChannel, useFinishReview, useMarkAsInvalid, useVoteToInvalidate } from "@/contexts/GameChannelContext"

interface AnswerReviewScreenProps {
    roomId: string
    theme: Theme
    isHost: boolean
    currentPlayer: Player
}

export default function AnswerReviewScreen({ roomId, theme, isHost, currentPlayer }: AnswerReviewScreenProps) {
    const [isFinishingReview, setIsFinishingReview] = useState(false)
    const t = useTranslations("AnswerReviewScreen")
    const { state: gameState } = useGameChannel()
    const markAnswerAsInvalid = useMarkAsInvalid(roomId)
    const finishReview = useFinishReview(roomId)
    const voteToInvalidate = useVoteToInvalidate(roomId)

    const handleFinishReview = async () => {
        if (isFinishingReview) return
        setIsFinishingReview(true)
        try {
            await finishReview(theme.id)
        } catch (error) {
            console.error("Failed to finish review:", error)
        } finally {
            setIsFinishingReview(false)
        }
    }

    const handleVoteToInvalidate = async (answer: Answer) => {
        try {
            let shouldInvalidate = false
            const currentVotes = answer.invalidation_votes.length
            const totalPlayers = gameState.players.length
            const votesNeededToInvalidate = Math.ceil(totalPlayers / 2)

            if (currentVotes + 1 >= votesNeededToInvalidate) {
                shouldInvalidate = true
            }

            await voteToInvalidate(theme.id, answer.id, currentPlayer.id, shouldInvalidate)
        } catch (error) {
            console.error("Failed to vote for invalidation:", error)
        }
    }

    const isDuplicate = useCallback((answer: Answer, answerList: Answer[]): boolean => {
        return answerList.some(
            (a) => a.id !== answer.id && a.answer.trim().toLowerCase() === answer.answer.trim().toLowerCase(),
        )
    }, [])

    const sortedAnswers = useMemo(
        () => [...theme.answers].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        [theme.answers],
    )

    const firstValidIndex = useMemo(
        () => sortedAnswers.findIndex((a) => !isDuplicate(a, sortedAnswers) && !a.invalid),
        [sortedAnswers, isDuplicate],
    )

    const calculatePoints = useCallback(
        (answer: Answer, index: number, isDuplicateAnswer: boolean) => {
            if (isDuplicateAnswer || answer.invalid) return 0

            if (gameState?.is_timed_mode) {
                const isFirstValid = index === firstValidIndex
                return isFirstValid ? 2 : 1
            } else {
                return 1
            }
        },
        [gameState?.is_timed_mode, firstValidIndex],
    )

    const playerScores = useMemo(() => {
        const scores = new Map(
            gameState.players.map((player) => [player.id, { previousScore: player.score, newPoints: 0 }]),
        )

        sortedAnswers.forEach((answer, index) => {
            const isDuplicateAnswer = isDuplicate(answer, sortedAnswers)
            const points = calculatePoints(answer, index, isDuplicateAnswer)
            const playerScore = scores.get(answer.player_id)
            if (playerScore) {
                playerScore.newPoints += points
            }
        })

        return scores
    }, [gameState.players, sortedAnswers, calculatePoints, isDuplicate])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-4xl mx-auto space-y-6"
        >
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-indigo-800">
                        {t("answersForTheme")} {theme.question}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isHost && (
                        <Alert className="bg-amber-100 border-amber-200">
                            <Info className="h-4 w-4 text-amber-500" />
                            <AlertTitle className="text-amber-700">{t("hostInstructions")}</AlertTitle>
                            <AlertDescription className="text-amber-600 text-sm">{t("hostInstructionsText")}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        {sortedAnswers.map((answer, index) => {
                            const isDuplicateAnswer = isDuplicate(answer, sortedAnswers)
                            const points = calculatePoints(answer, index, isDuplicateAnswer)
                            const player = gameState?.players.find((p) => p.id === answer.player_id) as Player
                            const isFirstSubmission = index === 0
                            const canBeInvalidated = !answer.invalid && !isDuplicateAnswer
                            const playerScore = playerScores.get(answer.player_id)

                            return (
                                <motion.div
                                    key={answer.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Card
                                        className={`
                      ${points > 0 ? "border-green-500 bg-green-50" : "border-yellow-500 bg-yellow-50"}
                      ${answer.invalid ? "border-red-500 bg-red-50" : ""}
                      hover:bg-indigo-100 transition-colors duration-200 border-2
                    `}
                                    >
                                        <CardContent className="p-3 flex items-start space-x-3">
                                            <Avatar className="h-10 w-10 border-2 border-indigo-500 flex-shrink-0">
                                                <AvatarImage src={`/avatars/${player.avatar}.png`} alt={player.name} />
                                                <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-grow min-w-0 flex flex-col">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center space-x-2">
                                                        <p className="font-bold text-sm text-indigo-700">{player.name}</p>
                                                        {isFirstSubmission && (
                                                            <Badge variant="secondary" className="bg-yellow-200 text-yellow-800 text-xs">
                                                                <Zap className="w-3 h-3 mr-1" />
                                                                {t("firstToSubmit")}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-sm font-medium flex items-center space-x-1">
                                                        <span className="text-gray-500 ">{playerScore?.previousScore}</span>
                                                        {playerScore && playerScore.newPoints > 0 && (
                                                            <>
                                                                <span>+</span>
                                                                <span className={playerScore.newPoints === 2 ? "text-blue-600" : "text-green-600"}>
                                  {playerScore.newPoints}
                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-gray-700 text-sm break-words mb-1">{answer.answer}</p>
                                                <div className="flex items-center justify-between h-10">
                                                    <div className="flex items-center space-x-2">
                                                        {answer.invalid && (
                                                            <Badge variant="secondary" className="bg-red-200 text-red-800 text-xs">
                                                                {t("invalidAnswer")}
                                                            </Badge>
                                                        )}
                                                        {isDuplicateAnswer && !answer.invalid && (
                                                            <Badge variant="secondary" className="bg-orange-200 text-orange-800 text-xs">
                                                                {t("duplicateAnswer")}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        {canBeInvalidated && (
                                                            <>
                                <span
                                    className={`text-xs font-medium ${
                                        answer.invalidation_votes.length > 0 ? "text-red-500" : "text-gray-400"
                                    }`}
                                >
                                    {t("votesToInvalidate")}
                                  {answer.invalidation_votes.length}/{Math.ceil(gameState.players.length / 2)}
                                </span>
                                                                <div className="h-10 w-10 flex items-center justify-center">
                                                                    {answer.invalidation_votes.includes(currentPlayer.id) ? (
                                                                        <ThumbsDown className="w-6 h-6 text-red-500" />
                                                                    ) : (
                                                                        <Button
                                                                            onClick={() => handleVoteToInvalidate(answer)}
                                                                            className="h-10 w-10 p-0 rounded-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                                                        >
                                                                            <span className="sr-only">{t("voteToInvalidate")}</span>
                                                                            <ThumbsDown className="w-6 h-6" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )
                        })}
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

