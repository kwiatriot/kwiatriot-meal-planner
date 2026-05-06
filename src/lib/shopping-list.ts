// Pure aggregation and unit-conversion functions for shopping list generation.
// No DB calls — easy to unit test in isolation.
//
// Python-dev notes:
//   - `flatMap` = itertools.chain.from_iterable + map combined into one pass
//   - `Map` (JS) is the closest thing to a Python dict that preserves insertion
//     order and is safe for non-string keys. We key groups with a "name::unit"
//     string because Object.groupBy only handles string keys anyway.
//   - `Array.prototype.reduce` is functools.reduce, but you'll rarely need it
//     here — flatMap + a for..of loop reads more clearly.

import type { Json } from '@/types/database.types'

// Shape of each item in recipes.ingredients JSONB
type Ingredient = {
  name: string
  quantity: number
  unit: string
  category: string
}

export type AggregatedIngredient = {
  name: string
  quantity: number
  unit: string
  fallbackCategory: string
}

// ─── Unit conversion tables ───────────────────────────────────────────────────

// All volume units → tsp as the canonical base.
// 1 cup = 48 tsp, 1 tbsp = 3 tsp, 1 fl oz = 6 tsp, 1 qt = 192 tsp, etc.
const VOLUME_TO_TSP: Record<string, number> = {
  tsp: 1, teaspoon: 1, teaspoons: 1,
  tbsp: 3, tablespoon: 3, tablespoons: 3,
  'fl oz': 6, 'fluid oz': 6, 'fluid ounce': 6, 'fluid ounces': 6,
  cup: 48, cups: 48,
  pt: 96, pint: 96, pints: 96,
  qt: 192, quart: 192, quarts: 192,
}

