"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { joinRoom } from "@/app/actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { isRedirectError } from "next/dist/client/components/redirect"
import Script from "next/script"
import { useTranslations } from "next-intl"
import {useRouter} from "@/i18n/routing";
import {useJoinRoom} from "@/contexts/GameChannelContext";

interface JoinFormProps {
    roomId: string
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITEKEY

export default function JoinForm({ roomId }: JoinFormProps) {
    const [joiningName, setJoiningName] = useState('')
    const [isJoining, setIsJoining] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const joinRoom = useJoinRoom(roomId)
    const t = useTranslations("JoinForm")

    const handleJoinGame = async () => {
        if (!joiningName) {
            setError('Please enter your name')
            return
        }

        if (isJoining) {
            return
        }

        setIsJoining(true)
        setError(null)
        try {
            // Skip reCAPTCHA in development
            if (process.env.NODE_ENV === 'development') {
                await joinRoom(joiningName, 'development-token')
                router.refresh()
                return
            }

            window.grecaptcha.ready(() => {
                window.grecaptcha
                    .execute(SITE_KEY, { action: "submit" })
                    .then(async (token) => {
                        /* send data to the server */
                        await joinRoom(joiningName, token)
                        router.refresh()
                    }).catch((error) => {
                    console.error("Failed to join game:", error)
                    setError("Failed to join game. Please try again.")
                })
            })
        } catch (error) {
            console.error('Failed to join game:', error)
            setError('Failed to join game. Please try again.')
            setIsJoining(false)
        }
    }

    return (
        <>
            <Script src={`https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`} />
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
        </>
    )
}

