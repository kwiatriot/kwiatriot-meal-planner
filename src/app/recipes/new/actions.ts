'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { parseIngredients } from '@/lib/ingredients'
import type { Json } from '@/types/database.types'

export async function addRecipe(
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

  const { error } = await supabase.from('recipes').insert({
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

  if (error) return { ok: false, error: error.message }

  redirect('/recipes')
}
