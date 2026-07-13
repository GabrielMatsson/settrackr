const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

// The backend JWT lives 1h — refresh well before expiry so long-idle tabs
// don't start failing with 401s. Parallel callers share one in-flight fetch.
const TOKEN_TTL = 50 * 60_000
let cachedToken: { token: string; fetchedAt: number } | null = null
let pendingToken: Promise<string> | null = null

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() - cachedToken.fetchedAt < TOKEN_TTL) return cachedToken.token
  if (pendingToken) return pendingToken
  pendingToken = (async () => {
    try {
      const res = await fetch("/api/auth/token")
      if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`)
      const data = await res.json()
      // Never cache a missing token — a cached undefined would break every
      // API call for the next 50 minutes ("Bearer undefined")
      if (typeof data.token !== "string" || !data.token) {
        throw new Error("Token fetch returned no token")
      }
      cachedToken = { token: data.token, fetchedAt: Date.now() }
      return data.token as string
    } finally {
      pendingToken = null
    }
  })()
  return pendingToken
}

// Cold-start tracking: Render's free tier spins down after 15 idle minutes
// and takes 30-60s to boot. Slow or retrying requests flip a shared "cold"
// flag so the UI can show a "Servern vaknar…" indicator (ColdStartBanner).
const coldListeners = new Set<(cold: boolean) => void>()
let coldCount = 0

export function onColdChange(cb: (cold: boolean) => void): () => void {
  coldListeners.add(cb)
  cb(coldCount > 0)
  return () => coldListeners.delete(cb)
}

function changeCold(delta: number) {
  const was = coldCount > 0
  coldCount += delta
  const is = coldCount > 0
  if (was !== is) coldListeners.forEach((cb) => cb(is))
}

// Fire-and-forget unauthenticated ping that starts waking the container as
// early as possible, overlapping the boot with login/rendering
export function warmUp() {
  fetch(`${API_URL}/`).catch(() => {})
}

const getCache = new Map<string, { data: unknown; ts: number }>()
const pendingGets = new Map<string, Promise<unknown>>()
const CACHE_TTL = 10_000
const SLOW_MS = 2_500
const RETRY_DELAYS = [2_000, 5_000]
const RETRYABLE_STATUS = new Set([502, 503, 504])

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function apiFetch(path: string, options?: RequestInit) {
  const method = (options?.method ?? "GET").toUpperCase()
  const isGet = method === "GET"

  if (isGet) {
    const cached = getCache.get(path)
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data

    const inFlight = pendingGets.get(path)
    if (inFlight) return inFlight
  }

  const promise = (async () => {
    let coldMarked = false
    const markCold = () => {
      if (!coldMarked) {
        coldMarked = true
        changeCold(1)
      }
    }
    const slowTimer = setTimeout(markCold, SLOW_MS)

    try {
      let authRetried = false
      let attempt = 0

      while (true) {
        let res: Response
        try {
          const token = await getToken()
          res = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              ...options?.headers,
            },
          })
        } catch (err) {
          // Network failure — during a cold boot the proxy can drop requests.
          // Only GETs are retried; mutations must never run twice.
          if (isGet && attempt < RETRY_DELAYS.length) {
            markCold()
            await sleep(RETRY_DELAYS[attempt])
            attempt++
            continue
          }
          throw err
        }

        if (res.status === 401 && !authRetried) {
          // Token expired (backend never executed the request) — refresh once
          authRetried = true
          cachedToken = null
          continue
        }
        if (isGet && RETRYABLE_STATUS.has(res.status) && attempt < RETRY_DELAYS.length) {
          markCold()
          await sleep(RETRY_DELAYS[attempt])
          attempt++
          continue
        }
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const data = await res.json()

        if (isGet) {
          getCache.set(path, { data, ts: Date.now() })
          pendingGets.delete(path)
        } else {
          const prefix = "/" + path.split("/").filter(Boolean)[0]
          for (const key of getCache.keys()) {
            if (key.startsWith(prefix)) getCache.delete(key)
          }
        }
        return data
      }
    } finally {
      clearTimeout(slowTimer)
      if (coldMarked) changeCold(-1)
    }
  })()

  if (isGet) {
    pendingGets.set(path, promise)
    promise.catch(() => pendingGets.delete(path))
  }

  return promise
}


export function sendFriendRequest(email: string) {
  return apiFetch("/friends/request", { method: "POST", body: JSON.stringify({ email }) })
}

export function getFriends() {
  return apiFetch("/friends/")
}

export function acceptFriendRequest(id: number) {
  return apiFetch(`/friends/${id}/accept`, { method: "PUT" })
}

export function deleteFriendship(id: number) {
  return apiFetch(`/friends/${id}`, { method: "DELETE" })
}


export async function getApiToken(): Promise<string> {
  return getToken()
}

export async function getCurrentUserEmail(): Promise<string> {
  const token = await getApiToken()
  const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  const payload = JSON.parse(atob(b64))
  return payload.sub as string
}

export function getGoals() {
  return apiFetch("/goals/")
}

export function createGoal(goal: { name: string; target_weight: number }) {
  return apiFetch("/goals/", { method: "POST", body: JSON.stringify(goal) })
}

export function deleteGoal(id: number) {
  return apiFetch(`/goals/${id}`, { method: "DELETE" })
}

// --- Coach (training insights) ---------------------------------------------

export type VolumeSignal = "none" | "low" | "maintenance" | "optimal" | "high"

export type CoachPlateau = {
  exercise: string
  days_since_pr: number
  best_e1rm: number
  last_weight: number
  last_reps: number
  last_difficulty: string
  suggestion: string
}

export type CoachMuscleVolume = {
  muscle: string
  label: string
  avg_sets_per_week: number
  signal: VolumeSignal
}

export type CoachPR = {
  exercise: string
  date: string
  weight: number
  reps: number
  e1rm: number
  type: "weight" | "e1rm"
  is_bodyweight?: boolean
  days_ago: number
}

export type CoachTrend = {
  exercise: string
  points: { date: string; e1rm: number }[]
  current: number
  best: number
  sessions: number
}

export type CoachInsights = {
  plateaus: CoachPlateau[]
  muscle_volume: CoachMuscleVolume[]
  prs: CoachPR[]
  one_rm_trends: CoachTrend[]
  weekly_summary: string
  meta: { total_sessions: number; weeks_analysed: number; generated_at: string; has_data: boolean }
}

export function getCoachInsights(weeks = 8): Promise<CoachInsights> {
  return apiFetch(`/insights/coach?weeks=${weeks}`) as Promise<CoachInsights>
}

// --- Nutrition coach (protein + calories only) -----------------------------

export type ProteinSignal = "none" | "poor" | "low" | "good"
export type KcalSignal = "none" | "good" | "slightly_over" | "over" | "well_under" | "slightly_under" | "under"
export type GoalMode = "deff" | "maintain" | "bulk"
export type GoalDirection = "surplus" | "deficit" | "maintain" | "none"

export type TargetSuggestion = {
  direction: GoalDirection
  mode: GoalMode | null
  current_weight: number | null
  target_weight: number | null
  weekly_change_kg: number | null
  avg_kcal: number
  current_target: number
  basis: "trend" | "direction_only" | "none"
  suggested_kcal: number | null
  est_maintenance: number | null
  reasoning: string
}

export type NutritionInsights = {
  protein: {
    avg: number
    target: number
    avg_gap: number
    pct_days_on_target: number
    streak: number
    signal: ProteinSignal
    suggestion: string
  }
  calories: {
    avg: number
    target: number
    avg_gap: number
    days_over: number
    logged_days: number
    pct_days_at_or_under: number
    signal: KcalSignal
    suggestion: string
    direction: GoalDirection
    mode: GoalMode | null
  }
  weekly_trend: { week: string; avg_kcal: number; avg_protein: number; logged_days: number }[]
  weekly_summary: string
  target_suggestion: TargetSuggestion
  meta: { logged_days: number; weeks_analysed: number; generated_at: string; has_data: boolean }
}

export function getNutritionInsights(weeks = 8): Promise<NutritionInsights> {
  return apiFetch(`/insights/nutrition?weeks=${weeks}`) as Promise<NutritionInsights>
}

export function getPlans() {
  return apiFetch("/plans/")
}

export function createPlan(plan: { name: string; icon?: string; exercises: { name: string; sets: number; reps: number }[] }) {
  return apiFetch("/plans/", { method: "POST", body: JSON.stringify(plan) })
}

export function updatePlan(id: number, plan: { name: string; icon?: string; exercises: { name: string; sets: number; reps: number }[] }) {
  return apiFetch(`/plans/${id}`, { method: "PUT", body: JSON.stringify(plan) })
}

export function deletePlan(id: number) {
  return apiFetch(`/plans/${id}`, { method: "DELETE" })
}

export function reorderPlans(ids: number[]) {
  return apiFetch("/plans/reorder", { method: "PUT", body: JSON.stringify({ ids }) })
}


export function getLogs() {
  return apiFetch("/logs/")
}

export function updateLog(id: number, log: { plan_name: string; date: string; exercises: { name: string; sets: number; reps: number; weight: number; difficulty: string; done: boolean; is_bodyweight?: boolean }[] }) {
  return apiFetch(`/logs/${id}`, { method: "PUT", body: JSON.stringify(log) })
}

export function deleteLog(id: number) {
  return apiFetch(`/logs/${id}`, { method: "DELETE" })
}

export function createLog(log: {
  plan_name: string
  icon?: string
  date: string
  exercises: { name: string; sets: number; reps: number; weight: number; difficulty: string; done: boolean; is_bodyweight?: boolean }[]
}) {
  return apiFetch("/logs/", { method: "POST", body: JSON.stringify(log) })
}

export function getFriendPlans(friendId: number) {
  return apiFetch(`/friends/${friendId}/plans`)
}

export function copyFriendPlan(friendId: number, planId: number) {
  return apiFetch(`/friends/${friendId}/plans/${planId}/copy`, { method: "POST" })
}

export function getSharedPlans() {
  return apiFetch("/plans/shared")
}

export function leaveSharedPlan(planId: number) {
  return apiFetch(`/plans/shared/${planId}`, { method: "DELETE" })
}

export function sharePlan(planId: number, friendId: number) {
  return apiFetch(`/plans/${planId}/share`, { method: "POST", body: JSON.stringify({ friend_id: friendId }) })
}

export function unsharePlan(planId: number, friendId: number) {
  return apiFetch(`/plans/${planId}/share/${friendId}`, { method: "DELETE" })
}

export function acceptPlanInvitation(id: number) {
  return apiFetch(`/plans/invitations/${id}/accept`, { method: "PUT" })
}

export function declinePlanInvitation(id: number) {
  return apiFetch(`/plans/invitations/${id}`, { method: "DELETE" })
}

export function getFriendRequests() {
  return apiFetch("/friends/requests")
}

export function getPlanInvitations() {
  return apiFetch("/plans/invitations")
}

export function getMe() {
  return apiFetch("/users/me")
}

export function getExerciseHistory(names: string[]) {
  const param = names.slice().sort().join(",")
  return apiFetch(`/logs/exercise-history?names=${encodeURIComponent(param)}`)
}

export function updateMe(data: { name?: string | null; weekly_goal?: number; show_overload_hints?: boolean; show_chicken_legs?: boolean; show_gym_ghost?: boolean; show_gym_mascot?: boolean; show_food_mascot?: boolean; show_training_coach?: boolean; show_nutrition_coach?: boolean; show_food_tracking?: boolean; show_weight_tracking?: boolean; kcal_target?: number; protein_target?: number; target_weight?: number; goal_mode?: GoalMode }) {
  return apiFetch("/users/me", { method: "PATCH", body: JSON.stringify(data) })
}

// --- Body weight -------------------------------------------------------------

export type WeightEntry = { id: number; date: string; weight_kg: number }

export function getWeightLogs(): Promise<WeightEntry[]> {
  return apiFetch("/weight/") as Promise<WeightEntry[]>
}

export function logWeight(entry: { date: string; weight_kg: number }): Promise<WeightEntry> {
  return apiFetch("/weight/", { method: "POST", body: JSON.stringify(entry) }) as Promise<WeightEntry>
}

export function deleteWeightLog(id: number) {
  return apiFetch(`/weight/${id}`, { method: "DELETE" })
}

export function getMyLevel() {
  return apiFetch("/users/me/level")
}

export function getExerciseMuscles() {
  return apiFetch("/exercise-muscles/")
}

export function setExerciseMuscles(name: string, muscles: string[]) {
  return apiFetch("/exercise-muscles/", { method: "PUT", body: JSON.stringify({ name, muscles }) })
}

export function deleteExerciseMuscle(id: number) {
  return apiFetch(`/exercise-muscles/${id}`, { method: "DELETE" })
}

export function getFriendLevel(userId: number) {
  return apiFetch(`/users/${userId}/level`)
}

export function clearCache(path: string) {
  getCache.delete(path)
}

export function getAdminUsers() {
  return apiFetch("/admin/users")
}

export function deleteAdminUser(id: number) {
  return apiFetch(`/admin/users/${id}`, { method: "DELETE" })
}

type MealItemPayload = {
  name: string
  brand?: string | null
  barcode?: string | null
  grams: number
  kcal_100g: number
  protein_100g: number
  carbs_100g: number
  fat_100g: number
}

export function getMeals(date: string) {
  return apiFetch(`/food/?date=${date}`)
}

export function getFoodHistory() {
  return apiFetch("/food/items")
}

export function getMealsRange(start: string, end: string) {
  return apiFetch(`/food/range?start=${start}&end=${end}`)
}

export function createMeal(meal: { date: string; title: string; items: MealItemPayload[] }) {
  return apiFetch("/food/", { method: "POST", body: JSON.stringify(meal) })
}

export function updateMeal(id: number, meal: { date: string; title: string; items: MealItemPayload[] }) {
  return apiFetch(`/food/${id}`, { method: "PUT", body: JSON.stringify(meal) })
}

export function deleteMeal(id: number) {
  return apiFetch(`/food/${id}`, { method: "DELETE" })
}

export type FavoriteMeal = {
  id: number
  title: string
  items: MealItemPayload[]
}

export function getFavoriteMeals(): Promise<FavoriteMeal[]> {
  return apiFetch("/food/favorites") as Promise<FavoriteMeal[]>
}

export function createFavoriteMeal(fav: { title: string; items: MealItemPayload[] }): Promise<FavoriteMeal> {
  return apiFetch("/food/favorites", { method: "POST", body: JSON.stringify(fav) }) as Promise<FavoriteMeal>
}

export function deleteFavoriteMeal(id: number) {
  return apiFetch(`/food/favorites/${id}`, { method: "DELETE" })
}
