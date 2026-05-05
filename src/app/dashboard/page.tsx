import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-sm w-full space-y-4 text-center">
        <h1 className="text-2xl font-bold">🍽️ Meal Planner</h1>
        <p className="text-gray-600">
          Logged in as: <strong>{user.email}</strong>
        </p>
        <LogoutButton />
      </div>
    </main>
  )
}
