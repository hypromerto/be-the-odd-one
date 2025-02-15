import { createClient } from "@/utils/supabase/client"

let currentChannel: any = null
const supabase = createClient()

export function getOrCreateChannel(roomId: string) {
    if (!currentChannel) {
        currentChannel = supabase.channel(`room:${roomId}`)
    }
    return currentChannel
}

export function removeChannel() {
    if (currentChannel) {
        supabase.removeChannel(currentChannel)
        currentChannel = null
    }
}

