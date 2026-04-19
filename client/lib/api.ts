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

export function createLog(log: {
  plan_name: string
  date: string
  exercises: { name: string; sets: number; reps: number; weight: number; difficulty: string; done: boolean }[]
}) {
  return apiFetch("/logs/", { method: "POST", body: JSON.stringify(log) })
}
