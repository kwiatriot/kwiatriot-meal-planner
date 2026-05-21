'use client'

import { useTransition } from 'react'
import { deleteRecipe } from './actions'

export function DeleteRecipeButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Delete this recipe? This cannot be undone.')) return
    startTransition(async () => {
      const result = await deleteRecipe(id)
      // On success, deleteRecipe redirects server-side — we never reach here.
      // On failure (e.g. FK violation from an active meal selection), surface the error.
      if (result && !result.ok) {
        alert(result.error)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
