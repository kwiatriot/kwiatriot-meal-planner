'use server'

import { createClient } from '@/lib/supabase/server'

export async function signUp(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  // Defense in depth: re-check the flag server-side even though the UI already hides the form.
  // A hacked client calling this endpoint directly would be blocked here.
  if (process.env.NEXT_PUBLIC_ALLOW_SIGNUP !== 'true') {
    return { error: 'Sign-up is disabled.' }
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) return { error: error.message }
  return { success: true }
}
