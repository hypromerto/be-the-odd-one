'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { submitAnswer } from '@/app/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AnswerInputProps {
    roomId: string
    theme: string
}

export default function AnswerInput({ roomId, theme }: AnswerInputProps) {
    const [answer, setAnswer] = useState('')
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!answer) return
        try {
            await submitAnswer(roomId, answer)
            setAnswer('')
            setIsSubmitted(true)
        } catch (error) {
            console.error('Failed to submit answer:', error)
        }
    }

    return (
        <AnimatePresence mode="wait">
            {!isSubmitted ? (
                <motion.div
                    key="answer-input"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle className="text-xl sm:text-2xl font-bold text-purple-700">Theme: {theme}</CardTitle>
                            <CardDescription className="text-sm sm:text-base">
                                Enter your answer for this theme
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input
                                    type="text"
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    placeholder="Enter your answer"
                                    className="w-full border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full text-lg transform hover:scale-105 transition-transform duration-200">
                                    Submit Answer
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <motion.div
                    key="answer-submitted"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card className="w-full">
                        <CardContent className="flex flex-col items-center space-y-4 p-6">
                            <CardTitle className="text-xl sm:text-2xl font-bold text-purple-700">Answer Submitted!</CardTitle>
                            <CardDescription className="text-center">
                                Your answer has been recorded. Please wait for other players to submit their answers.
                            </CardDescription>
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

