// Codec for the ingredients textarea ↔ Ingredient[] JSONB shape.
// Extracted from recipes/new/actions.ts so both create and edit share the same
// parse/stringify pair — avoids the round-trip mismatch bug where the textarea
// format diverges from what's stored.

import type { GroceryCategory } from '@/types/index'
import type { Json } from '@/types/database.types'

export type IngredientRow = {
  name: string
  quantity: number
  unit: string
  category: GroceryCategory
}

// Parse textarea text (one ingredient per line: "name | qty | unit | category") → Json.
// Blank lines are skipped; partial lines fall back to safe defaults.
export function parseIngredients(raw: string): Json {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = '', qty = '', unit = '', category = ''] = line.split('|').map((s) => s.trim())
      return {
        name,
        quantity: parseFloat(qty) || 0,
        unit,
        category: (category as GroceryCategory) || 'other',
      }
    }) as Json
}

// Inverse of parseIngredients — serialize stored Ingredient[] back to textarea text.
// Symmetric so round-tripping through the edit form is lossless.
export function stringifyIngredients(ingredients: IngredientRow[]): string {
  return ingredients
    .map((ing) => `${ing.name} | ${ing.quantity} | ${ing.unit} | ${ing.category}`)
    .join('\n')
}
