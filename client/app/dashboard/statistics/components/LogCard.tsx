"use client"

import { useState } from "react"
import { updateLog, deleteLog } from "@/lib/api"
import LogReactions from "../../profile/components/LogReactions"

type ExerciseLog = {
  name: string
  sets: number
  reps: number
  weight: number
  difficulty: string
  done: boolean
}

type Comment = {
  id: number
  body: string
  created_at: string
  author: { id: number; name: string | null; email: string }
}

type WorkoutLog = {
  id: number
  date: string
  plan_name: string
  exercises: ExerciseLog[]
  reaction_count?: number
  comments?: Comment[]
}

type Props = {
  log: WorkoutLog
  onDelete: (id: number) => void
  onUpdate: (updated: WorkoutLog) => void
  currentUserEmail?: string
}

function DifficultyPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => onChange("easy")}
        className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${value === "easy" ? "bg-green-600 text-white" : "bg-gray-700 text-gray-400 hover:text-white"}`}
      >
        Lätt
      </button>
      <button
        type="button"
        onClick={() => onChange("medium")}
        className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${value === "medium" ? "bg-yellow-500 text-gray-900" : "bg-gray-700 text-gray-400 hover:text-white"}`}
      >
        Medium
      </button>
      <button
        type="button"
        onClick={() => onChange("hard")}
        className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${value === "hard" ? "bg-red-600 text-white" : "bg-gray-700 text-gray-400 hover:text-white"}`}
      >
        Tufft
      </button>
    </div>
  )
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  if (difficulty === "easy") {
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-600 text-white">Lätt</span>
  }
  if (difficulty === "medium") {
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500 text-gray-900">Medium</span>
  }
  return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-600 text-white">Tufft</span>
}

export default function LogCard({ log, onDelete, onUpdate, currentUserEmail = "" }: Props) {
  const [editing, setEditing] = useState(false)
  const [planName, setPlanName] = useState(log.plan_name)
  const [date, setDate] = useState(log.date)
  const [exercises, setExercises] = useState<ExerciseLog[]>(log.exercises)
  const [error, setError] = useState<string | null>(null)

  function updateExerciseName(index: number, value: string) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], name: value }
    setExercises(updated)
  }

  function updateExerciseSets(index: number, value: number) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], sets: value }
    setExercises(updated)
  }

  function updateExerciseReps(index: number, value: number) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], reps: value }
    setExercises(updated)
  }

  function updateExerciseWeight(index: number, value: number) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], weight: value }
    setExercises(updated)
  }

  function updateExerciseDifficulty(index: number, value: string) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], difficulty: value }
    setExercises(updated)
  }

  async function handleSave() {
    try {
      const updated = await updateLog(log.id, { plan_name: planName, date, exercises })
      onUpdate(updated)
      setEditing(false)
      setError(null)
    } catch {
      setError("Kunde inte spara ändringarna")
    }
  }

  async function handleDelete() {
    try {
      await deleteLog(log.id)
      onDelete(log.id)
    } catch {
      setError("Kunde inte ta bort träningspasset")
    }
  }

  function handleCancel() {
    setPlanName(log.plan_name)
    setDate(log.date)
    setExercises(log.exercises)
    setError(null)
    setEditing(false)
  }

  if (editing) {
    const exerciseRows = []
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i]
      exerciseRows.push(
        <div key={i} className="flex flex-col gap-2 py-3 border-b border-gray-800 last:border-0">
          <input
            value={ex.name}
            onChange={(e) => updateExerciseName(i, e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2">
            <label className="flex flex-col gap-0.5 text-xs text-gray-400">
              Set
              <input
                type="number"
                value={ex.sets}
                onChange={(e) => updateExerciseSets(i, Number(e.target.value))}
                className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 w-16 focus:outline-none focus:border-indigo-500"
              />
            </label>
            <label className="flex flex-col gap-0.5 text-xs text-gray-400">
              Reps
              <input
                type="number"
                value={ex.reps}
                onChange={(e) => updateExerciseReps(i, Number(e.target.value))}
                className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 w-16 focus:outline-none focus:border-indigo-500"
              />
            </label>
            <label className="flex flex-col gap-0.5 text-xs text-gray-400">
              Vikt (kg)
              <input
                type="number"
                value={ex.weight}
                onChange={(e) => updateExerciseWeight(i, Number(e.target.value))}
                className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 w-20 focus:outline-none focus:border-indigo-500"
              />
            </label>
          </div>
          <DifficultyPicker value={ex.difficulty} onChange={(v) => updateExerciseDifficulty(i, v)} />
        </div>
      )
    }

    return (
      <div className="min-w-80 bg-gray-900 border border-indigo-500 rounded-2xl p-6 flex flex-col gap-4 shrink-0">
        <div className="flex flex-col gap-2">
          <input
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white font-semibold text-lg rounded px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded px-3 py-1.5 focus:outline-none focus:border-indigo-500 self-start"
          />
        </div>
        <div className="flex flex-col">{exerciseRows}</div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Spara
          </button>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white text-sm transition-colors px-2"
          >
            Avbryt
          </button>
        </div>
      </div>
    )
  }

  const exerciseRows = []
  for (let i = 0; i < log.exercises.length; i++) {
    const ex = log.exercises[i]
    exerciseRows.push(
      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
        <div className="flex flex-col gap-1">
          <span className="text-white text-sm font-medium">{ex.name}</span>
          <span className="text-gray-400 text-xs">{ex.sets} set × {ex.reps} reps · {ex.weight} kg</span>
        </div>
        <DifficultyBadge difficulty={ex.difficulty} />
      </div>
    )
  }

  return (
    <div className="min-w-80 bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4 shrink-0">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white font-semibold text-lg">{log.plan_name}</p>
          <p className="text-gray-500 text-sm mt-0.5">{log.date}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setEditing(true)}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            Redigera
          </button>
          <button
            onClick={handleDelete}
            className="text-gray-600 hover:text-red-400 transition-colors text-sm"
          >
            Ta bort
          </button>
        </div>
      </div>
      <div className="flex flex-col">{exerciseRows}</div>
      <LogReactions
        logId={log.id}
        initialCount={log.reaction_count ?? 0}
        initialLiked={false}
        initialComments={log.comments ?? []}
        currentUserEmail={currentUserEmail}
      />
    </div>
  )
}
