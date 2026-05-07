"use client"

import { useState, useEffect } from "react"
import { getSharedGoals, createSharedGoal, deleteSharedGoal, getFriends } from "@/lib/api"

type UserPublic = {
  id: number
  name: string | null
  email: string
}

type SharedGoal = {
  id: number
  exercise_name: string
  target_weight: number
  owner: UserPublic
  friend: UserPublic
  owner_best: number
  friend_best: number
}

type Friend = {
  id: number
  status: string
  friend: UserPublic
}

function ProgressRing({ percent, label, color }: { percent: number; label: string; color: string }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(percent, 100) / 100)

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#1f2937" strokeWidth="10" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-semibold text-xs">{Math.round(Math.min(percent, 100))}%</span>
        </div>
      </div>
      <p className="text-gray-400 text-xs text-center">{label}</p>
    </div>
  )
}

function displayName(u: UserPublic) {
  return u.name ?? u.email.split("@")[0]
}

export default function SharedGoals() {
  const [goals, setGoals] = useState<SharedGoal[]>([])
  const [friends, setFriends] = useState<UserPublic[]>([])
  const [adding, setAdding] = useState(false)
  const [exercise, setExercise] = useState("")
  const [target, setTarget] = useState("")
  const [friendId, setFriendId] = useState<number | "">("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSharedGoals().then(setGoals).catch(() => {})
    getFriends().then((data: Friend[]) => setFriends(data.map((f) => f.friend))).catch(() => {})
  }, [])

  async function handleAdd() {
    if (!exercise.trim() || !target || friendId === "") return
    setError(null)
    try {
      const created = await createSharedGoal({
        friend_id: Number(friendId),
        exercise_name: exercise.trim(),
        target_weight: Number(target),
      })
      setGoals([...goals, created])
      setExercise("")
      setTarget("")
      setFriendId("")
      setAdding(false)
    } catch {
      setError("Kunde inte skapa det delade målet")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteSharedGoal(id)
      setGoals(goals.filter((g) => g.id !== id))
    } catch {
      setError("Kunde inte ta bort målet")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">Delade mål</h2>
        <button
          onClick={() => setAdding(!adding)}
          className="w-7 h-7 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex items-center justify-center text-lg leading-none"
        >
          +
        </button>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {adding && (
        <div className="flex flex-col gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
          <input
            placeholder="Övning (t.ex. Squat)"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          />
          <input
            type="number"
            placeholder="Målvikt (kg)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          />
          <select
            value={friendId}
            onChange={(e) => setFriendId(e.target.value ? Number(e.target.value) : "")}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">Välj en vän…</option>
            {friends.map((f) => (
              <option key={f.id} value={f.id}>{f.name ?? f.email}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Lägg till
            </button>
            <button
              onClick={() => setAdding(false)}
              className="text-gray-400 hover:text-white text-sm transition-colors px-2"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {goals.length === 0 && !adding && (
        <p className="text-gray-500 text-sm">Inga delade mål ännu. Tryck + för att skapa ett med en vän.</p>
      )}

      <div className="flex flex-col gap-4">
        {goals.map((goal) => {
          const ownerPct = goal.target_weight > 0 ? (goal.owner_best / goal.target_weight) * 100 : 0
          const friendPct = goal.target_weight > 0 ? (goal.friend_best / goal.target_weight) * 100 : 0
          return (
            <div key={goal.id} className="relative group bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
              <button
                onClick={() => handleDelete(goal.id)}
                className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gray-800 text-gray-500 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                ×
              </button>
              <div>
                <p className="text-white font-semibold">{goal.exercise_name}</p>
                <p className="text-gray-500 text-xs">Mål: {goal.target_weight} kg</p>
              </div>
              <div className="flex gap-8">
                <ProgressRing percent={ownerPct} label={displayName(goal.owner)} color="#6366f1" />
                <ProgressRing percent={friendPct} label={displayName(goal.friend)} color="#a78bfa" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
