"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createRoom, joinRoom } from "./actions"
import AnimatedContent from "@/components/animated-content"
import { isRedirectError } from "next/dist/client/components/redirect"

declare global {
    interface Window {
        grecaptcha: {
            ready: (callback: () => void) => void
            execute: (siteKey: string, options: { action: string }) => Promise<string>
        }
    }
}

export default function HomePage() {
    const [playerName, setPlayerName] = useState("")
    const [joinRoomId, setJoinRoomId] = useState("")
    const [isCreating, setIsCreating] = useState(false)
    const [isJoining, setIsJoining] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [recaptchaLoaded, setRecaptchaLoaded] = useState(false)
    const router = useRouter()
    const recaptchaLoadAttempts = useRef(0)

    useEffect(() => {
        const loadRecaptcha = () => {
            console.log("Attempting to load reCAPTCHA script...")
            const script = document.createElement("script")
            script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.RECAPTCHA_SITE_KEY}`
            script.async = true
            script.defer = true
            script.onload = () => {
                console.log("reCAPTCHA script loaded, waiting for grecaptcha to be ready...")
                window.grecaptcha.ready(() => {
                    console.log("grecaptcha is ready")
                    setRecaptchaLoaded(true)
                })
            }
            script.onerror = (error) => {
                console.error("Error loading reCAPTCHA script:", error)
                recaptchaLoadAttempts.current += 1
                if (recaptchaLoadAttempts.current < 3) {
                    console.log(`Retrying reCAPTCHA load, attempt ${recaptchaLoadAttempts.current + 1}`)
                    setTimeout(loadRecaptcha, 2000)
                } else {
                    setError("Failed to load reCAPTCHA. Please refresh the page and try again.")
                }
            }
            document.body.appendChild(script)
        }

        loadRecaptcha()

        return () => {
            const script = document.querySelector(`script[src^="https://www.google.com/recaptcha/api.js"]`)
            if (script) {
                document.body.removeChild(script)
            }
        }
    }, [])

    const executeRecaptcha = async () => {
        console.log("Executing reCAPTCHA...")
        if (!window.grecaptcha) {
            console.error("grecaptcha is not available")
            throw new Error("reCAPTCHA not loaded")
        }
        try {
            const token = await window.grecaptcha.execute(process.env.RECAPTCHA_SITE_KEY!, {
                action: "create_room",
            })
            console.log("reCAPTCHA token obtained:", token.substring(0, 10) + "...")
            return token
        } catch (error) {
            console.error("Error executing reCAPTCHA:", error)
            throw error
        }
    }

    const handleCreateRoom = async (formData: FormData) => {
        const playerName = formData.get("playerName") as string
        if (!playerName) {
            setError("Please enter your name")
            return
        }
        setIsCreating(true)
        setError(null)
        try {
            console.log("Creating room...")
            if (!recaptchaLoaded) {
                console.error("reCAPTCHA not loaded yet")
                throw new Error("reCAPTCHA not loaded yet")
            }
            const token = await executeRecaptcha()
            const { roomId } = await createRoom(playerName, token)
            console.log("Room created successfully, redirecting...")
            router.push(`/room/${roomId}`)
        } catch (error) {
            if (isRedirectError(error)) throw error
            console.error("Failed to create room:", error)
            setError("Failed to create room. Please try again.")
            setIsCreating(false)
        }
    }

    const handleJoinRoom = async (formData: FormData) => {
        const playerName = formData.get("playerName") as string
        const roomId = formData.get("roomId") as string
        if (!playerName || !roomId) {
            setError("Please enter both your name and the room ID")
            return
        }
        setIsJoining(true)
        setError(null)
        try {
            await joinRoom(roomId, playerName)
            router.push(`/room/${roomId}`)
        } catch (error) {
            if (isRedirectError(error)) throw error
            console.error("Failed to join room:", error)
            setError("Failed to join room. Please check the room ID and try again.")
            setIsJoining(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <AnimatedContent>
                <Card className="w-full backdrop-blur-sm bg-white/90 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center text-indigo-800">Be the Odd One</CardTitle>
                        <CardDescription className="text-center text-indigo-600">
                            Stand out with your unique answers!
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                    Welcome to Be the Odd One, a game that challenges you to think differently and stand out from the
                                    crowd! Here's how to play:
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
                                        <Input type="text" name="playerName" placeholder="Enter your name" required />
                                        <Button
                                            type="submit"
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                            disabled={isCreating || !recaptchaLoaded}
                                        >
                                            {isCreating ? "Creating..." : recaptchaLoaded ? "Create Room" : "Loading reCAPTCHA..."}
                                        </Button>
                                    </form>
                                </TabsContent>
                                <TabsContent value="join">
                                    <form action={handleJoinRoom} className="space-y-4">
                                        <Input type="text" name="playerName" placeholder="Enter your name" required />
                                        <Input type="text" name="roomId" placeholder="Enter room ID" required />
                                        <Button
                                            type="submit"
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                            disabled={isJoining}
                                        >
                                            {isJoining ? "Joining..." : "Join Room"}
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
    )
}

