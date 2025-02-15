"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useGameChannel, useSubmitAnswer, useExpireTimer } from "@/contexts/GameChannelContext"
import { useTranslations } from "next-intl"
import { CircularProgressbar } from "react-circular-progressbar"
import "react-circular-progressbar/dist/styles.css"
import type { Player, Theme } from "@/lib/types"

interface AnswerInputProps {
  roomId: string
  theme: Theme | null
  currentPlayer: Player | null
  onSubmitStateChange: (isSubmitted: boolean) => void
}

export default function AnswerInput({ roomId, theme, currentPlayer, onSubmitStateChange }: AnswerInputProps) {
  const [answer, setAnswer] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localIsSubmitted, setLocalIsSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10)
  const { state: gameState } = useGameChannel()
  const submitAnswer = useSubmitAnswer(roomId)
  const expireTimer = useExpireTimer(roomId)
  const t = useTranslations("AnswerInput")
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isTimerRunningRef = useRef(false)

  const isSubmitted = currentPlayer?.answer_ready || localIsSubmitted
  const isTimerRunning = gameState?.is_timed_mode && gameState?.timer_started

  useEffect(() => {
    isTimerRunningRef.current = isTimerRunning
    if (isTimerRunning) {
      startTimer()
    } else {
      stopTimer()
    }
    return () => stopTimer()
  }, [isTimerRunning])

  const startTimer = () => {
    setTimeLeft(10)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          stopTimer()
          if (isTimerRunningRef.current) {
            expireTimer(theme?.id)
          }
          return 0
        }
        return prevTime - 1
      })
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setError(null)

    try {
      await submitAnswer(currentPlayer?.id, theme?.id, answer)
      setAnswer("")
      setLocalIsSubmitted(true)
      onSubmitStateChange(true)
    } catch (error) {
      console.error("Failed to submit answer:", error)
      setError("Failed to submit answer. Please try again.")
    } finally {
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
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center space-y-4 p-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-purple-700">{t("answerSubmitted")}</CardTitle>
              <CardDescription className="text-center">{t("waitingForOthers")}</CardDescription>
              {isTimerRunning && timeLeft > 0 && (
                  <div className="w-16 h-16">
                    <CircularProgressbar
                        value={(timeLeft / 10) * 100}
                        text={`${timeLeft}`}
                        styles={{
                          path: {
                            stroke: `rgba(62, 152, 199, ${timeLeft / 10})`,
                          },
                          text: { fill: "#3e98c7", fontSize: "2rem" },
                        }}
                    />
                  </div>
              )}
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
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-bold text-purple-700">
              {t("theme")} {theme?.question}
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
                  disabled={isTimerRunning && timeLeft === 0}
              />
              <div className="flex items-center justify-between">
                <Button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full text-lg transform hover:scale-105 transition-transform duration-200"
                    disabled={isSubmitting || (isTimerRunning && timeLeft === 0)}
                >
                  {isSubmitting ? t("submitting") : t("submitAnswer")}
                </Button>
                {isTimerRunning && (
                    <div className="w-16 h-16">
                      <CircularProgressbar
                          value={(timeLeft / 10) * 100}
                          text={`${timeLeft}`}
                          styles={{
                            path: {
                              stroke: `rgba(62, 152, 199, ${timeLeft / 10})`,
                            },
                            text: { fill: "#3e98c7", fontSize: "2rem" },
                          }}
                      />
                    </div>
                )}
              </div>
            </form>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </CardContent>
        </Card>
      </motion.div>
  )
}

