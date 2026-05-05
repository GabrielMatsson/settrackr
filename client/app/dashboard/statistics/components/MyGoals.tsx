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

function ProgressRing({ percent, label, target }: { percent: number; label: string; target: number }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(percent, 100) / 100)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#1f2937" strokeWidth="10" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#6366f1"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-semibold text-sm">{Math.round(Math.min(percent, 100))}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-gray-500 text-xs">Mål: {target} kg</p>
      </div>
    </div>
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
    getGoals()
      .then(setGoals)
      .catch(() => setError("Kunde inte hämta mål"))
  }, [])

  async function handleAdd() {
    if (!newName.trim() || !newTarget) return
    for (let i = 0; i < goals.length; i++) {
      if (goals[i].name.toLowerCase() === newName.trim().toLowerCase()) {
        setError("Du har redan ett mål för den övningen")
        return
      }
    }
    setError(null)
    try {
      const created = await createGoal({ name: newName.trim(), target_weight: Number(newTarget) })
      setGoals([...goals, created])
      setNewName("")
      setNewTarget("")
      setAdding(false)
    } catch {
      setError("Kunde inte spara målet")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteGoal(id)
      const updated = []
      for (let i = 0; i < goals.length; i++) {
        if (goals[i].id !== id) updated.push(goals[i])
      }
      setGoals(updated)
    } catch {
      setError("Kunde inte ta bort målet")
    }
  }

  const rings = []
  for (let i = 0; i < goals.length; i++) {
    const goal = goals[i]
    const best = getBestLift(logs, goal.name)
    const percent = goal.target_weight > 0 ? (best / goal.target_weight) * 100 : 0
    rings.push(
      <div key={goal.id} className="relative group">
        <ProgressRing percent={percent} label={goal.name} target={goal.target_weight} />
        <button
          onClick={() => handleDelete(goal.id)}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-800 text-gray-500 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">Mina mål</h2>
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
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          />
          <input
            type="number"
            placeholder="Målvikt (kg)"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          />
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
        <p className="text-gray-500 text-sm">Inga mål satta ännu. Tryck + för att lägga till ett.</p>
      )}

      <div className="flex flex-wrap gap-8">
        {rings}
      </div>
    </div>
  )
}
