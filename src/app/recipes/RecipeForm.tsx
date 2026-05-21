'use client'

import { useState, useTransition } from 'react'
import type { MealType, GroceryCategory, NutritionInfo } from '@/types/index'

const MEAL_TYPES: MealType[] = ['lunch', 'dinner', 'snack']
const CATEGORIES: GroceryCategory[] = ['produce', 'proteins', 'dairy', 'grains', 'pantry', 'frozen', 'other']

const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500'
const textareaCls = `${inputCls} resize-y min-h-[80px]`

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{label}</label>
      {children}
    </div>
  )
}

type RecipeFormProps = {
  mode: 'create' | 'edit'
  initialValues?: {
    name: string
    type: MealType
    ingredientsText: string
    description?: string | null
    prep_time_min?: number | null
    cook_time_min?: number | null
    servings?: number | null
    instructions?: string | null
    nutrition?: NutritionInfo | null
  }
  // On success the action redirects (throws NEXT_REDIRECT) so we never see { ok: true }.
  // On failure it returns { ok: false; error: string }.
  action: (formData: FormData) => Promise<{ ok: false; error: string } | void>
}

export function RecipeForm({ mode, initialValues, action }: RecipeFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    // Python-dev note: startTransition(async fn) is React 19's way to run an
    // async side-effect while keeping `isPending` true until it resolves.
    // Conceptually: asyncio.create_task() + a .done() hook that flips a bool.
    startTransition(async () => {
      const result = await action(new FormData(e.currentTarget))
      // On success, action redirects (throws) — we never reach here.
      // On failure, result is { ok: false; error: string }.
      if (result && !result.ok) {
        setError(result.error)
      }
    })
  }

  const v = initialValues

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 dark:bg-gray-950">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {mode === 'create' ? 'Add Recipe' : 'Edit Recipe'}
          </h1>
          <a href="/recipes" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            ← Back to library
          </a>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5 dark:bg-gray-900 dark:border-gray-800"
        >
          <Field label="Name *">
            <input
              name="name"
              type="text"
              required
              defaultValue={v?.name}
              className={inputCls}
              placeholder="e.g. Lemon Herb Salmon"
            />
          </Field>

          <Field label="Type *">
            <select name="type" required defaultValue={v?.type ?? 'lunch'} className={inputCls}>
              {MEAL_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </Field>

          <Field label="Description">
            <textarea
              name="description"
              defaultValue={v?.description ?? ''}
              className={textareaCls}
              placeholder="Short summary of the dish"
            />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Prep (min)">
              <input
                name="prep_time_min"
                type="number"
                min="0"
                defaultValue={v?.prep_time_min ?? ''}
                className={inputCls}
                placeholder="15"
              />
            </Field>
            <Field label="Cook (min)">
              <input
                name="cook_time_min"
                type="number"
                min="0"
                defaultValue={v?.cook_time_min ?? ''}
                className={inputCls}
                placeholder="25"
              />
            </Field>
            <Field label="Servings">
              <input
                name="servings"
                type="number"
                min="1"
                defaultValue={v?.servings ?? 2}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Ingredients">
            <p className="text-xs text-gray-400 mb-1 dark:text-gray-500">
              One per line: <code>name | quantity | unit | category</code>
              <br />
              Categories: {CATEGORIES.join(', ')}
            </p>
            <textarea
              name="ingredients"
              defaultValue={v?.ingredientsText ?? ''}
              className={`${textareaCls} min-h-[120px] font-mono text-xs`}
              placeholder={`chicken breast | 200 | g | proteins\nbroccoli | 1 | cup | produce`}
            />
          </Field>

          <Field label="Instructions">
            <textarea
              name="instructions"
              defaultValue={v?.instructions ?? ''}
              className={`${textareaCls} min-h-[100px]`}
              placeholder="Step-by-step cooking instructions"
            />
          </Field>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Nutrition (per serving)</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { name: 'calories', label: 'Calories', value: v?.nutrition?.calories },
                { name: 'protein_g', label: 'Protein (g)', value: v?.nutrition?.protein_g },
                { name: 'carbs_g', label: 'Carbs (g)', value: v?.nutrition?.carbs_g },
                { name: 'fat_g', label: 'Fat (g)', value: v?.nutrition?.fat_g },
                { name: 'fiber_g', label: 'Fiber (g)', value: v?.nutrition?.fiber_g },
              ].map(({ name, label, value }) => (
                <div key={name}>
                  <label className="block text-xs text-gray-500 mb-0.5 dark:text-gray-400">{label}</label>
                  <input
                    name={name}
                    type="number"
                    min="0"
                    step="0.1"
                    defaultValue={value ?? ''}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-600 text-sm dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <a
              href="/recipes"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Saving…' : mode === 'create' ? 'Add Recipe' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
