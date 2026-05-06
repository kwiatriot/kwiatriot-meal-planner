// AI-powered ingredient categorization using Claude Haiku.
// This file is server-only — it reads ANTHROPIC_API_KEY from process.env.
// Never import it from a Client Component; Next.js will tree-shake it if
// it's only imported from Server Components / Server Actions.
//
// Python-dev note on environment variables:
//   process.env.X returns string | undefined — there's no KeyError equivalent.
//   Next.js loads .env.local automatically; no dotenv import needed.
//   The NEXT_PUBLIC_ prefix is the public/private boundary: anything without
//   it is undefined in client components (catch this at code-review time).

import Anthropic from '@anthropic-ai/sdk'

export const VALID_CATEGORIES = [
  'produce',
  'meat_seafood',
  'dairy_eggs',
  'pantry',
  'frozen',
  'bakery',
  'beverages',
  'other',
] as const

export type Category = (typeof VALID_CATEGORIES)[number]

// Maps the old recipe-level ingredient categories (set at recipe-creation time)
// to the new shopping-list categories. Used as fallback when the API call fails.
const RECIPE_CATEGORY_MAP: Record<string, Category> = {
  produce: 'produce',
  proteins: 'meat_seafood',
  dairy: 'dairy_eggs',
  grains: 'pantry',
  pantry: 'pantry',
  frozen: 'frozen',
  other: 'other',
}

/**
 * Classify a list of ingredients into shopping categories using a single
 * Claude Haiku API call. Falls back gracefully to the per-ingredient
 * `fallbackCategory` (mapped from recipe categories) if the API call fails
 * or returns unrecognised values — the user always gets a usable list.
 *
 * Python-dev note on discriminated error handling:
 *   There's no try/except with typed exceptions here — we just catch everything
 *   and fall through to the pre-seeded fallback map. The equivalent Python
 *   pattern would be `except Exception: pass` after setting defaults.
 */
export async function categorizeIngredients(
  ingredients: Array<{ name: string; fallbackCategory: string }>,
): Promise<Map<string, Category>> {
  const result = new Map<string, Category>()

  // Seed every ingredient with its fallback before the API call,
  // so partial failures still produce a complete map.
  for (const ing of ingredients) {
    result.set(ing.name, RECIPE_CATEGORY_MAP[ing.fallbackCategory] ?? 'other')
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not set — shopping list will use fallback categories')
    return result
  }

  const client = new Anthropic()
  const names = ingredients.map((i) => i.name)
  const validList = VALID_CATEGORIES.join(', ')

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Classify each grocery ingredient into exactly one of these categories: ${validList}

Respond with ONLY a valid JSON object mapping each ingredient name to its category. No explanation, no markdown, no code fences.
Example: {"chicken breast": "meat_seafood", "whole milk": "dairy_eggs", "brown rice": "pantry"}

Ingredients to classify:
${names.join('\n')}`,
        },
      ],
    })

    const raw =
      message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    // Haiku sometimes wraps JSON in ```json ... ``` fences despite being told not to
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
    const parsed = JSON.parse(text) as Record<string, string>

    for (const [name, cat] of Object.entries(parsed)) {
      if ((VALID_CATEGORIES as readonly string[]).includes(cat)) {
        result.set(name, cat as Category)
      }
      // Unrecognised category values are silently dropped — fallback stays
    }
  } catch (err) {
    console.error('categorizeIngredients: API error, falling back to recipe categories', err)
  }

  return result
}
