"use client"

import { useState, useEffect } from "react"
import DifficultyPicker from "./DifficultyPicker"
import { getExerciseHistory } from "@/lib/api"
import type { WorkoutPlan, WorkoutLog, Difficulty } from "./types"

type Props = {
  plan: WorkoutPlan
  onSave: (log: WorkoutLog) => void
  onCancel: () => void
  showOverloadHints: boolean
}

type HintMap = Record<string, { last_weight: number; max_weight: number }>

type ExerciseState = {
  done: boolean
  weight: number
  difficulty: Difficulty
}

export default function PlanWorkoutLogger({ plan, onSave, onCancel, showOverloadHints }: Props) {
  const initialState: ExerciseState[] = []
  for (let i = 0; i < plan.exercises.length; i++) {
    initialState.push({ done: false, weight: 0, difficulty: "medium" })
  }
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>(initialState)
  const [hints, setHints] = useState<HintMap>({})

  useEffect(() => {
    if (!showOverloadHints) return
    const names = plan.exercises.map((e) => e.name)
    getExerciseHistory(names)
      .then((data) => setHints(data as HintMap))
      .catch(() => {})
  }, [showOverloadHints, plan.name])

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
        className={`flex items-start gap-3 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 ${state.done ? "opacity-50" : ""}`}
      >
        <input
          type="checkbox"
          checked={state.done}
          onChange={(e) => updateDone(i, e.target.checked)}
          className="w-4 h-4 accent-indigo-500 shrink-0 mt-0.5"
        />
        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
          <span className={`text-sm ${state.done ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"}`}>
            {ex.name} — {ex.sets} set · {ex.reps} reps
          </span>
          {showOverloadHints && hints[ex.name] && (
            <span className="text-xs text-orange-500 dark:text-orange-400 font-medium">
              Senast: {hints[ex.name].last_weight} kg · Max: {hints[ex.name].max_weight} kg
            </span>
          )}
        </div>
        <input
          type="number"
          value={state.weight || ""}
          onChange={(e) => updateWeight(i, Number(e.target.value))}
          placeholder="kg"
          className="w-16 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500 shrink-0"
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
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-5 py-2"
        >
          Avbryt
        </button>
      </div>
    </div>
  )
}
