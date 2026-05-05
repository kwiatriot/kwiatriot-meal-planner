// Auto-generated from supabase/migrations/001_initial_schema.sql
// Run `supabase gen types typescript --local > src/types/database.types.ts` to regenerate
// when the schema changes (requires Supabase CLI: https://supabase.com/docs/reference/cli)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      recipes: {
        Row: {
          id: string
          name: string
          type: string
          description: string | null
          ingredients: Json
          instructions: string | null
          nutrition: Json | null
          prep_time_min: number | null
          cook_time_min: number | null
          servings: number | null
          drive_doc_id: string | null
          tags: string[] | null
          is_favorite: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          description?: string | null
          ingredients?: Json
          instructions?: string | null
          nutrition?: Json | null
          prep_time_min?: number | null
          cook_time_min?: number | null
          servings?: number | null
          drive_doc_id?: string | null
          tags?: string[] | null
          is_favorite?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: string
          description?: string | null
          ingredients?: Json
          instructions?: string | null
          nutrition?: Json | null
          prep_time_min?: number | null
          cook_time_min?: number | null
          servings?: number | null
          drive_doc_id?: string | null
          tags?: string[] | null
          is_favorite?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          id: string
          week_start_date: string
          status: string
          created_at: string | null
        }
        Insert: {
          id?: string
          week_start_date: string
          status?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          week_start_date?: string
          status?: string
          created_at?: string | null
        }
        Relationships: []
      }
      meal_selections: {
        Row: {
          id: string
          meal_plan_id: string
          recipe_id: string
          meal_type: string
          day_of_week: string
          created_at: string | null
        }
        Insert: {
          id?: string
          meal_plan_id: string
          recipe_id: string
          meal_type: string
          day_of_week: string
          created_at?: string | null
        }
        Update: {
          id?: string
          meal_plan_id?: string
          recipe_id?: string
          meal_type?: string
          day_of_week?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_selections_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_selections_recipe_id_fkey"
            columns: ["recipe_id"]
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          }
        ]
      }
      shopping_items: {
        Row: {
          id: string
          meal_plan_id: string
          ingredient: string
          quantity: number | null
          unit: string | null
          category: string
          checked: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          meal_plan_id: string
          ingredient: string
          quantity?: number | null
          unit?: string | null
          category: string
          checked?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          meal_plan_id?: string
          ingredient?: string
          quantity?: number | null
          unit?: string | null
          category?: string
          checked?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience row-type aliases used across the app
export type RecipeRow = Database['public']['Tables']['recipes']['Row']
export type RecipeInsert = Database['public']['Tables']['recipes']['Insert']
export type MealPlanRow = Database['public']['Tables']['meal_plans']['Row']
export type MealSelectionRow = Database['public']['Tables']['meal_selections']['Row']
export type ShoppingItemRow = Database['public']['Tables']['shopping_items']['Row']
