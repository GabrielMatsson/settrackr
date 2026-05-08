"use client"

import { useState, useEffect } from "react"
import { getGoals, createGoal, deleteGoal, getSharedGoals, createSharedGoal, deleteSharedGoal, getFriends } from "@/lib/api"

type ExerciseLog = {
  name: string
  weight: number
}

type WorkoutLog = {
  exercises: ExerciseLog[]
}

type Goal = {
  id: number
  name: string
  target_weight: number
}

type UserPublic = { id: number; name: string | null; email: string }

type SharedGoal = {
  id: number
  exercise_name: string
  target_weight: number
  owner: UserPublic
  friend: UserPublic
  owner_best: number
  friend_best: number
}

type FriendEntry = { id: number; status: string; friend: UserPublic }

type Props = {
  logs: WorkoutLog[]
}

function ProgressRing({ percent, color = "#6366f1" }: { percent: number; color?: string }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(percent, 100) / 100)

  return (
    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--ring-track)" strokeWidth="10" />
      <circle
        cx="50" cy="50" r={radius} fill="none"
        stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        className="transition-all duration-500"
      />
    </svg>
  )
}

function getBestLift(logs: WorkoutLog[], exerciseName: string): number {
  let best = 0
  for (let i = 0; i < logs.length; i++) {
    for (let j = 0; j < logs[i].exercises.length; j++) {
      const ex = logs[i].exercises[j]
      if (ex.name.toLowerCase() === exerciseName.toLowerCase() && ex.weight > best) {
        best = ex.weight
      }
    }
  }
  return best
}

function shortName(u: UserPublic) {
  return u.name ? u.name.split(" ")[0] : u.email.split("@")[0]
}

export default function MyGoals({ logs }: Props) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [sharedGoals, setSharedGoals] = useState<SharedGoal[]>([])
  const [friends, setFriends] = useState<UserPublic[]>([])
  const [adding, setAdding] = useState(false)
  const [goalType, setGoalType] = useState<"personal" | "shared">("personal")
  const [newName, setNewName] = useState("")
  const [newTarget, setNewTarget] = useState("")
  const [newFriendId, setNewFriendId] = useState<number | "">("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getGoals().then(setGoals).catch(() => setError("Kunde inte hämta mål"))
    getSharedGoals().then(setSharedGoals).catch(() => {})
    getFriends().then((data: FriendEntry[]) => setFriends(data.map((f) => f.friend))).catch(() => {})
  }, [])

  async function handleAdd() {
    if (!newName.trim() || !newTarget) return
    setError(null)

    if (goalType === "personal") {
      for (let i = 0; i < goals.length; i++) {
        if (goals[i].name.toLowerCase() === newName.trim().toLowerCase()) {
          setError("Du har redan ett mål för den övningen")
          return
        }
      }
      try {
        const created = await createGoal({ name: newName.trim(), target_weight: Number(newTarget) })
        setGoals([...goals, created])
        resetForm()
      } catch {
        setError("Kunde inte spara målet")
      }
    } else {
      if (newFriendId === "") { setError("Välj en vän"); return }
      try {
        const created = await createSharedGoal({ friend_id: Number(newFriendId), exercise_name: newName.trim(), target_weight: Number(newTarget) })
        setSharedGoals([...sharedGoals, created])
        resetForm()
      } catch {
        setError("Kunde inte skapa det delade målet")
      }
    }
  }

  async function handleDeletePersonal(id: number) {
    try {
      await deleteGoal(id)
      setGoals(goals.filter((g) => g.id !== id))
    } catch {
      setError("Kunde inte ta bort målet")
    }
  }

  async function handleDeleteShared(id: number) {
    try {
      await deleteSharedGoal(id)
      setSharedGoals(sharedGoals.filter((g) => g.id !== id))
    } catch {
      setError("Kunde inte ta bort målet")
    }
  }

  function resetForm() {
    setNewName("")
    setNewTarget("")
    setNewFriendId("")
    setAdding(false)
    setGoalType("personal")
  }

  const rings = []

  for (let i = 0; i < goals.length; i++) {
    const goal = goals[i]
    const best = getBestLift(logs, goal.name)
    const percent = goal.target_weight > 0 ? (best / goal.target_weight) * 100 : 0
    rings.push(
      <div key={`p-${goal.id}`} className="relative group flex flex-col items-center gap-2">
        <div className="relative w-24 h-24">
          <ProgressRing percent={percent} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-900 dark:text-white font-semibold text-sm">{Math.round(Math.min(percent, 100))}%</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-gray-900 dark:text-white text-sm font-medium">{goal.name}</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs">Mål: {goal.target_weight} kg</p>
        </div>
        <button
          onClick={() => handleDeletePersonal(goal.id)}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          ×
        </button>
      </div>
    )
  }

  for (let i = 0; i < sharedGoals.length; i++) {
    const g = sharedGoals[i]
    const ownerPct = g.target_weight > 0 ? (g.owner_best / g.target_weight) * 100 : 0
    const friendPct = g.target_weight > 0 ? (g.friend_best / g.target_weight) * 100 : 0
    rings.push(
      <div key={`s-${g.id}`} className="relative group flex flex-col items-center gap-2">
        <div className="flex gap-1">
          <div className="relative w-24 h-24">
            <ProgressRing percent={ownerPct} color="#6366f1" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-gray-900 dark:text-white font-semibold text-sm">{Math.round(Math.min(ownerPct, 100))}%</span>
            </div>
          </div>
          <div className="relative w-24 h-24">
            <ProgressRing percent={friendPct} color="#a78bfa" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-gray-900 dark:text-white font-semibold text-sm">{Math.round(Math.min(friendPct, 100))}%</span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-gray-900 dark:text-white text-sm font-medium">{g.exercise_name}</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs">Mål: {g.target_weight} kg</p>
          <p className="text-indigo-400 text-xs">Delat · {shortName(g.owner)} & {shortName(g.friend)}</p>
        </div>
        <button
          onClick={() => handleDeleteShared(g.id)}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900 dark:text-white font-semibold text-lg">Mina mål</h2>
        <button
          onClick={() => setAdding(!adding)}
          className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-center text-lg leading-none"
        >
          +
        </button>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {adding && (
        <div className="flex flex-col gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setGoalType("personal")}
              className={`flex-1 text-sm py-1.5 rounded-lg transition-colors ${goalType === "personal" ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
            >
              Personligt
            </button>
            <button
              onClick={() => setGoalType("shared")}
              className={`flex-1 text-sm py-1.5 rounded-lg transition-colors ${goalType === "shared" ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
            >
              Delat med vän
            </button>
          </div>
          <input
            placeholder="Övning (t.ex. Squat)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          />
          <input
            type="number"
            placeholder="Målvikt (kg)"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          />
          {goalType === "shared" && (
            <select
              value={newFriendId}
              onChange={(e) => setNewFriendId(e.target.value ? Number(e.target.value) : "")}
              className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Välj en vän…</option>
              {friends.map((f) => (
                <option key={f.id} value={f.id}>{f.name ?? f.email}</option>
              ))}
            </select>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Lägg till
            </button>
            <button
              onClick={resetForm}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors px-2"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {rings.length === 0 && !adding && (
        <p className="text-gray-400 dark:text-gray-500 text-sm">Inga mål satta ännu. Tryck + för att lägga till ett.</p>
      )}

      <div className="flex flex-wrap gap-8">
        {rings}
      </div>
    </div>
  )
}
