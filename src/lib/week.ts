import type { DayOfWeek } from '@/types/index'

// ───────────────────────────────────────────────────────────
// Date helpers for week-based planning
//
// Python-dev note: there is NO equivalent of `datetime.date` or `dateutil`
// in the JavaScript standard library. The built-in `Date` type is actually
// a "moment in time" (a UTC timestamp) — there's no calendar-date type.
// That's why most date logic in JS uses ISO strings (YYYY-MM-DD) as the
// canonical "calendar date" representation, and only converts to `Date`
// for arithmetic. We do the same here.
//
// Critical gotcha: `new Date("2026-05-11")` is parsed as UTC midnight,
// which becomes May 10th in any negative-UTC timezone (like MDT). That's
// why we have `fromIsoDate` — it builds a Date in *local* time.
// ───────────────────────────────────────────────────────────

export const DAYS_OF_WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday']

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
}

/** Format a Date as YYYY-MM-DD using local time (matches what Postgres `date` expects). */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse a YYYY-MM-DD string as a local-midnight Date (avoids the UTC trap). */
export function fromIsoDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** ISO date of the Monday of the week containing `date`. */
export function mondayOf(date: Date): string {
  const d = new Date(date)
  // JS getDay(): Sunday=0, Monday=1, …, Saturday=6.
  // Shift so Monday=0, …, Sunday=6, then subtract that offset.
  const offset = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - offset)
  return toIsoDate(d)
}

/** ISO date of next week's Monday, regardless of which day "today" is. */
export function nextPlanningWeek(today: Date = new Date()): string {
  return addWeeks(mondayOf(today), 1)
}

/** Add N weeks (can be negative) to an ISO date string, return a new ISO date. */
export function addWeeks(isoDate: string, n: number): string {
  const d = fromIsoDate(isoDate)
  d.setDate(d.getDate() + n * 7)
  return toIsoDate(d)
}

/** Pretty-print a Mon–Thu range, e.g. "May 11–14, 2026". */
export function formatWeekRange(monday: string): string {
  const start = fromIsoDate(monday)
  const end = new Date(start)
  end.setDate(end.getDate() + 3) // Mon–Thu = 4 days
  const startMonth = start.toLocaleString('en-US', { month: 'short' })
  const endMonth = end.toLocaleString('en-US', { month: 'short' })
  const year = start.getFullYear()
  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()}–${end.getDate()}, ${year}`
  }
  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${year}`
}

/**
 * Type-guard validating a string is a YYYY-MM-DD that lands on a Monday.
 * Used to defend `?week=...` URL params against garbage input.
 *
 * Python-dev note: `s is string` after the colon is a TypeScript "type
 * predicate" — if this returns true, TS narrows `s` to `string` at the
 * call site (no longer `string | null | undefined`). It's a richer
 * version of Python's `assert isinstance(s, str)`.
 */
export function isValidMonday(s: string | null | undefined): s is string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = fromIsoDate(s)
  if (Number.isNaN(d.getTime())) return false
  return d.getDay() === 1
}