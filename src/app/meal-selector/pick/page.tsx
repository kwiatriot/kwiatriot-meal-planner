import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isValidMonday, formatWeekRange, DAY_LABELS } from '@/lib/week'
import type { DayOfWeek, MealType } from '@/types/index'
import PickRecipeButton from './PickRecipeButton'

const VALID_DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday']
const VALID_TYPES: MealType[] = ['lunch', 'dinner', 'snack']

interface PageProps {
  searchParams: Promise<{ week?: string; day?: string; type?: string }>
}

export default async function PickPage({ searchParams }: PageProps) {
  const params = await searchParams

  // Defensive validation. If anything is fishy, send the user back to the grid.
  if (!isValidMonday(params.week)) redirect('/meal-selector')
  if (!params.day || !VALID_DAYS.includes(params.day as DayOfWeek)) {
    redirect(`/meal-selector?week=${params.week}`)
  }
  if (!params.type || !VALID_TYPES.includes(params.type as MealType)) {
    redirect(`/meal-selector?week=${params.week}`)
  }

  const weekStart = params.week
  const day = params.day as DayOfWeek
  const mealType = params.type as MealType

  const supabase = await createClient()
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, name, description, prep_time_min, cook_time_min, nutrition')
    .eq('type', mealType)
    .order('name')

  if (error) {
    return (
      <main className="p-6">
        <p className="text-red-600 dark:text-red-400">
          Failed to load recipes: {error.message}
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 dark:bg-gray-950">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href={`/meal-selector?week=${weekStart}`}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Back to plan
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">
            Pick {mealType} for {DAY_LABELS[day]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 dark:text-gray-400">
            {formatWeekRange(weekStart)}
          </p>
        </div>

        {(recipes ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              No {mealType} recipes yet.
            </p>
            <Link
              href="/recipes/new"
              className="mt-2 inline-block text-blue-600 hover:underline text-sm dark:text-blue-400"
            >
              Add one →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recipes!.map((r) => {
              const nutrition = r.nutrition as
                | { calories?: number; protein_g?: number }
                | null
              const totalMin = (r.prep_time_min ?? 0) + (r.cook_time_min ?? 0)
              return (
                <PickRecipeButton
                  key={r.id}
                  weekStart={weekStart}
                  day={day}
                  mealType={mealType}
                  recipeId={r.id}
                >
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {r.name}
                  </h3>
                  {r.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2 dark:text-gray-400">
                      {r.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    {totalMin > 0 && <span>{totalMin} min</span>}
                    {nutrition?.calories != null && (
                      <span>{nutrition.calories} kcal</span>
                    )}
                    {nutrition?.protein_g != null && (
                      <span>{nutrition.protein_g}g protein</span>
                    )}
                  </div>
                </PickRecipeButton>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}