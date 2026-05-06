import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Ingredient, NutritionInfo } from '@/types/index'

interface Props {
  params: Promise<{ id: string }>
}

export default async function RecipeDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !recipe) notFound()

  const ingredients = recipe.ingredients as unknown as Ingredient[]
  const nutrition = recipe.nutrition as unknown as NutritionInfo | null
  const totalMin = (recipe.prep_time_min ?? 0) + (recipe.cook_time_min ?? 0)

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 dark:bg-gray-950">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <Link href="/recipes" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            ← Back to library
          </Link>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{recipe.name}</h1>
              <span className="mt-1 inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 capitalize dark:bg-blue-900/40 dark:text-blue-300">
                {recipe.type}
              </span>
            </div>
            <div className="flex gap-2 shrink-0">
              <button disabled className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-400 cursor-not-allowed dark:border-gray-700 dark:text-gray-600">
                Edit
              </button>
              <button disabled className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-300 cursor-not-allowed dark:border-red-900 dark:text-red-800">
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          {recipe.prep_time_min != null && <span>Prep: {recipe.prep_time_min} min</span>}
          {recipe.cook_time_min != null && <span>Cook: {recipe.cook_time_min} min</span>}
          {totalMin > 0 && <span className="font-medium">Total: {totalMin} min</span>}
          {recipe.servings != null && <span>Serves: {recipe.servings}</span>}
        </div>

        {/* Description */}
        {recipe.description && (
          <p className="text-gray-700 dark:text-gray-300">{recipe.description}</p>
        )}

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2 dark:text-gray-200">Ingredients</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    <th className="py-2 pr-4 font-medium">Item</th>
                    <th className="py-2 pr-4 font-medium">Qty</th>
                    <th className="py-2 pr-4 font-medium">Unit</th>
                    <th className="py-2 font-medium">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ing, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 pr-4">{ing.name}</td>
                      <td className="py-2 pr-4 tabular-nums">{ing.quantity}</td>
                      <td className="py-2 pr-4">{ing.unit}</td>
                      <td className="py-2 text-gray-500 capitalize dark:text-gray-400">{ing.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Instructions */}
        {recipe.instructions && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2 dark:text-gray-200">Instructions</h2>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed dark:text-gray-300">{recipe.instructions}</p>
          </section>
        )}

        {/* Nutrition */}
        {nutrition && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2 dark:text-gray-200">Nutrition (per serving)</h2>
            <div className="grid grid-cols-5 gap-3 text-center">
              {[
                { label: 'Calories', value: nutrition.calories },
                { label: 'Protein', value: `${nutrition.protein_g}g` },
                { label: 'Carbs', value: `${nutrition.carbs_g}g` },
                { label: 'Fat', value: `${nutrition.fat_g}g` },
                { label: 'Fiber', value: `${nutrition.fiber_g}g` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-gray-100 px-2 py-3 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  <p className="font-semibold text-gray-800 mt-0.5 dark:text-gray-200">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}