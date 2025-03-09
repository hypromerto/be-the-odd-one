import RoomContent from "@/components/room-content"
import JoinForm from "@/components/join-form"
import { createClient } from "@/utils/supabase/server"
import { getCurrentUser, signInAnonymously } from "@/lib/auth"
import Script from "next/script"
import { GameChannelProvider } from "@/contexts/GameChannelContext"
import { Metadata } from "next"

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITEKEY

interface Props {
    params: { id: string; locale: string }
}

// Simple metadata that doesn't require database query
export const metadata: Metadata = {
    robots: {
        index: false,  // Most important part - prevent indexing of room pages
        follow: true,
    },
    title: 'Join Game Room | Be the Odd One',
    description: 'Join a room in Be the Odd One - a social party game where players try to give unique answers to themes!'
}

export default async function RoomPage({ params }: Props) {
    const supabase = await createClient()

    let user = await getCurrentUser()
    if (!user) {
        user = await signInAnonymously()
    }

    if (!user) {
        return <div>Unable to authenticate. Please try again later.</div>
    }

    const { data: room, error } = await supabase
        .from("rooms")
        .select(`
      *,
      players:players(*),
      themes:themes(
        *,
        answers:answers(*)
      )
    `)
        .eq("room_id", params.id)
        .single()

    if (error) {
        console.error("Error fetching room data:", error)
        return <div>Error loading room. Please try again.</div>
    }

    const isPlayerInRoom = room.players.some((player: { user_id: string }) => player.user_id === user.id)

    return (
        <div className="flex items-center justify-center p-4">
            <Script src={`https://www.google.com/recaptcha/api/js?render=${SITE_KEY}`} />
            <GameWrapper roomId={params.id}>
                {isPlayerInRoom ? <RoomContent roomId={params.id} currentUserId={user.id} /> : <JoinForm roomId={params.id} />}
            </GameWrapper>
        </div>
    )
}

const GameWrapper = ({ children, roomId }: { children: React.ReactNode; roomId: string }) => {
    return <GameChannelProvider roomId={roomId}>{children}</GameChannelProvider>
}
