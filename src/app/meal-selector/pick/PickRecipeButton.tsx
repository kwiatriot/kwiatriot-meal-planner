'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { selectMeal } from '../actions'
import type { DayOfWeek, MealType } from '@/types/index'

export default function PickRecipeButton({
  weekStart,
  day,
  mealType,
  recipeId,
  children,
}: {
  weekStart: string
  day: DayOfWeek
  mealType: MealType
  recipeId: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await selectMeal({
        weekStart,
        dayOfWeek: day,
        mealType,
        recipeId,
      })
      if (!result.error) {
        router.push(`/meal-selector?week=${weekStart}`)
      }
      // (Error path: we'd surface this with a toast or inline message —
      // adding that is a polish task for later.)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="block w-full text-left rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-400 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
    >
      {children}
    </button>
  )
}