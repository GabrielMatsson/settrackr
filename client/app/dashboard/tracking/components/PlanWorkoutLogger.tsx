"use client"

import { useState } from "react"
import DifficultyPicker from "./DifficultyPicker"
import type { WorkoutPlan, WorkoutLog, Difficulty } from "./types"

type Props = {
  plan: WorkoutPlan
  onSave: (log: WorkoutLog) => void
  onCancel: () => void
}

type ExerciseState = {
  done: boolean
  weight: number
  difficulty: Difficulty
}

export default function PlanWorkoutLogger({ plan, onSave, onCancel }: Props) {
  const initialState: ExerciseState[] = []
  for (let i = 0; i < plan.exercises.length; i++) {
    initialState.push({ done: false, weight: 0, difficulty: "medium" })
  }
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>(initialState)

  function updateDone(index: number, done: boolean) {
    const updated = [...exerciseStates]
    updated[index] = { ...updated[index], done }
    setExerciseStates(updated)
  }

  function updateWeight(index: number, weight: number) {
    const updated = [...exerciseStates]
    updated[index] = { ...updated[index], weight }
    setExerciseStates(updated)
  }

  function updateDifficulty(index: number, difficulty: Difficulty) {
    const updated = [...exerciseStates]
    updated[index] = { ...updated[index], difficulty }
    setExerciseStates(updated)
  }

  function save() {
    const exercises = []
    for (let i = 0; i < plan.exercises.length; i++) {
      exercises.push({
        name: plan.exercises[i].name,
        sets: plan.exercises[i].sets,
        reps: plan.exercises[i].reps,
        weight: exerciseStates[i].weight,
        difficulty: exerciseStates[i].difficulty,
        done: exerciseStates[i].done,
      })
    }
    onSave({
      id: Date.now(),
      date: new Date().toLocaleDateString("sv-SE"),
      planName: plan.name,
      exercises,
    })
  }

  const rows = []
  for (let i = 0; i < plan.exercises.length; i++) {
    const ex = plan.exercises[i]
    const state = exerciseStates[i]
    rows.push(
      <div
        key={i}
        className={`flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3 ${state.done ? "opacity-50" : ""}`}
      >
        <input
          type="checkbox"
          checked={state.done}
          onChange={(e) => updateDone(i, e.target.checked)}
          className="w-4 h-4 accent-indigo-500 shrink-0"
        />
        <span className={`flex-1 text-sm ${state.done ? "line-through text-gray-500" : "text-white"}`}>
          {ex.name} — {ex.sets} set · {ex.reps} reps
        </span>
        <input
          type="number"
          value={state.weight || ""}
          onChange={(e) => updateWeight(i, Number(e.target.value))}
          placeholder="kg"
          className="w-16 bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
        />
        <DifficultyPicker
          value={state.difficulty}
          onChange={(d) => updateDifficulty(i, d)}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {rows}
      <div className="flex gap-3 pt-2">
        <button
          onClick={save}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2 rounded-lg transition-colors"
        >
          Spara pass
        </button>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition-colors px-5 py-2"
        >
          Avbryt
        </button>
      </div>
    </div>
  )
}
