'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { parseIngredients } from '@/lib/ingredients'
import type { Json } from '@/types/database.types'

export async function updateRecipe(
  id: string,
  formData: FormData,
): Promise<{ ok: false; error: string } | void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const ingredients = parseIngredients((formData.get('ingredients') as string) ?? '')

  const nutrition: Json = {
    calories: parseInt(formData.get('calories') as string) || 0,
    protein_g: parseFloat(formData.get('protein_g') as string) || 0,
    carbs_g: parseFloat(formData.get('carbs_g') as string) || 0,
    fat_g: parseFloat(formData.get('fat_g') as string) || 0,
    fiber_g: parseFloat(formData.get('fiber_g') as string) || 0,
  }

  const { data, error } = await supabase
    .from('recipes')
    .update({
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      description: (formData.get('description') as string) || null,
      prep_time_min: parseInt(formData.get('prep_time_min') as string) || null,
      cook_time_min: parseInt(formData.get('cook_time_min') as string) || null,
      servings: parseInt(formData.get('servings') as string) || 2,
      ingredients,
      instructions: (formData.get('instructions') as string) || null,
      nutrition,
    })
    .eq('id', id)
    .select()

  if (error) return { ok: false, error: error.message }
  if (!data || data.length === 0) return { ok: false, error: 'Recipe not found, or you do not have permission to edit it.' }

  revalidatePath(`/recipes/${id}`)
  revalidatePath('/recipes')
  redirect(`/recipes/${id}`)
}

export async function deleteRecipe(
  id: string,
): Promise<{ ok: false; error: string } | void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  // Compute this week's Monday (week_start_date is always a Monday).
  const today = new Date()
  const daysSinceMonday = today.getDay() === 0 ? 6 : today.getDay() - 1
  const currentMonday = new Date(today)
  currentMonday.setDate(today.getDate() - daysSinceMonday)
  const currentMondayStr = currentMonday.toISOString().split('T')[0]

  // Block delete if the recipe appears in the current or any future meal plan.
  const { data: activeSelections } = await supabase
    .from('meal_selections')
    .select('id, meal_plans!inner(week_start_date)')
    .eq('recipe_id', id)
    .gte('meal_plans.week_start_date', currentMondayStr)

  if (activeSelections && activeSelections.length > 0) {
    return {
      ok: false,
      error: 'This recipe is in a current or upcoming meal plan. Remove it from the plan first.',
    }
  }

  // Remove any past meal selections referencing this recipe so the FK (RESTRICT)
  // doesn't block the delete below.
  await supabase.from('meal_selections').delete().eq('recipe_id', id)

  const { data, error } = await supabase.from('recipes').delete().eq('id', id).select()

  if (error) return { ok: false, error: error.message }

  if (!data || data.length === 0) {
    return { ok: false, error: 'Recipe not found, or you do not have permission to delete it.' }
  }

  revalidatePath('/recipes')
  redirect('/recipes')
}
