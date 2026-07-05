"use client"

import { useState, useEffect } from "react"
import { getGoals, createGoal, deleteGoal } from "@/lib/api"

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

type Props = {
  logs: WorkoutLog[]
}

function ProgressRing({ percent, gradientId, colorStart = "#6366f1", colorEnd = "#a78bfa" }: { percent: number; gradientId: string; colorStart?: string; colorEnd?: string }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(percent, 100) / 100)

  return (
    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colorStart} />
          <stop offset="100%" stopColor={colorEnd} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-100 dark:text-gray-800" />
      <circle
        cx="50" cy="50" r={radius} fill="none"
        stroke={`url(#${gradientId})`} strokeWidth="10" strokeLinecap="round"
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

export default function MyGoals({ logs }: Props) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newTarget, setNewTarget] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getGoals().then(setGoals).catch(() => setError("Kunde inte hämta mål"))
  }, [])

  async function handleAdd() {
    if (!newName.trim() || !newTarget) return
    setError(null)
    for (let i = 0; i < goals.length; i++) {
      if (goals[i].name.toLowerCase() === newName.trim().toLowerCase()) {
        setError("Du har redan ett mål för den övningen")
        return
      }
    }
    try {
      const created = await createGoal({ name: newName.trim(), target_weight: Number(newTarget) })
      setGoals(goals.concat([created]))
      resetForm()
    } catch {
      setError("Kunde inte spara målet")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteGoal(id)
      setGoals(goals.filter((g) => g.id !== id))
    } catch {
      setError("Kunde inte ta bort målet")
    }
  }

  function resetForm() {
    setNewName("")
    setNewTarget("")
    setAdding(false)
  }

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-5 bg-white dark:bg-gray-950 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900 dark:text-white font-semibold text-lg">Mina mål</h2>
        <button
          onClick={() => setAdding(!adding)}
          className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-center text-lg leading-none"
        >
          +
        </button>
      </div>

      {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}

      {adding && (
        <div className="flex flex-col gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
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

      {goals.length === 0 && !adding && (
        <p className="text-gray-400 dark:text-gray-500 text-sm">Inga mål satta ännu. Tryck + för att lägga till ett.</p>
      )}

      <div className="flex flex-wrap gap-4">
        {goals.map((goal) => {
          const best = getBestLift(logs, goal.name)
          const percent = goal.target_weight > 0 ? (best / goal.target_weight) * 100 : 0
          return (
            <div key={goal.id} className="relative group flex flex-col items-center gap-2">
              <div className="relative w-24 h-24">
                <ProgressRing percent={percent} gradientId={`ring-p-${goal.id}`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-900 dark:text-white font-semibold text-sm">{Math.round(Math.min(percent, 100))}%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-gray-900 dark:text-white text-sm font-medium">{goal.name}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Mål: {goal.target_weight} kg</p>
              </div>
              <button
                onClick={() => handleDelete(goal.id)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
