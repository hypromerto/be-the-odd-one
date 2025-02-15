"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Zap } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Theme, Answer, Player } from "@/lib/types"
import { useTranslations } from "next-intl"
import {useGameChannel, useFinishReview, useMarkAsInvalid} from "@/contexts/GameChannelContext"

interface AnswerReviewScreenProps {
  roomId: string
  theme: Theme
  isHost: boolean
}

export default function AnswerReviewScreen({ roomId, theme, isHost }: AnswerReviewScreenProps) {
  const [isFinishingReview, setIsFinishingReview] = useState(false)
  const t = useTranslations("AnswerReviewScreen")
  const { state: gameState } = useGameChannel()
  const markAnswerAsInvalid = useMarkAsInvalid(roomId)
  const finishReview = useFinishReview(roomId)

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

  const handleMarkInvalid = async (answerId: number) => {
    if (!isHost) return
    try {
      await markAnswerAsInvalid(answerId, theme.id)
    } catch (error) {
      console.error("Failed to mark answer as invalid:", error)
    }
  }

  const isDuplicate = (answer: Answer, answerList: Answer[]): boolean => {
    return answerList.some(
        (a) => a.id !== answer.id && a.answer.trim().toLowerCase() === answer.answer.trim().toLowerCase(),
    )
  }

  const sortedAnswers = [...theme.answers].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const firstValidIndex = sortedAnswers.findIndex((a) => !isDuplicate(a, sortedAnswers) && !a.invalid)

  const calculatePoints = (answer: Answer, index: number, isDuplicateAnswer: boolean) => {
    if (isDuplicateAnswer || answer.invalid) return 0

    if (gameState?.is_timed_mode) {
      const isFirstValid = index === firstValidIndex
      return isFirstValid ? 2 : 1
    } else {
      return 1
    }
  }

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
                                <span className="text-black">{player.score}</span>
                                {points > 0 && (
                                    <>
                                      <span>+</span>
                                      <span className={points === 2 ? "text-blue-600" : "text-green-600"}>{points}</span>
                                    </>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-700 text-sm break-words mb-1">{answer.answer}</p>
                            <div className="flex items-center justify-between">
                              <div>
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
                              {isHost && !answer.invalid && !isDuplicateAnswer && (
                                        <Button
                                            onClick={() => handleMarkInvalid(answer.id)}
                                            className="h-8 w-8 p-0 rounded-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                        >
                                          <span className="sr-only">{t("markAsInvalid")}</span>
                                          <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              className="w-5 h-5"
                                          >
                                            <path d="M18 6 6 18" />
                                            <path d="m6 6 12 12" />
                                          </svg>
                                        </Button>
                              )}
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

