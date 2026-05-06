'use client'

import { useTransition } from 'react'
import { clearMeal } from './actions'
import type { DayOfWeek, MealType } from '@/types/index'

/**
 * Python-dev note on `useTransition`:
 *
 * In React, calling a Server Action from a click handler is async. Without
 * help, the UI gives no feedback while it runs. `useTransition` returns:
 *   - `pending`: a boolean that is true while the transition is in flight
 *   - `startTransition(fn)`: wraps your async work and toggles `pending`
 *
 * Conceptually it's like Python's `concurrent.futures` `Future` — you fire
 * off async work, get a handle to its "is it done yet" state, and React
 * re-renders the component when the state changes. The win over plain
 * `useState({ pending: false })` is that React can interleave the transition
 * with other UI updates (and could even cancel it on unmount).
 */
export default function ClearMealButton({
  weekStart,
  day,
  mealType,
}: {
  weekStart: string
  day: DayOfWeek
  mealType: MealType
}) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await clearMeal({ weekStart, dayOfWeek: day, mealType })
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
    >
      {pending ? '...' : 'Remove'}
    </button>
  )
}