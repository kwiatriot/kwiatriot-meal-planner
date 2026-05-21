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

  const { error } = await supabase
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

  if (error) return { ok: false, error: error.message }

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

  // Narrow try/catch around the DELETE only — redirect() must NOT be inside a
  // catch block or it will never fire (it throws NEXT_REDIRECT as its mechanism).
  // Python analogue: raise HttpResponseRedirect(...) — same idea, different syntax.
  const { error } = await supabase.from('recipes').delete().eq('id', id)

  if (error) {
    // Postgres error code 23503 = foreign_key_violation.
    // Once migration 004 is applied (ON DELETE RESTRICT), this fires when the
    // recipe is referenced by an active meal_selection row.
    if (error.code === '23503') {
      return {
        ok: false,
        error: 'This recipe is currently in a planned meal. Un-select it first.',
      }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath('/recipes')
  redirect('/recipes') // throws NEXT_REDIRECT — this is the natural exit, not an error
}
