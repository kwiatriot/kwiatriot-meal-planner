import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { RecipeRow } from '@/types/database.types'
import type { MealType } from '@/types/index'

const TYPE_ORDER: MealType[] = ['lunch', 'dinner', 'snack']

const TYPE_LABELS: Record<MealType, string> = {
  lunch: 'Lunches',
  dinner: 'Dinners',
  snack: 'Snacks',
}

function RecipeCard({ recipe }: { recipe: RecipeRow }) {
  const nutrition = recipe.nutrition as { calories?: number; protein_g?: number } | null
  const totalMin = (recipe.prep_time_min ?? 0) + (recipe.cook_time_min ?? 0)

  return (
    <Link
      href={`/meal-selector/${recipe.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
    >
      <h3 className="font-semibold text-gray-900 leading-snug">{recipe.name}</h3>
      {recipe.description && (
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{recipe.description}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {totalMin > 0 && <span>{totalMin} min</span>}
        {nutrition?.calories != null && <span>{nutrition.calories} kcal</span>}
        {nutrition?.protein_g != null && <span>{nutrition.protein_g}g protein</span>}
      </div>
    </Link>
  )
}

export default async function MealSelectorPage() {
  const supabase = await createClient()
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('*')
    .order('name')

  if (error) {
    return (
      <main className="p-6">
        <p className="text-red-600">Failed to load recipes: {error.message}</p>
      </main>
    )
  }

  const grouped = (recipes ?? []).reduce<Record<string, RecipeRow[]>>((acc, r) => {
    const key = r.type
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recipe Library</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {recipes?.length ?? 0} recipe{(recipes?.length ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/meal-selector/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Add Recipe
          </Link>
        </div>

        {(recipes ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">No recipes yet.</p>
            <Link href="/meal-selector/new" className="mt-2 inline-block text-blue-600 hover:underline text-sm">
              Add your first recipe
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {TYPE_ORDER.filter((t) => grouped[t]?.length > 0).map((type) => (
              <section key={type}>
                <h2 className="mb-3 text-lg font-semibold text-gray-700">{TYPE_LABELS[type]}</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {grouped[type].map((r) => (
                    <RecipeCard key={r.id} recipe={r} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
