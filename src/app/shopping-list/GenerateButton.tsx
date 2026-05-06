'use client'

// Python-dev note on useTransition:
//   React's `useTransition` is roughly analogous to wrapping async work in a
//   concurrent.futures.Future — you get a `pending` boolean that flips true
//   while the Server Action is in flight, and React re-renders when it resolves.
//   The advantage over plain useState({ loading: false }) is that React can
//   interleave the transition with other UI updates and handle edge cases like
//   unmounting. Same pattern as ClearMealButton from the meal-selector.

import { useState, useTransition } from 'react'
import { generateShoppingList } from './actions'

export default function GenerateButton({
  weekStart,
  hasItems,
}: {
  weekStart: string
  hasItems: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleGenerate() {
    setError(null)
    setConfirming(false)
    startTransition(async () => {
      const result = await generateShoppingList({ weekStart })
      if (!result.ok) setError(result.error)
    })
  }

  // Two-step confirmation for Regenerate to prevent accidental list wipes
  if (hasItems && confirming && !pending) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          This will replace your current list.
        </span>
        <button
          onClick={handleGenerate}
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700"
        >
          Confirm
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-sm text-gray-600 hover:underline dark:text-gray-400"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={hasItems ? () => setConfirming(true) : handleGenerate}
        disabled={pending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? 'Generating…' : hasItems ? 'Regenerate' : 'Generate Shopping List'}
      </button>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
