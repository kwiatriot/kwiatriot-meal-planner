import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  MealPlanRow,
  MealSelectionRow,
  RecipeRow,
} from '@/types/database.types'

type Client = SupabaseClient<Database>

/**
 * Find the meal_plan for `weekStart`, or create a new draft plan if none exists.
 * Idempotent — safe to call before every save.
 *
 * Python-dev note: this is the JS equivalent of Django's
 * `MealPlan.objects.get_or_create(week_start_date=...)`. There's no
 * built-in version in the Supabase client, so we compose it ourselves.
 */
export async function getOrCreateMealPlan(
  supabase: Client,
  weekStart: string,
): Promise<{ data: MealPlanRow | null; error: string | null }> {
  const existing = await supabase
    .from('meal_plans')
    .select('*')
    .eq('week_start_date', weekStart)
    .maybeSingle()

  if (existing.error) return { data: null, error: existing.error.message }
  if (existing.data) return { data: existing.data, error: null }

  const created = await supabase
    .from('meal_plans')
    .insert({ week_start_date: weekStart, status: 'draft' })
    .select('*')
    .single()

  if (created.error) {
    // Tiny race window: another request inserted between our SELECT and INSERT.
    // The unique constraint on week_start_date will reject our INSERT.
    // Re-read and return the winner.
    const retry = await supabase
      .from('meal_plans')
      .select('*')
      .eq('week_start_date', weekStart)
      .maybeSingle()
    if (retry.data) return { data: retry.data, error: null }
    return { data: null, error: created.error.message }
  }
  return { data: created.data, error: null }
}

/** A meal_selection row with its joined recipe (just the fields we need for the grid). */
export type SelectionWithRecipe = MealSelectionRow & {
  recipes: Pick<RecipeRow, 'id' | 'name' | 'type' | 'nutrition'> | null
}

/**
 * Fetch all selections for a plan, with each selection's recipe joined inline.
 *
 * Python-dev note: the `*, recipes(id, name, ...)` syntax is Supabase's
 * shorthand for a SQL JOIN. It produces a nested object on each row —
 * `row.recipes` is the joined recipe (or `null` if the recipe was deleted).
 * Roughly the equivalent of Django's `select_related('recipe')`.
 */
export async function getSelectionsForPlan(
  supabase: Client,
  mealPlanId: string,
): Promise<{ data: SelectionWithRecipe[]; error: string | null }> {
  const { data, error } = await supabase
    .from('meal_selections')
    .select('*, recipes(id, name, type, nutrition)')
    .eq('meal_plan_id', mealPlanId)

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as SelectionWithRecipe[], error: null }
}