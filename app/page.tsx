'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createRoom, joinRoom } from './actions'
import AnimatedContent from '@/components/animated-content'
import { isRedirectError } from "next/dist/client/components/redirect"
import Script from 'next/script'

declare global {
    interface Window {
        grecaptcha: any;
        onRecaptchaLoad: () => void;
    }
}

export default function HomePage() {
    const [isCreating, setIsCreating] = useState(false)
    const [isJoining, setIsJoining] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [recaptchaLoaded, setRecaptchaLoaded] = useState(false)
    const router = useRouter()
    const recaptchaRef = useRef<HTMLDivElement>(null)
    const recaptchaWidgetId = useRef<number | null>(null)

    const renderReCaptcha = useCallback(() => {
        if (window.grecaptcha && recaptchaRef.current && !recaptchaWidgetId.current) {
            recaptchaWidgetId.current = window.grecaptcha.render(recaptchaRef.current, {
                'sitekey': '6LclnLwqAAAAAD3NMOKuVZ08pKfm17m0gWujXIQ0',
                'callback': (token: string) => {
                    console.log('reCAPTCHA token:', token)
                }
            });
        }
    }, []);

    useEffect(() => {
        window.onRecaptchaLoad = () => {
            setRecaptchaLoaded(true);
        };

        return () => {
            delete window.onRecaptchaLoad;
        };
    }, []);

    useEffect(() => {
        if (recaptchaLoaded) {
            renderReCaptcha();
        }
    }, [recaptchaLoaded, renderReCaptcha]);

    const handleCreateRoom = async (formData: FormData) => {
        const playerName = formData.get('playerName') as string
        if (!playerName) {
            setError('Please enter your name')
            return
        }
        setIsCreating(true)
        setError(null)
        try {
            const captchaToken = await new Promise<string>((resolve, reject) => {
                if (window.grecaptcha && recaptchaWidgetId.current !== null) {
                    const token = window.grecaptcha.getResponse(recaptchaWidgetId.current)
                    if (token) {
                        resolve(token)
                    } else {
                        reject('Please complete the CAPTCHA')
                    }
                } else {
                    reject('reCAPTCHA not loaded')
                }
            })

            if (!captchaToken) {
                throw new Error('CAPTCHA verification failed')
            }
            const { roomId } = await createRoom(playerName, captchaToken)
            router.push(`/room/${roomId}`)
        } catch (error) {
            if (isRedirectError(error)) throw error;

            if (error === 'Please complete the CAPTCHA') {
                setError('Please complete the CAPTCHA')
            } else {
                setError('Failed to create room. Please try again.')
            }
            console.error('Failed to create room:', error)
        } finally {
            setIsCreating(false)
            if (window.grecaptcha && recaptchaWidgetId.current !== null) {
                window.grecaptcha.reset(recaptchaWidgetId.current)
            }
        }
    }

    const handleJoinRoom = async (formData: FormData) => {
        const playerName = formData.get('playerName') as string
        const roomId = formData.get('roomId') as string
        if (!playerName || !roomId) {
            setError('Please enter both your name and the room ID')
            return
        }
        setIsJoining(true)
        setError(null)
        try {
            await joinRoom(roomId, playerName)
            router.push(`/room/${roomId}`)
        } catch (error) {
            if (isRedirectError(error)) throw error;
            console.error('Failed to join room:', error)
            setError('Failed to join room. Please check the room ID and try again.')
        } finally {
            setIsJoining(false)
        }
    }

    return (
        <>
            <Script
                src="https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit"
                strategy="lazyOnload"
            />
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <AnimatedContent>
                    <Card className="w-full backdrop-blur-sm bg-white/90 shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center text-indigo-800">Be the Odd One</CardTitle>
                            <CardDescription className="text-center text-indigo-600">Stand out with your unique answers!</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">
                                        Welcome to Be the Odd One, a game that challenges you to think differently and stand out from the crowd! Here's how to play:
                                    </p>
                                    <div className="bg-amber-100 p-4 rounded-lg">
                                        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                                            <li>Players take turns submitting themes.</li>
                                            <li>Everyone races to come up with unique answers for each theme.</li>
                                            <li>Earn points by being the odd one out!</li>
                                            <li>At least 3 players are required to start a game.</li>
                                        </ol>
                                    </div>
                                </div>

                                <Tabs defaultValue="create" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="create">Create Room</TabsTrigger>
                                        <TabsTrigger value="join">Join Room</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="create">
                                        <form action={handleCreateRoom} className="space-y-4">
                                            <Input
                                                type="text"
                                                name="playerName"
                                                placeholder="Enter your name"
                                                required
                                            />
                                            <div ref={recaptchaRef} className="flex justify-center"></div>
                                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isCreating}>
                                                {isCreating ? 'Creating...' : 'Create Room'}
                                            </Button>
                                        </form>
                                    </TabsContent>
                                    <TabsContent value="join">
                                        <form action={handleJoinRoom} className="space-y-4">
                                            <Input
                                                type="text"
                                                name="playerName"
                                                placeholder="Enter your name"
                                                required
                                            />
                                            <Input
                                                type="text"
                                                name="roomId"
                                                placeholder="Enter room ID"
                                                required
                                            />
                                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isJoining}>
                                                {isJoining ? 'Joining...' : 'Join Room'}
                                            </Button>
                                        </form>
                                    </TabsContent>
                                </Tabs>
                                {error && <p className="text-red-500 text-center text-sm">{error}</p>}
                            </div>
                        </CardContent>
                    </Card>
                </AnimatedContent>
            </div>
        </>
    )
}

