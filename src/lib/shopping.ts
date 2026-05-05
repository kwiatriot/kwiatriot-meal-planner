import type { MealSelection, ShoppingItem, GroceryCategory } from '@/types'

/**
 * Aggregates ingredients from all meal selections into a deduplicated
 * shopping list, combining duplicate ingredients and summing quantities.
 */
export function generateShoppingList(
  mealPlanId: string,
  selections: MealSelection[]
): Omit<ShoppingItem, 'id' | 'created_at'>[] {
  const itemMap = new Map<string, Omit<ShoppingItem, 'id' | 'created_at'>>()

  for (const selection of selections) {
    if (!selection.recipe?.ingredients) continue

    for (const ingredient of selection.recipe.ingredients) {
      const key = `${ingredient.name.toLowerCase()}__${ingredient.unit}`

      if (itemMap.has(key)) {
        const existing = itemMap.get(key)!
        existing.quantity = (existing.quantity || 0) + (ingredient.quantity || 0)
      } else {
        itemMap.set(key, {
          meal_plan_id: mealPlanId,
          ingredient: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          category: ingredient.category as GroceryCategory,
          checked: false,
        })
      }
    }
  }

  // Sort by category for a logical grocery store flow
  const categoryOrder: GroceryCategory[] = [
    'produce', 'proteins', 'dairy', 'grains', 'pantry', 'frozen', 'other'
  ]

  return Array.from(itemMap.values()).sort(
    (a, b) =>
      categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
  )
}

/** Returns the Friday of the week containing the given date */
export function getFridayCutoff(weekStartDate: Date): Date {
  const friday = new Date(weekStartDate)
  friday.setDate(weekStartDate.getDate() + 4) // Mon + 4 = Fri
  friday.setHours(23, 59, 59, 999)
  return friday
}

/** Returns true if the current week's plan can still be edited */
export function isPlanEditable(weekStartDate: string): boolean {
  const cutoff = getFridayCutoff(new Date(weekStartDate))
  return new Date() < cutoff
}
