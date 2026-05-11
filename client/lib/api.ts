const API_URL = "http://localhost:8000"

let cachedToken: string | null = null

async function getToken(): Promise<string> {
  if (cachedToken) return cachedToken
  const res = await fetch("/api/auth/token")
  const data = await res.json()
  cachedToken = data.token
  return cachedToken!
}

async function apiFetch(path: string, options?: RequestInit) {
  const token = await getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
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

export function getFriendLogs(friendId: number) {
  return apiFetch(`/friends/${friendId}/logs`)
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

export function getPlans() {
  return apiFetch("/plans/")
}

export function createPlan(plan: { name: string; exercises: { name: string; sets: number; reps: number }[] }) {
  return apiFetch("/plans/", { method: "POST", body: JSON.stringify(plan) })
}

export function updatePlan(id: number, plan: { name: string; exercises: { name: string; sets: number; reps: number }[] }) {
  return apiFetch(`/plans/${id}`, { method: "PUT", body: JSON.stringify(plan) })
}

export function deletePlan(id: number) {
  return apiFetch(`/plans/${id}`, { method: "DELETE" })
}


export function getLogs() {
  return apiFetch("/logs/")
}

export function updateLog(id: number, log: { plan_name: string; date: string; exercises: { name: string; sets: number; reps: number; weight: number; difficulty: string; done: boolean }[] }) {
  return apiFetch(`/logs/${id}`, { method: "PUT", body: JSON.stringify(log) })
}

export function deleteLog(id: number) {
  return apiFetch(`/logs/${id}`, { method: "DELETE" })
}

export function createLog(log: {
  plan_name: string
  date: string
  exercises: { name: string; sets: number; reps: number; weight: number; difficulty: string; done: boolean }[]
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

export function toggleLike(logId: number) {
  return apiFetch(`/logs/${logId}/like`, { method: "POST" })
}

export function addComment(logId: number, body: string) {
  return apiFetch(`/logs/${logId}/comments`, { method: "POST", body: JSON.stringify({ body }) })
}

export function deleteComment(logId: number, commentId: number) {
  return apiFetch(`/logs/${logId}/comments/${commentId}`, { method: "DELETE" })
}

export function getSharedGoals() {
  return apiFetch("/shared-goals/")
}

export function createSharedGoal(data: { friend_id: number; exercise_name: string; target_weight: number }) {
  return apiFetch("/shared-goals/", { method: "POST", body: JSON.stringify(data) })
}

export function deleteSharedGoal(id: number) {
  return apiFetch(`/shared-goals/${id}`, { method: "DELETE" })
}

export function acceptPlanInvitation(id: number) {
  return apiFetch(`/plans/invitations/${id}/accept`, { method: "PUT" })
}

export function declinePlanInvitation(id: number) {
  return apiFetch(`/plans/invitations/${id}`, { method: "DELETE" })
}

export function getMe() {
  return apiFetch("/users/me")
}

export function updateMe(data: { name?: string | null; weekly_goal?: number }) {
  return apiFetch("/users/me", { method: "PATCH", body: JSON.stringify(data) })
}
