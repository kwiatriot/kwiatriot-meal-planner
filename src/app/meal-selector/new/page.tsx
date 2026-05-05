// "use client" is needed here because this component uses useState + event handlers.
//
// Python-dev note — controlled inputs vs Django forms:
//   Django renders a form from the server, the browser posts it, and Django re-renders
//   with errors. There is no live JS state between keystrokes.
//
//   In React, every <input value={x} onChange={...}> ties the DOM to a JS variable (x).
//   React re-renders on each keystroke, keeping the displayed value in sync with state.
//   This is "controlled" (React owns the value) vs "uncontrolled" (the DOM owns it).
//
//   Django analogy: imagine a Django form where every field runs form.is_valid() and
//   re-renders after each character. Controlled inputs give you that live feedback
//   (error validation, dependent fields, preview text) without a round-trip.
//
//   The trade-off: you need useState for every field. For a simple insert-only form
//   like this one you could skip useState and use a plain <form action={serverAction}>,
//   but we need the error state variable to show inline errors, so useState it is.
'use client'

import { useState } from 'react'
import { addRecipe } from './actions'
import type { MealType, GroceryCategory } from '@/types/index'

const MEAL_TYPES: MealType[] = ['lunch', 'dinner', 'snack']
const CATEGORIES: GroceryCategory[] = ['produce', 'proteins', 'dairy', 'grains', 'pantry', 'frozen', 'other']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const textareaCls = `${inputCls} resize-y min-h-[80px]`

export default function NewRecipePage() {
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const result = await addRecipe(new FormData(e.currentTarget))

    // addRecipe redirects on success, so we only get here on error
    if (result && 'error' in result) {
      setError(result.error)
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add Recipe</h1>
          <a href="/meal-selector" className="text-sm text-blue-600 hover:underline">
            ← Back to library
          </a>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          {/* ── Basics ── */}
          <Field label="Name *">
            <input name="name" type="text" required className={inputCls} placeholder="e.g. Lemon Herb Salmon" />
          </Field>

          <Field label="Type *">
            <select name="type" required className={inputCls}>
              {MEAL_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </Field>

          <Field label="Description">
            <textarea name="description" className={textareaCls} placeholder="Short summary of the dish" />
          </Field>

          {/* ── Timing & servings ── */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Prep (min)">
              <input name="prep_time_min" type="number" min="0" className={inputCls} placeholder="15" />
            </Field>
            <Field label="Cook (min)">
              <input name="cook_time_min" type="number" min="0" className={inputCls} placeholder="25" />
            </Field>
            <Field label="Servings">
              <input name="servings" type="number" min="1" defaultValue={2} className={inputCls} />
            </Field>
          </div>

          {/* ── Ingredients ── */}
          <Field label="Ingredients">
            <p className="text-xs text-gray-400 mb-1">
              One per line: <code>name | quantity | unit | category</code>
              <br />
              Categories: {CATEGORIES.join(', ')}
            </p>
            <textarea
              name="ingredients"
              className={`${textareaCls} min-h-[120px] font-mono text-xs`}
              placeholder={`chicken breast | 200 | g | proteins\nbroccoli | 1 | cup | produce`}
            />
          </Field>

          {/* ── Instructions ── */}
          <Field label="Instructions">
            <textarea
              name="instructions"
              className={`${textareaCls} min-h-[100px]`}
              placeholder="Step-by-step cooking instructions"
            />
          </Field>

          {/* ── Nutrition ── */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Nutrition (per serving)</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { name: 'calories', label: 'Calories' },
                { name: 'protein_g', label: 'Protein (g)' },
                { name: 'carbs_g', label: 'Carbs (g)' },
                { name: 'fat_g', label: 'Fat (g)' },
                { name: 'fiber_g', label: 'Fiber (g)' },
              ].map(({ name, label }) => (
                <div key={name}>
                  <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
                  <input name={name} type="number" min="0" step="0.1" className={inputCls} placeholder="0" />
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <a
              href="/meal-selector"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save Recipe'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
