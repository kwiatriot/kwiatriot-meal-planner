'use client'

// Python-dev note on useOptimistic:
//   React's answer to "show the expected outcome immediately, reconcile with
//   server truth after." Closest mental model: an optimistic cache update you
//   assume will succeed while an async task runs. When the server confirms (or
//   rejects), React reverts the optimistic state and re-renders from the real data.

import { useOptimistic, useTransition } from 'react'
import { toggleShoppingItem } from './actions'

const CATEGORY_ORDER = [
  'produce',
  'meat_seafood',
  'dairy_eggs',
  'pantry',
  'frozen',
  'bakery',
  'beverages',
  'canned_jarred',
  'snacks',
  'condiments',
  'cleaning',
  'personal_care',
  'other',
] as const

const CATEGORY_LABELS: Record<string, string> = {
  produce: 'Produce',
  meat_seafood: 'Meat & Seafood',
  dairy_eggs: 'Dairy & Eggs',
  pantry: 'Pantry & Dry Goods',
  frozen: 'Frozen',
  bakery: 'Bakery & Bread',
  beverages: 'Beverages',
  canned_jarred: 'Canned & Jarred',
  snacks: 'Snacks',
  condiments: 'Condiments & Sauces',
  cleaning: 'Cleaning & Household',
  personal_care: 'Personal Care',
  other: 'Other',
}

type ShoppingItem = {
  id: string
  ingredient_name: string
  quantity: number | null
  unit: string | null
  category: string
  sort_order: number | null
  checked: boolean
}

function formatQty(n: number): string {
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(2).replace(/\.?0+$/, '')
}

export default function ShoppingList({ initialItems }: { initialItems: ShoppingItem[] }) {
  const [, startTransition] = useTransition()

  // useOptimistic: reducer receives the item id + new checked value and flips
  // that one item in the list. React shows this state while the server action
  // is in-flight, then reconciles with the fresh server data on completion.
  const [items, updateOptimistic] = useOptimistic(
    initialItems,
    (state, { id, checked }: { id: string; checked: boolean }) =>
      state.map((item) => (item.id === id ? { ...item, checked } : item)),
  )

  function handleToggle(id: string, currentChecked: boolean) {
    startTransition(async () => {
      updateOptimistic({ id, checked: !currentChecked })
      await toggleShoppingItem(id, !currentChecked)
    })
  }

  // Group by category in display order
  const grouped = new Map<string, ShoppingItem[]>()
  for (const cat of CATEGORY_ORDER) grouped.set(cat, [])
  for (const item of items) {
    const cat = item.category ?? 'other'
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(item)
  }

  // Within each group: unchecked items first (by sort_order), checked items last.
  // This sort runs client-side on every render so optimistic updates are instant.
  for (const [cat, catItems] of grouped) {
    grouped.set(
      cat,
      [...catItems].sort((a, b) => {
        if (a.checked !== b.checked) return a.checked ? 1 : -1
        return (a.sort_order ?? 0) - (b.sort_order ?? 0)
      }),
    )
  }

  return (
    <div className="space-y-6">
      {CATEGORY_ORDER.map((cat) => {
        const catItems = grouped.get(cat) ?? []
        if (catItems.length === 0) return null
        return (
          <section key={cat}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 dark:text-gray-400">
              {CATEGORY_LABELS[cat]}
            </h2>
            <ul className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:divide-gray-800">
              {catItems.map((item) => (
                <li
                  key={item.id}
                  className="px-4 py-2.5 flex items-center gap-3 text-sm"
                >
                  <button
                    onClick={() => handleToggle(item.id, item.checked)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      item.checked
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-300 hover:border-blue-400 dark:border-gray-600 dark:hover:border-blue-500'
                    }`}
                    aria-label={item.checked ? 'Uncheck item' : 'Check item'}
                  >
                    {item.checked && (
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                  <span className="tabular-nums text-gray-500 dark:text-gray-400 min-w-[5rem] text-right shrink-0">
                    {item.quantity != null ? formatQty(Number(item.quantity)) : ''}
                    {item.unit ? ` ${item.unit}` : ''}
                  </span>
                  <span
                    className={
                      item.checked
                        ? 'line-through text-gray-400 dark:text-gray-600'
                        : 'text-gray-900 dark:text-gray-100'
                    }
                  >
                    {item.ingredient_name}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
