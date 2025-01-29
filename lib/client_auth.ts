import { createClient } from "@/utils/supabase/client"

export async function signInAnonymously() {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInAnonymously()

    if (error) {
        console.error('Error signing in anonymously:', error)
        throw error
    }

    return data.user
}

export async function getCurrentUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}
