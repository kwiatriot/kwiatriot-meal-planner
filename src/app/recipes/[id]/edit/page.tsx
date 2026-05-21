import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { stringifyIngredients, type IngredientRow } from '@/lib/ingredients'
import { RecipeForm } from '../../RecipeForm'
import { updateRecipe } from '../actions'
import type { MealType, NutritionInfo } from '@/types/index'

interface Props {
  params: Promise<{ id: string }>
}

// Convert a stored recipe row into the shape RecipeForm's initialValues expects.
// The tricky field is ingredientsText: we round-trip the JSONB ingredients back
// to "name | qty | unit | category" textarea format via stringifyIngredients.
function recipeToFormValues(recipe: {
  name: string
  type: string
  description: string | null
  prep_time_min: number | null
  cook_time_min: number | null
  servings: number | null
  ingredients: unknown
  instructions: string | null
  nutrition: unknown
}) {
  return {
    name: recipe.name,
    type: recipe.type as MealType,
    ingredientsText: stringifyIngredients(
      (recipe.ingredients as IngredientRow[]) ?? [],
    ),
    description: recipe.description,
    prep_time_min: recipe.prep_time_min,
    cook_time_min: recipe.cook_time_min,
    servings: recipe.servings,
    instructions: recipe.instructions,
    nutrition: recipe.nutrition as NutritionInfo | null,
  }
}

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: recipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()

  if (!recipe) redirect('/recipes')

  // Python-dev note: .bind(null, id) is functools.partial(update_recipe, id).
  // We can't use an inline closure here — Next.js needs a top-level Server
  // Action reference it can serialize to the client. .bind pre-fills `id`
  // so the form only passes `formData` when it calls the action.
  return (
    <RecipeForm
      mode="edit"
      initialValues={recipeToFormValues(recipe)}
      action={updateRecipe.bind(null, id)}
    />
  )
}
