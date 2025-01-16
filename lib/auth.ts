import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export async function signInAnonymously() {
    const supabase = createClientComponentClient()
    const { data, error } = await supabase.auth.signInAnonymously()

    if (error) {
        console.error('Error signing in anonymously:', error)
        throw error
    }

    console.log('Signed in anonymously:', data.user)

    return data.user
}

export async function getCurrentUser() {
    const supabase = createClientComponentClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

