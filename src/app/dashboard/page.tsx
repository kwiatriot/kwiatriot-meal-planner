import Link from 'next/link'
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
      <div className="max-w-sm w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold">🍽️ Meal Planner</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Logged in as: <strong>{user.email}</strong>
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/meal-selector"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Plan this week
          </Link>
          <Link
            href="/recipes"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Browse recipes
          </Link>
        </div>
        <LogoutButton />
      </div>
    </main>
  )
}