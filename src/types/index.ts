// ─────────────────────────────────────────────
// Core domain types for the Meal Planner app
// ─────────────────────────────────────────────

export type MealType = 'lunch' | 'dinner' | 'snack'
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday'
export type PlanStatus = 'draft' | 'locked'

export interface User {
  id: string
  email: string
  name: string
  created_at: string
}

export interface NutritionInfo {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
}

export interface Recipe {
  id: string
  name: string
  type: MealType
  description: string
  ingredients: Ingredient[]
  instructions: string
  nutrition: NutritionInfo
  prep_time_min: number
  cook_time_min: number
  servings: number
  drive_doc_id: string | null
  tags: string[]
  is_favorite: boolean
  created_at: string
}

export interface Ingredient {
  name: string
  quantity: number
  unit: string
  category: GroceryCategory
}

export type GroceryCategory =
  | 'produce'
  | 'proteins'
  | 'dairy'
  | 'grains'
  | 'pantry'
  | 'frozen'
  | 'other'

export interface MealPlan {
  id: string
  week_start_date: string   // ISO date string — always a Monday
  status: PlanStatus
  created_at: string
}

export interface MealSelection {
  id: string
  meal_plan_id: string
  recipe_id: string
  recipe?: Recipe           // joined
  meal_type: MealType
  day_of_week: DayOfWeek
}

export interface ShoppingItem {
  id: string
  meal_plan_id: string
  ingredient: string
  quantity: number
  unit: string
  category: GroceryCategory
  checked: boolean
}

// ─────────────────────────────────────────────
// UI-specific types
// ─────────────────────────────────────────────

export interface WeekSummary {
  meal_plan: MealPlan
  selections: MealSelection[]
  shopping_items: ShoppingItem[]
  is_current_week: boolean
  days_until_lock: number   // 0 = locked today, negative = already locked
}
