'use client'

import Image from 'next/image'

interface RoundResultsProps {
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
    isGameOver: boolean
}

export default function RoundResults({ theme, isGameOver }: RoundResultsProps) {
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

    const answersWithPoints = theme.answers.map(answer => ({
        ...answer,
        pointAwarded: !duplicateAnswers.includes(answer.playerId) && !answer.invalid
    }))

    const sortedAnswers = answersWithPoints.sort((a, b) => (a.pointAwarded === b.pointAwarded ? 0 : a.pointAwarded ? -1 : 1))

    return (
        <div className="flex flex-col items-center space-y-6 bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-purple-700">{isGameOver ? "Game Over" : "Round Results"}</h2>
            <p className="text-2xl mb-4 text-gray-700">Theme: <span className="font-bold text-purple-600">{theme.question}</span></p>
            <p className="text-xl mb-6 text-gray-700">Author: <span className="font-bold text-purple-600">{theme.author}</span></p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {sortedAnswers.map((answer, index) => (
                    <div key={index} className={`p-4 border-2 ${answer.pointAwarded ? 'border-green-500' : 'border-red-500'} rounded-lg ${answer.pointAwarded ? 'bg-green-50' : 'bg-red-50'} transition-colors duration-200 relative`}>
                        <p className="font-bold text-lg text-purple-700 mb-2">{answer.playerName}</p>
                        <p className="text-gray-700 mb-4">{answer.answer}</p>
                        {answer.pointAwarded ? (
                            <p className="text-green-600 font-bold">Point Awarded!</p>
                        ) : (
                            <p className="text-red-600 font-bold">
                                {duplicateAnswers.includes(answer.playerId) ? "Duplicate Answer" : "Point Not Awarded"}
                            </p>
                        )}
                    </div>
                ))}
            </div>
            {!isGameOver && <p className="text-xl text-blue-600 font-bold mt-6">Next round starting soon...</p>}
            {isGameOver && <p className="text-2xl text-green-600 font-bold mt-6">Thanks for playing!</p>}
        </div>
    )
}