// All weight units → g as the canonical base.
const WEIGHT_TO_G: Record<string, number> = {
  g: 1, gram: 1, grams: 1,
  kg: 1000, kilogram: 1000, kilograms: 1000,
  oz: 28.3495, ounce: 28.3495, ounces: 28.3495,
  lb: 453.592, lbs: 453.592, pound: 453.592, pounds: 453.592,
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function round(n: number, decimals: number): number {
  return Math.round(n * 10 ** decimals) / 10 ** decimals
}

/**
 * Normalize an ingredient name so obvious duplicates collapse into one group.
 * Pragmatic only: lowercase + trim + strip common leading qualifiers +
 * naive de-pluralize. "Yellow onions" and "onion" will merge; "red onion"
 * and "yellow onion" will not — that's intentional.
 */
export function normalizeIngredientName(name: string): string {
  let n = name.toLowerCase().trim()
  // Strip the most common leading size/freshness qualifiers
  n = n.replace(/^(fresh|large|small|medium|extra large|extra)\s+/, '')
  // De-pluralize: "tomatoes" → "tomato", "onions" → "onion"
  // Guard against "ss" endings (e.g. "glass") and very short words
  if (n.endsWith('es') && n.length > 4) return n.slice(0, -2)
  if (n.endsWith('s') && n.length > 2 && !n.endsWith('ss')) return n.slice(0, -1)
  return n
}

/**
 * Convert a quantity+unit pair to a canonical base unit for aggregation.
 * Returns null for unknown or non-convertible units (pinch, dash, clove, etc.)
 * so the caller can keep them as separate line items rather than faking a sum.
 *
 * Python-dev note: the return type `{ qty, base } | null` is a discriminated
 * union — the `null` branch means "I don't know how to convert this."
 */
export function toBaseUnit(
  quantity: number,
  unit: string,
): { qty: number; base: 'tsp' | 'g' | 'count' } | null {
  const u = unit.toLowerCase().trim()
  if (u === '') return { qty: quantity, base: 'count' }
  const volumeFactor = VOLUME_TO_TSP[u]
  if (volumeFactor !== undefined) return { qty: quantity * volumeFactor, base: 'tsp' }
  const weightFactor = WEIGHT_TO_G[u]
  if (weightFactor !== undefined) return { qty: quantity * weightFactor, base: 'g' }
  // Pinch, dash, clove, head, "to taste", etc. — don't fake a conversion
  return null
}

/**
 * Convert a base-unit quantity back to the most human-readable display unit.
 * e.g. 72 tsp → 1.5 cup, 907 g → 2 lb.
 */
export function fromBaseUnit(
  qty: number,
  base: 'tsp' | 'g' | 'count',
): { quantity: number; unit: string } {
  if (base === 'count') return { quantity: round(qty, 2), unit: '' }

  if (base === 'tsp') {
    if (qty >= 192) return { quantity: round(qty / 192, 2), unit: 'qt' }
    if (qty >= 48) return { quantity: round(qty / 48, 2), unit: 'cup' }
    if (qty >= 3) return { quantity: round(qty / 3, 2), unit: 'tbsp' }
    return { quantity: round(qty, 2), unit: 'tsp' }
  }

  // base === 'g'
  if (qty >= 453.592) return { quantity: round(qty / 453.592, 2), unit: 'lb' }
  if (qty >= 28.3495) return { quantity: round(qty / 28.3495, 2), unit: 'oz' }
  return { quantity: round(qty, 1), unit: 'g' }
}

/**
 * Main entry point. Takes joined meal selections (output of getSelectionsWithIngredients),
 * flattens all recipe ingredient lists, and returns one deduplicated, unit-converted row
 * per (ingredient, unit-family) pair.
 *
 * Algorithm:
 *   1. flatMap all selections → one flat array of Ingredient objects
 *   2. For each ingredient: normalize name, convert to base unit
 *   3. Group by (normalizedName, canonicalBaseUnit) — unknowns group by original unit
 *   4. Sum quantities within each group (in base units)
 *   5. Convert summed base quantities back to display units
 *
 * Incompatible units ("1 cup tomatoes" + "2 whole tomatoes") produce two
 * separate line items — base units differ (tsp vs count), so they never merge.
 */
export function aggregateIngredients(
  selections: Array<{ recipes: { ingredients: Json } | null }>,
): AggregatedIngredient[] {
  // flatMap = itertools.chain.from_iterable applied after a map
  const allIngredients = selections.flatMap((s) => {
    const raw = s.recipes?.ingredients
    if (!Array.isArray(raw)) return []
    return raw as Ingredient[]
  })

  // Group by (normalizedName, canonicalUnit).
  // JS Map (vs plain object) because we want ordered iteration and explicit
  // sizing — closest to Python's collections.OrderedDict with a string key.
  type Group = {
    displayName: string
    totalQty: number
    baseUnit: 'tsp' | 'g' | 'count' | null // null = unknown, keep in original units
    originalUnit: string
    fallbackCategory: string
  }
  const groups = new Map<string, Group>()

  for (const ing of allIngredients) {
    const normalizedName = normalizeIngredientName(ing.name ?? '')
    const qty = Number(ing.quantity) || 0
    const baseResult = toBaseUnit(qty, ing.unit ?? '')
    // For unknown units, use the original unit as the grouping key so
    // "1 pinch salt" + "1 pinch salt" collapse to "2 pinch salt" instead of
    // becoming two separate items.
    const canonicalUnit = baseResult ? baseResult.base : (ing.unit ?? '').toLowerCase().trim()
    const key = `${normalizedName}::${canonicalUnit}`

    const existing = groups.get(key)
    if (existing) {
      existing.totalQty += baseResult ? baseResult.qty : qty
    } else {
      groups.set(key, {
        displayName: ing.name ?? '',
        totalQty: baseResult ? baseResult.qty : qty,
        baseUnit: baseResult?.base ?? null,
        originalUnit: ing.unit ?? '',
        fallbackCategory: ing.category ?? 'other',
      })
    }
  }

  return Array.from(groups.values()).map((g): AggregatedIngredient => {
    if (g.baseUnit) {
      const { quantity, unit } = fromBaseUnit(g.totalQty, g.baseUnit)
      return { name: g.displayName, quantity, unit, fallbackCategory: g.fallbackCategory }
    }
    return {
      name: g.displayName,
      quantity: round(g.totalQty, 2),
      unit: g.originalUnit,
      fallbackCategory: g.fallbackCategory,
    }
  })
}
