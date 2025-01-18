import { createClient } from '@/utils/supabase/server'

export async function signInAnonymously() {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInAnonymously()

    if (error) {
        console.error('Error signing in anonymously:', error)
        throw error
    }

    console.log('Signed in anonymously:', data.user)

    return data.user
}

export async function getCurrentUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

