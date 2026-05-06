'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateMealPlan, getSelectionsWithIngredients } from '@/lib/meal-plan'
import { aggregateIngredients } from '@/lib/shopping-list'
import { categorizeIngredients, VALID_CATEGORIES } from '@/lib/categorize'
import type { Category } from '@/lib/categorize'

// Python-dev note on discriminated unions:
//   `{ ok: true } | { ok: false; error: string }` is a discriminated union.
//   After checking `result.ok`, TypeScript narrows the type — `result.error`
//   is only accessible in the `false` branch. Python's closest equivalent is
//   the `Result[T, E]` pattern from libraries like `returns`, but TS gives
//   this narrowing for free with plain union types.

export async function generateShoppingList({
  weekStart,
}: {
  weekStart: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: plan, error: planError } = await getOrCreateMealPlan(supabase, weekStart)
  if (planError || !plan) return { ok: false, error: planError ?? 'Failed to load plan' }

  const { data: selections, error: selError } = await getSelectionsWithIngredients(
    supabase,
    plan.id,
  )
  if (selError) return { ok: false, error: selError }
  if (selections.length === 0) return { ok: false, error: 'No meals selected for this week' }

  const aggregated = aggregateIngredients(selections)
  if (aggregated.length === 0) {
    return { ok: false, error: 'No ingredients found in selected recipes' }
  }

  const categories = await categorizeIngredients(aggregated)

  // Sort: category enum order (produce first, other last), then alpha within
  const sorted = [...aggregated].sort((a, b) => {
    const catA = categories.get(a.name) ?? 'other'
    const catB = categories.get(b.name) ?? 'other'
    const orderDiff = VALID_CATEGORIES.indexOf(catA) - VALID_CATEGORIES.indexOf(catB)
    if (orderDiff !== 0) return orderDiff
    return a.name.localeCompare(b.name)
  })

  const rows = sorted.map((item, i) => ({
    meal_plan_id: plan.id,
    ingredient_name: item.name,
    quantity: item.quantity || null,
    unit: item.unit || null,
    category: (categories.get(item.name) ?? 'other') as Category,
    sort_order: i,
  }))

  // DELETE then INSERT — not atomic (Supabase JS client has no transaction API),
  // but acceptable: the list is small, regenerable, and DELETE cascades on plan deletion.
  const { error: delError } = await supabase
    .from('shopping_items')
    .delete()
    .eq('meal_plan_id', plan.id)

  if (delError) return { ok: false, error: delError.message }

  const { error: insError } = await supabase.from('shopping_items').insert(rows)
  if (insError) return { ok: false, error: insError.message }

  revalidatePath('/shopping-list')
  return { ok: true }
}
