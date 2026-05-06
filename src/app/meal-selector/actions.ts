'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateMealPlan } from '@/lib/meal-plan'
import type { DayOfWeek, MealType } from '@/types/index'

export async function selectMeal(input: {
  weekStart: string
  dayOfWeek: DayOfWeek
  mealType: MealType
  recipeId: string
}): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const plan = await getOrCreateMealPlan(supabase, input.weekStart)
  if (plan.error || !plan.data) {
    return { error: plan.error ?? 'Failed to load plan' }
  }

  // Upsert by the natural unique key. If a selection already exists for that
  // (plan, day, meal_type), we replace its recipe_id instead of creating a duplicate.
  const { error } = await supabase
    .from('meal_selections')
    .upsert(
      {
        meal_plan_id: plan.data.id,
        day_of_week: input.dayOfWeek,
        meal_type: input.mealType,
        recipe_id: input.recipeId,
      },
      { onConflict: 'meal_plan_id,meal_type,day_of_week' },
    )

  if (error) return { error: error.message }

  revalidatePath('/meal-selector')
  return { error: null }
}

export async function clearMeal(input: {
  weekStart: string
  dayOfWeek: DayOfWeek
  mealType: MealType
}): Promise<{ error: string | null }> {
  const supabase = await createClient()

  // No plan? Nothing to clear.
  const { data: plan } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('week_start_date', input.weekStart)
    .maybeSingle()

  if (!plan) return { error: null }

  const { error } = await supabase
    .from('meal_selections')
    .delete()
    .eq('meal_plan_id', plan.id)
    .eq('day_of_week', input.dayOfWeek)
    .eq('meal_type', input.mealType)

  if (error) return { error: error.message }

  revalidatePath('/meal-selector')
  return { error: null }
}