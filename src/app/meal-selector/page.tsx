import { Fragment } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  DAYS_OF_WEEK,
  DAY_LABELS,
  addWeeks,
  formatWeekRange,
  isValidMonday,
  nextPlanningWeek,
} from '@/lib/week'
import { getSelectionsForPlan } from '@/lib/meal-plan'
import type { DayOfWeek, MealType } from '@/types/index'
import ClearMealButton from './ClearMealButton'

const MEAL_TYPES: MealType[] = ['lunch', 'dinner', 'snack']
const MEAL_TYPE_LABELS: Record<MealType, string> = {
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

interface PageProps {
  // Next 15+: searchParams is a Promise. Python-dev note: think of this as
  // an async dependency that resolves to the URL query dict.
  searchParams: Promise<{ week?: string }>
}

export default async function MealSelectorPage({ searchParams }: PageProps) {
  const params = await searchParams

  // Validate ?week=… — if it's garbage, redirect to the canonical (param-less) URL
  if (params.week !== undefined && !isValidMonday(params.week)) {
    redirect('/meal-selector')
  }
  const weekStart = params.week ?? nextPlanningWeek()

  const supabase = await createClient()

  // Read the plan if it exists. We don't auto-create — empty weeks should
  // not pollute the meal_plans table.
  const { data: plan } = await supabase
    .from('meal_plans')
    .select('id, week_start_date, status')
    .eq('week_start_date', weekStart)
    .maybeSingle()

  // Build a fast lookup: "monday-lunch" → cell data
  type CellData = { recipeId: string; recipeName: string }
  const selectionMap = new Map<string, CellData>()

  if (plan) {
    const { data: selections } = await getSelectionsForPlan(supabase, plan.id)
    for (const s of selections) {
      selectionMap.set(`${s.day_of_week}-${s.meal_type}`, {
        recipeId: s.recipe_id,
        recipeName: s.recipes?.name ?? '(unknown)',
      })
    }
  }

  const isLocked = plan?.status === 'locked'
  const prevWeek = addWeeks(weekStart, -1)
  const nextWeek = addWeeks(weekStart, 1)

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 dark:bg-gray-950">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Plan Week
              </h1>
              <p className="text-sm text-gray-500 mt-0.5 dark:text-gray-400">
                {formatWeekRange(weekStart)}
                {isLocked && ' · Locked'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/meal-selector?week=${prevWeek}`}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                ← Prev
              </Link>
              <Link
                href="/meal-selector"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Next week
              </Link>
              <Link
                href={`/meal-selector?week=${nextWeek}`}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Next →
              </Link>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              ← Dashboard
            </Link>
            <Link
              href="/recipes"
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Browse recipe library →
            </Link>
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[640px] grid grid-cols-[110px_repeat(4,_1fr)] gap-2">
            {/* Header row */}
            <div></div>
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-gray-700 py-2 dark:text-gray-300"
              >
                {DAY_LABELS[day]}
              </div>
            ))}

            {/* Body rows */}
            {MEAL_TYPES.map((mealType) => (
              <Fragment key={mealType}>
                <div className="text-sm font-semibold text-gray-700 self-center dark:text-gray-300">
                  {MEAL_TYPE_LABELS[mealType]}
                </div>
                {DAYS_OF_WEEK.map((day) => {
                  const cell = selectionMap.get(`${day}-${mealType}`)
                  return (
                    <Cell
                      key={`${day}-${mealType}`}
                      weekStart={weekStart}
                      day={day}
                      mealType={mealType}
                      cell={cell}
                      locked={isLocked}
                    />
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

// ───────────────────────────────────────────────────────────
// Single grid cell. Renders an "+ Add" placeholder if empty,
// or the recipe name with Change/Remove controls if filled.
// ───────────────────────────────────────────────────────────
function Cell({
  weekStart,
  day,
  mealType,
  cell,
  locked,
}: {
  weekStart: string
  day: DayOfWeek
  mealType: MealType
  cell?: { recipeId: string; recipeName: string }
  locked: boolean
}) {
  const pickHref = `/meal-selector/pick?week=${weekStart}&day=${day}&type=${mealType}`

  if (!cell) {
    if (locked) {
      return (
        <div className="rounded-lg border border-dashed border-gray-300 p-3 text-center text-xs text-gray-400 min-h-[88px] flex items-center justify-center dark:border-gray-700 dark:text-gray-600">
          —
        </div>
      )
    }
    return (
      <Link
        href={pickHref}
        className="rounded-lg border border-dashed border-gray-300 p-3 text-center text-xs text-gray-500 min-h-[88px] flex items-center justify-center hover:border-blue-400 hover:text-blue-600 transition-colors dark:border-gray-700 dark:text-gray-500 dark:hover:border-blue-700 dark:hover:text-blue-400"
      >
        + Add
      </Link>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 min-h-[88px] flex flex-col dark:border-gray-800 dark:bg-gray-900">
      <Link
        href={`/recipes/${cell.recipeId}`}
        className="block text-sm font-medium text-gray-900 leading-snug line-clamp-3 hover:underline dark:text-gray-100"
      >
        {cell.recipeName}
      </Link>
      {!locked && (
        <div className="mt-auto pt-2 flex items-center justify-between text-xs">
          <Link
            href={pickHref}
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Change
          </Link>
          <ClearMealButton weekStart={weekStart} day={day} mealType={mealType} />
        </div>
      )}
    </div>
  )
}