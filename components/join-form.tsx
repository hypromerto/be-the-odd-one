'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {createRoom, joinRoom} from '@/app/actions'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface JoinFormProps {
    roomId: string
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITEKEY;

export default function JoinForm({ roomId }: JoinFormProps) {
    const [joiningName, setJoiningName] = useState('')
    const [isJoining, setIsJoining] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleJoinGame = async () => {
        if (!joiningName) {
            setError('Please enter your name')
            return
        }
        setIsJoining(true)
        setError(null)
        try {
            window.grecaptcha.ready(() => {
                window.grecaptcha
                    .execute(SITE_KEY, { action: "submit" })
                    .then(async (token) => {
                        /* send data to the server */
                        await joinRoom(roomId, joiningName)
                        router.refresh()
                    }).catch((error) => {
                    console.error("Failed to join game:", error)
                    setError("Failed to join game. Please try again.")
                })
            })
        } catch (error) {
            console.error('Failed to join game:', error)
            setError('Failed to join game. Please try again.')
        } finally {
            setIsJoining(false)
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl text-indigo-800">Join the Game</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input
                    type="text"
                    placeholder="Enter your name"
                    value={joiningName}
                    onChange={(e) => setJoiningName(e.target.value)}
                />
                <Button onClick={handleJoinGame} disabled={isJoining} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                    {isJoining ? 'Joining...' : 'Join Game'}
                </Button>
                {error && <p className="text-red-500 text-sm">{error}</p>}
            </CardContent>
        </Card>
    )
}

