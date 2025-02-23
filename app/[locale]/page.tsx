"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createRoom, joinRoom } from "../actions"
import AnimatedContent from "@/components/animated-content"
import { isRedirectError } from "next/dist/client/components/redirect"
import Script from "next/script"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/routing"
import { Lightbulb, PackageOpen, PenTool, Users } from "lucide-react"

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITEKEY

export default function HomePage() {
    const [isCreating, setIsCreating] = useState(false)
    const [isJoining, setIsJoining] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const t = useTranslations("")

    const handleCreateRoom = async (formData: FormData) => {
        const playerName = formData.get("playerName") as string
        if (!playerName) {
            setError(t("enterNameError"))
            return
        }
        setIsCreating(true)
        setError(null)
        try {
            window.grecaptcha.ready(() => {
                window.grecaptcha
                    .execute(SITE_KEY, { action: "submit" })
                    .then(async (token) => {
                        const { roomId } = await createRoom(token, playerName)
                        router.push(`/room/${roomId}`)
                    })
                    .catch((error) => {
                        console.error("Failed to create room:", error)
                        setError(t("createRoomError"))
                        setIsCreating(false)
                    })
            })
        } catch (error) {
            if (isRedirectError(error)) throw error
            console.error("Failed to create room:", error)
            setError(t("createRoomError"))
            setIsCreating(false)
        }
    }

    const handleJoinRoom = async (formData: FormData) => {
        const playerName = formData.get("playerName") as string
        const roomId = formData.get("roomId") as string
        if (!playerName || !roomId) {
            setError(t("enterNameAndRoomError"))
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
            setError(t("joinRoomError"))
            setIsJoining(false)
        }
    }

    return (
        <div className="min-h-auto flex flex-col items-center justify-center p-4">
            <Script src={`https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`} />
            <AnimatedContent>
                <Card className="w-full max-w-2xl backdrop-blur-sm shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center text-indigo-800">{t("gameName")}</CardTitle>
                        <CardDescription className="text-center text-indigo-600">{t("gameDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-indigo-800">{t("aboutTheGame")}</h3>
                                <p className="text-sm text-gray-700">{t("gameExplanation")}</p>

                                <h3 className="text-lg font-semibold text-indigo-800">{t("howToPlay")}</h3>
                                <div className="bg-amber-100 p-4 rounded-lg space-y-3">
                                    <div className="flex items-start space-x-3">
                                        <PackageOpen className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                                        <p className="text-sm text-gray-700">{t("howToPlaySteps.setup")}</p>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <Lightbulb className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                                        <p className="text-sm text-gray-700">{t("howToPlaySteps.answering")}</p>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <PenTool className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                                        <p className="text-sm text-gray-700">{t("howToPlaySteps.scoring")}</p>
                                    </div>
                                </div>
                            </div>

                            <Tabs defaultValue="create" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="create">{t("createRoom")}</TabsTrigger>
                                    <TabsTrigger value="join">{t("joinRoom")}</TabsTrigger>
                                </TabsList>
                                <TabsContent value="create">
                                    <form action={handleCreateRoom} className="space-y-4">
                                        <Input type="text" name="playerName" placeholder={t("enterName")} required />
                                        <Button
                                            type="submit"
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                            disabled={isCreating}
                                        >
                                            {isCreating ? t("creating") : t("createRoom")}
                                        </Button>
                                    </form>
                                </TabsContent>
                                <TabsContent value="join">
                                    <form action={handleJoinRoom} className="space-y-4">
                                        <Input type="text" name="playerName" placeholder={t("enterName")} required />
                                        <Input type="text" name="roomId" placeholder={t("enterRoomId")} required />
                                        <Button
                                            type="submit"
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                            disabled={isJoining}
                                        >
                                            {isJoining ? t("joining") : t("joinRoom")}
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

