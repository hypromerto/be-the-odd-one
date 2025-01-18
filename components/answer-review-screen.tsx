'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { markAnswerInvalid, finishReview } from '@/app/actions'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Lightbulb, Users } from 'lucide-react'

interface AnswerReviewScreenProps {
    roomId: string
    theme: {
        question: string
        author: string
        answers: Array<{
            playerId: string
            playerName: string
            answer: string
            invalid: boolean
        }>
    }
    isHost: boolean
}

export default function AnswerReviewScreen({ roomId, theme, isHost }: AnswerReviewScreenProps) {
    const [invalidAnswers, setInvalidAnswers] = useState<string[]>(
        theme.answers.filter(answer => answer.invalid).map(answer => answer.playerId)
    )
    const [currentUser, setCurrentUser] = useState<any>(null)
    const supabase = createClientComponentClient()

    useEffect(() => {
        const fetchCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUser(user)
        }
        fetchCurrentUser()

        // Subscribe to real-time updates for invalid answers
        const channel = supabase.channel(`room:${roomId}`)
        channel
            .on('broadcast', { event: 'answer_invalidated' }, ({ payload }) => {
                setInvalidAnswers(prev => [...prev, payload.answerId])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, roomId])

    const handleMarkInvalid = async (playerId: string) => {
        if (!isHost) return
        try {
            await markAnswerInvalid(roomId, playerId)
            setInvalidAnswers(prev => [...prev, playerId])
            // Broadcast the invalidation to other players
            await supabase.channel(`room:${roomId}`).send({
                type: 'broadcast',
                event: 'answer_invalidated',
                payload: { answerId: playerId }
            })
        } catch (error) {
            console.error('Failed to mark answer as invalid:', error)
        }
    }

    const handleFinishReview = async () => {
        try {
            await finishReview(roomId)
        } catch (error) {
            console.error('Failed to finish review:', error)
        }
    }

    // Identify duplicate answers
    const answerCounts = theme.answers.reduce((acc: Record<string, string[]>, answer) => {
        const lowerCaseAnswer = answer.answer.toLowerCase()
        if (!acc[lowerCaseAnswer]) {
            acc[lowerCaseAnswer] = []
        }
        acc[lowerCaseAnswer].push(answer.playerId)
        return acc
    }, {})

    const duplicateAnswers = Object.values(answerCounts).filter(players => players.length > 1).flat()

    // Identify players who won't earn points this round
    const playersWithoutPoints = theme.answers
        .filter(answer => duplicateAnswers.includes(answer.playerId) || invalidAnswers.includes(answer.playerId))
        .map(answer => answer.playerName)

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
                    <CardTitle className="text-xl sm:text-2xl font-bold text-indigo-800">Answers for the theme: {theme.question}</CardTitle>
                    <CardDescription className="text-sm sm:text-base">Theme by: <span className="font-bold text-indigo-600">{theme.author}</span></CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isHost && (
                        <Alert className="bg-amber-100 border-amber-200">
                            <Info className="h-4 w-4 text-amber-500" />
                            <AlertTitle className="text-amber-700">Host Instructions</AlertTitle>
                            <AlertDescription className="text-amber-600 text-sm">
                                As the host, review the answers and mark any as invalid if they are irrelevant to the theme or essentially duplicate answers.
                            </AlertDescription>
                        </Alert>
                    )}
                    {playersWithoutPoints.length > 0 && (
                        <Alert className="bg-indigo-100 border-indigo-200">
                            <Users className="h-4 w-4 text-indigo-500" />
                            <AlertTitle className="text-indigo-700">Players not earning points this round:</AlertTitle>
                            <AlertDescription className="text-indigo-600 text-sm">
                                {playersWithoutPoints.join(', ')}
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {theme.answers.map((answer, index) => {
                                const isDuplicate = duplicateAnswers.includes(answer.playerId)
                                const isInvalid = invalidAnswers.includes(answer.playerId)
                                const isUnique = !isDuplicate && !isInvalid
                                return (
                                    <motion.div
                                        key={answer.playerId}
                                        layout
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Card
                                            className={`
                        ${isUnique ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}
                        ${isInvalid ? 'border-red-500 bg-red-50' : ''}
                        hover:bg-indigo-100 transition-colors duration-200 border-2 flex flex-col
                      `}
                                        >
                                            <CardContent className="p-4 flex flex-col justify-between min-h-[200px]">
                                                <div>
                                                    <p className="font-bold text-base text-indigo-700 mb-2">{answer.playerName}</p>
                                                    <p className="text-gray-700 mb-3 text-sm">{answer.answer}</p>
                                                </div>
                                                {(isDuplicate || isInvalid) && (
                                                    <Alert variant="default" className={`${isDuplicate ? 'bg-yellow-100 border-yellow-200' : 'bg-red-100 border-red-200'} p-2 mt-2`}>
                                                        <div className="flex items-center">
                                                            <Lightbulb className="h-4 w-4 mr-2 flex-shrink-0" />
                                                            <div>
                                                                <AlertTitle className={`${isDuplicate ? 'text-yellow-700' : 'text-red-700'} text-sm font-semibold`}>
                                                                    {isDuplicate ? 'Duplicate Answer' : 'Invalid Answer'}
                                                                </AlertTitle>
                                                                <AlertDescription className={`${isDuplicate ? 'text-yellow-600' : 'text-red-600'} text-xs`}>
                                                                    {isDuplicate
                                                                        ? "This answer matches with another player's. No points awarded."
                                                                        : "The host has marked this answer as invalid for this round. No points will be awarded."}
                                                                </AlertDescription>
                                                            </div>
                                                        </div>
                                                    </Alert>
                                                )}
                                                {isHost && !isInvalid && !isDuplicate && (
                                                    <Button
                                                        onClick={() => handleMarkInvalid(answer.playerId)}
                                                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-1 px-2 rounded-lg transform hover:scale-105 transition-transform duration-200 text-sm mt-2"
                                                    >
                                                        Mark as Invalid
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                    {isHost && (
                        <Button onClick={handleFinishReview} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-full text-lg transform hover:scale-105 transition-transform duration-200 mt-6">
                            Finish Review
                        </Button>
                    )}
                    {!isHost && <p className="text-base sm:text-lg text-indigo-600 font-bold mt-6">Waiting for the host to finish reviewing answers...</p>}
                </CardContent>
            </Card>
        </motion.div>
    )
}

