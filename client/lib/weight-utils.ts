// Shared body-weight helpers: goal-mode direction, dated body-weight lookup
// for effective exercise load, and the direction-aware kcal ring color.
// Mirrors the server logic in server/routers/insights.py.
import type { GoalDirection, GoalMode } from "./api"

// Display labels — the API keeps the raw values ("deff" | "maintain" | "bulk").
export const GOAL_MODE_LABELS: Record<GoalMode, string> = {
  deff: "Deffa",
  maintain: "Bibehålla",
  bulk: "Bulka",
}

export function goalDirection(mode: GoalMode | string | null | undefined): GoalDirection {
  if (mode === "bulk") return "surplus"
  if (mode === "deff") return "deficit"
  if (mode === "maintain") return "maintain"
  return "none"
}

/** Resolver from ISO date -> body weight applicable that day: the latest entry
 *  on/before the date, falling back to the earliest entry (logs that predate
 *  all weight data), or null when no weight has ever been logged. */
export function makeBodyweightResolver(
  entries: { date: string; weight_kg: number }[]
): (date: string) => number | null {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  return (date: string) => {
    if (sorted.length === 0) return null
    let bw: number | null = null
    for (const e of sorted) {
      if (e.date <= date) bw = e.weight_kg
      else break
    }
    return bw ?? sorted[0].weight_kg
  }
}

/** Effective load for a set: body weight + extra kg for bodyweight exercises,
 *  otherwise just the kg field. No logged body weight => extra kg only. */
export function effectiveWeight(
  ex: { weight: number; is_bodyweight?: boolean },
  logDate: string,
  resolve: (d: string) => number | null
): number {
  if (!ex.is_bodyweight) return ex.weight
  return ex.weight + (resolve(logDate) ?? 0)
}

const GREEN = "#10b981"
const AMBER = "#f59e0b"
const ROSE = "#f43f5e"
const INDIGO = "#6366f1" // ProgressRing default — used when no mode is set

/** Color for the diary kcal ring given percent of target eaten so far.
 *  bulk: reaching the target is the goal; deff: staying under it is;
 *  maintain: landing near it is. No mode => the neutral indigo fill. */
export function kcalRingColor(pct: number, direction: GoalDirection): string {
  if (direction === "surplus") {
    if (pct < 90) return ROSE
    if (pct < 100) return AMBER
    if (pct <= 115) return GREEN
    return AMBER
  }
  if (direction === "maintain") {
    if (pct >= 95 && pct <= 105) return GREEN
    if (pct >= 90 && pct <= 110) return AMBER
    return ROSE
  }
  if (direction === "deficit") {
    if (pct <= 100) return GREEN
    if (pct <= 110) return AMBER
    return ROSE
  }
  return INDIGO
}
