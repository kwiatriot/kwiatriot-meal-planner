import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { nextPlanningWeek, formatWeekRange } from '@/lib/week'
import { getOrCreateMealPlan, getSelectionsForPlan } from '@/lib/meal-plan'
import { WEEKLY_MEAL_SLOTS, daysUntilFridayLock, getShoppingItemCount } from '@/lib/dashboard'
import LogoutButton from './LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekStart = nextPlanningWeek()

  // getOrCreateMealPlan returns { data, error } — mirrors Django's get_or_create().
  // We always get a plan back (it creates one if needed) unless the DB errors.
  const { data: plan } = await getOrCreateMealPlan(supabase, weekStart)

  // Python-dev note: Promise.all is asyncio.gather() — fires both reads in
  // parallel, waits for both, returns results in the same order as the array.
  // Neither depends on the other, so there's no reason to sequence them.
  const [selectionsResult, shoppingItemCount] = plan
    ? await Promise.all([
        getSelectionsForPlan(supabase, plan.id),
        getShoppingItemCount(supabase, plan.id),
      ])
    : [{ data: [], error: null }, 0]

  const selectedCount = selectionsResult.data.length
  const lockDays = daysUntilFridayLock()

  // Shopping list tile label derives from two signals: whether meals are
  // selected, and whether the shopping list has been generated.
  function shoppingListLabel() {
    if (selectedCount === 0) return 'No meals selected yet'
    if (shoppingItemCount === 0) return 'Not generated'
    return `Generated · ${shoppingItemCount} items`
  }
  const shoppingLabel = shoppingListLabel()
  const shoppingIsEmpty = selectedCount === 0

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 dark:bg-gray-950">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <LogoutButton />
        </div>

        {/* 2×2 tile grid — single column on mobile, two columns on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tile 1: This week */}
          <Link href="/meal-selector" className="group block">
            <Tile label="This week">
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {formatWeekRange(weekStart)}
              </span>
              <Arrow />
            </Tile>
          </Link>

          {/* Tile 2: Meals selected */}
          <Link href="/meal-selector" className="group block">
            <Tile label="Meals selected">
              <span className="text-3xl font-bold tabular-nums text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {selectedCount}
                <span className="text-lg font-normal text-gray-400 dark:text-gray-500">
                  {' '}/ {WEEKLY_MEAL_SLOTS}
                </span>
              </span>
              <Arrow />
            </Tile>
          </Link>

          {/* Tile 3: Plan locks in */}
          <Tile label="Plan locks in">
            {lockDays > 0 ? (
              <span className="text-3xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
                {lockDays}
                <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
                  {' '}day{lockDays === 1 ? '' : 's'}
                </span>
              </span>
            ) : (
              <span className="text-lg font-semibold text-gray-400 dark:text-gray-500">
                Plan locked
              </span>
            )}
          </Tile>

          {/* Tile 4: Shopping list */}
          <Link href="/shopping-list" className="group block">
            <Tile label="Shopping list">
              <span
                className={`text-base font-semibold transition-colors ${
                  shoppingIsEmpty
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                }`}
              >
                {shoppingLabel}
              </span>
              {!shoppingIsEmpty && <Arrow />}
            </Tile>
          </Link>
        </div>

        {/* Secondary nav row */}
        <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 pt-2">
          <Link href="/recipes" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
            Recipe library →
          </Link>
          <Link href="/recipes/new" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
            Add recipe →
          </Link>
        </div>
      </div>
    </main>
  )
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 min-h-[110px] flex flex-col justify-between dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
        {label}
      </p>
      <div className="flex items-end justify-between gap-2">
        {children}
      </div>
    </div>
  )
}

function Arrow() {
  return (
    <span className="text-gray-300 dark:text-gray-600 group-hover:text-blue-400 transition-colors text-lg shrink-0">
      →
    </span>
  )
}
