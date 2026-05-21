"use client"

import { useState } from "react"
import { X } from "lucide-react"
import DifficultyPicker from "./DifficultyPicker"
import type { WorkoutLog, Difficulty } from "./types"

type CustomExercise = {
  name: string
  sets: number
  reps: number
  weight: number
  difficulty: Difficulty
}

type Props = {
  onSave: (log: WorkoutLog) => void
  onCancel: () => void
}

function getSetOptions() {
  const options = []
  for (let i = 1; i <= 10; i++) {
    options.push(<option key={i} value={i}>{i} set</option>)
  }
  return options
}

function getRepOptions() {
  const options = []
  for (let i = 1; i <= 30; i++) {
    options.push(<option key={i} value={i}>{i} reps</option>)
  }
  return options
}

export default function CustomWorkoutLogger({ onSave, onCancel }: Props) {
  const [exercises, setExercises] = useState<CustomExercise[]>([
    { name: "", sets: 3, reps: 10, weight: 0, difficulty: "medium" },
  ])
  const [error, setError] = useState<string | null>(null)

  function addExercise() {
    setExercises([...exercises, { name: "", sets: 3, reps: 10, weight: 0, difficulty: "medium" }])
  }

  function removeExercise(index: number) {
    const updated = [...exercises]
    updated.splice(index, 1)
    setExercises(updated)
  }

  function updateName(index: number, value: string) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], name: value }
    setExercises(updated)
  }

  function updateSets(index: number, value: number) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], sets: value }
    setExercises(updated)
  }

  function updateReps(index: number, value: number) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], reps: value }
    setExercises(updated)
  }

  function updateWeight(index: number, value: number) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], weight: value }
    setExercises(updated)
  }

  function updateDifficulty(index: number, value: Difficulty) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], difficulty: value }
    setExercises(updated)
  }

  function save() {
    for (let i = 0; i < exercises.length; i++) {
      if (!exercises[i].name.trim()) {
        setError("Alla övningar måste ha ett namn")
        return
      }
    }
    setError(null)
    const logs = []
    for (let i = 0; i < exercises.length; i++) {
      logs.push({ ...exercises[i], done: true })
    }
    onSave({
      id: Date.now(),
      date: new Date().toLocaleDateString("sv-SE"),
      planName: "Anpassad träning",
      exercises: logs,
    })
  }

  const rows = []
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i]
    rows.push(
      <div key={i} className="flex flex-col gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={ex.name}
            onChange={(e) => updateName(i, e.target.value)}
            placeholder="Övningens namn"
            className="flex-1 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          />
          {exercises.length > 1 && (
            <button
              onClick={() => removeExercise(i)}
              className="text-gray-400 dark:text-gray-500 hover:text-red-400 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <select
            value={ex.sets}
            onChange={(e) => updateSets(i, Number(e.target.value))}
            className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
          >
            {getSetOptions()}
          </select>
          <select
            value={ex.reps}
            onChange={(e) => updateReps(i, Number(e.target.value))}
            className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
          >
            {getRepOptions()}
          </select>
          <input
            type="number"
            value={ex.weight || ""}
            onChange={(e) => updateWeight(i, Number(e.target.value))}
            placeholder="kg"
            className="w-16 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
          />
          <DifficultyPicker
            value={ex.difficulty}
            onChange={(d) => updateDifficulty(i, d)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {rows}
      <button
        onClick={addExercise}
        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors self-start"
      >
        + Lägg till övning
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button
          onClick={save}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2 rounded-lg transition-colors"
        >
          Spara pass
        </button>
        <button
          onClick={onCancel}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-5 py-2"
        >
          Avbryt
        </button>
      </div>
    </div>
  )
}
