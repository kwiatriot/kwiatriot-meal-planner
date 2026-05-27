'use client'

import { useRef, useState, useTransition } from 'react'
import { addManualShoppingItem } from './actions'

// Static fallback category list in display order — mirrors the DB constraint
// values added in migration 005. Shown even if no current list items exist.
const STATIC_CATEGORIES = [
  { value: 'produce', label: 'Produce' },
  { value: 'dairy_eggs', label: 'Dairy & Eggs' },
  { value: 'meat_seafood', label: 'Meat & Seafood' },
  { value: 'pantry', label: 'Pantry & Dry Goods' },
  { value: 'canned_jarred', label: 'Canned & Jarred' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'bakery', label: 'Bakery & Bread' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'condiments', label: 'Condiments & Sauces' },
  { value: 'cleaning', label: 'Cleaning & Household' },
  { value: 'personal_care', label: 'Personal Care' },
  { value: 'other', label: 'Other' },
]

interface Props {
  planId: string | null
  hasItems: boolean
  existingCategories: string[]
}

export default function AddItemForm({ planId, hasItems, existingCategories }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Default to the first category already in the list; fall back to Produce
  const defaultCategory = existingCategories[0] ?? 'produce'

  const disabled = !hasItems || !planId

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!planId) return

    const fd = new FormData(e.currentTarget)
    const name = (fd.get('name') as string).trim()
    const quantity = ((fd.get('quantity') as string) ?? '').trim()
    const category = (fd.get('category') as string) ?? 'other'

    setError(null)
    startTransition(async () => {
      const result = await addManualShoppingItem(planId, name, quantity, category)
      if (!result.ok) {
        setError(result.error)
      } else {
        formRef.current?.reset()
      }
    })
  }

  return (
    <section className="mt-8 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-sm font-semibold text-gray-700 mb-3 dark:text-gray-300">
        Add item manually
      </h2>

      {disabled ? (
        <p className="text-sm text-gray-400 dark:text-gray-600">
          Generate the list first to add custom items.
        </p>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              name="name"
              required
              placeholder="Item name"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              disabled={isPending}
            />
            <input
              name="quantity"
              placeholder="Qty (optional)"
              className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              disabled={isPending}
            />
            <select
              name="category"
              defaultValue={defaultCategory}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              disabled={isPending}
            >
              {STATIC_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 shrink-0"
            >
              {isPending ? 'Adding…' : 'Add'}
            </button>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </form>
      )}
    </section>
  )
}
