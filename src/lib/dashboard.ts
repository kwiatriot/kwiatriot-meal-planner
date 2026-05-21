import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Total expected meal slots per planning week (Mon–Thu × 3 meal types: lunch/dinner/snack).
export const WEEKLY_MEAL_SLOTS = 12

/**
 * Days remaining until the upcoming Friday 11:59 PM MT.
 *
 * Python-dev note: JS's Date.getDay() is 0=Sun, 1=Mon, …, 6=Sat.
 * Python's datetime.weekday() is 0=Mon, …, 6=Sun — the two are NOT equivalent.
 * Don't let Python muscle memory flip these.
 *
 * Returns: Mon=4, Tue=3, Wed=2, Thu=1, Fri=0, Sat=-1, Sun=-2.
 * Caller treats any value ≤ 0 as "plan locked" (presentational only in Phase 1).
 */
export function daysUntilFridayLock(now: Date = new Date()): number {
  const day = now.getDay() // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  if (day === 0) return -2 // Sunday — past Friday
  if (day === 6) return -1 // Saturday — past Friday
  return 5 - day           // Mon→4, Tue→3, Wed→2, Thu→1, Fri→0
}

/**
 * Count shopping_items rows for a plan without fetching the row data.
 * Lives here so the dashboard doesn't reach into shopping-list internals.
 *
 * Python-dev note: { count: 'exact', head: true } is the Supabase equivalent
 * of SELECT COUNT(*) ... — it issues a HEAD request that only returns the
 * count, not the rows themselves.
 */
export async function getShoppingItemCount(
  supabase: SupabaseClient<Database>,
  planId: string,
): Promise<number> {
  const { count } = await supabase
    .from('shopping_items')
    .select('id', { count: 'exact', head: true })
    .eq('meal_plan_id', planId)
  return count ?? 0
}
