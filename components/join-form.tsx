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

interface JoinFormProps {
    roomId: string
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITEKEY

export default function JoinForm({ roomId }: JoinFormProps) {
    const [isJoining, setIsJoining] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const t = useTranslations("JoinForm")

    const handleJoinRoom = async (formData: FormData) => {
        const playerName = formData.get("playerName") as string
        if (!playerName) {
            setError(t("enterNameError"))
            return
        }
        setIsJoining(true)
        setError(null)
        try {
            window.grecaptcha.ready(() => {
                window.grecaptcha
                    .execute(SITE_KEY, { action: "submit" })
                    .then(async (token) => {
                        await joinRoom(roomId, playerName)
                        router.refresh()
                    })
                    .catch((error) => {
                        console.error("Failed to join room:", error)
                        setError(t("joinRoomError"))
                        setIsJoining(false)
                    })
            })
        } catch (error) {
            if (isRedirectError(error)) throw error
            console.error("Failed to join room:", error)
            setError(t("joinRoomError"))
            setIsJoining(false)
        }
    }

    return (
        <>
            <Script src={`https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`} />
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center text-indigo-800">{t("joinTheGame")}</CardTitle>
                    <CardDescription className="text-center text-indigo-600">{t("enterNameToJoin")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleJoinRoom} className="space-y-4">
                        <Input type="text" name="playerName" placeholder={t("enterYourName")} required />
                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isJoining}>
                            {isJoining ? t("joining") : t("joinGame")}
                        </Button>
                    </form>
                    {error && <p className="text-red-500 text-center text-sm mt-2">{error}</p>}
                </CardContent>
            </Card>
        </>
    )
}

