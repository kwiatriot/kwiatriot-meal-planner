import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  addWeeks,
  formatWeekRange,
  isValidMonday,
  nextPlanningWeek,
} from '@/lib/week'
import GenerateButton from './GenerateButton'
import ShoppingList from './ShoppingList'
import AddItemForm from './AddItemForm'

// Python-dev note on searchParams:
//   In Next.js 15+, searchParams is a Promise — it's an async dependency that
//   resolves to the URL query dict. Equivalent to Django's request.GET, but
//   you have to await it in async server components.

interface PageProps {
  searchParams: Promise<{ week?: string }>
}

export default async function ShoppingListPage({ searchParams }: PageProps) {
  const params = await searchParams

  if (params.week !== undefined && !isValidMonday(params.week)) {
    redirect('/shopping-list')
  }
  const weekStart = params.week ?? nextPlanningWeek()

  const supabase = await createClient()

  const { data: plan } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('week_start_date', weekStart)
    .maybeSingle()

  const items = plan
    ? (
        await supabase
          .from('shopping_items')
          .select('id, ingredient_name, quantity, unit, category, sort_order, checked')
          .eq('meal_plan_id', plan.id)
          .order('sort_order', { ascending: true })
      ).data ?? []
    : []

  const hasItems = items.length > 0

  // Distinct categories already present — used to default the manual add form
  const existingCategories = [...new Set(items.map((item) => item.category))]

  const prevWeek = addWeeks(weekStart, -1)
  const nextWeek = addWeeks(weekStart, 1)

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 dark:bg-gray-950">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Shopping List
              </h1>
              <p className="text-sm text-gray-500 mt-0.5 dark:text-gray-400">
                {formatWeekRange(weekStart)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/shopping-list?week=${prevWeek}`}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                ← Prev
              </Link>
              <Link
                href="/shopping-list"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Next week
              </Link>
              <Link
                href={`/shopping-list?week=${nextWeek}`}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Next →
              </Link>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-4 flex-wrap">
            <Link
              href="/meal-selector"
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              ← Back to planner
            </Link>
            <GenerateButton weekStart={weekStart} hasItems={hasItems} />
          </div>
        </div>

        {/* Content */}
        {!hasItems ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              No shopping list yet for this week.
            </p>
            <p className="text-sm text-gray-400 mt-1 dark:text-gray-500">
              Select meals in the planner, then click Generate Shopping List above.
            </p>
          </div>
        ) : (
          <ShoppingList initialItems={items} />
        )}

        <AddItemForm
          planId={plan?.id ?? null}
          hasItems={hasItems}
          existingCategories={existingCategories}
        />
      </div>
    </main>
  )
}
