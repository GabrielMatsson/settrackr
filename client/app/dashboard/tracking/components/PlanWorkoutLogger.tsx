"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import DifficultyPicker from "./DifficultyPicker"
import { getExerciseHistory } from "@/lib/api"
import type { WorkoutPlan, WorkoutLog, Difficulty } from "./types"

const WIP_KEY = "settrackr_wip"

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

function getInitialStates(plan: WorkoutPlan): ExerciseState[] {
  try {
    const raw = localStorage.getItem(WIP_KEY)
    if (raw) {
      const wip = JSON.parse(raw)
      if (wip.planId === plan.id && Array.isArray(wip.exerciseStates) && wip.exerciseStates.length === plan.exercises.length) {
        return wip.exerciseStates
      }
    }
  } catch {}
  return plan.exercises.map(() => ({ done: false, weight: 0, difficulty: "medium" as Difficulty }))
}

export default function PlanWorkoutLogger({ plan, onSave, onCancel, showOverloadHints }: Props) {
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>(() => getInitialStates(plan))
  const [hints, setHints] = useState<HintMap>({})
  const [showSaveWarning, setShowSaveWarning] = useState(false)
  const [skipped, setSkipped] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!showOverloadHints) return
    const names = plan.exercises.map((e) => e.name)
    getExerciseHistory(names)
      .then((data) => setHints(data as HintMap))
      .catch(() => {})
  }, [showOverloadHints, plan.exercises])

  useEffect(() => {
    localStorage.setItem(WIP_KEY, JSON.stringify({ planId: plan.id, exerciseStates }))
  }, [exerciseStates, plan.id])

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

  function toggleSkipped(index: number) {
    const next = new Set(skipped)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    setSkipped(next)
  }

  function doSave() {
    const exercises = []
    for (let i = 0; i < plan.exercises.length; i++) {
      if (skipped.has(i)) continue
      exercises.push({
        name: plan.exercises[i].name,
        sets: plan.exercises[i].sets,
        reps: plan.exercises[i].reps,
        weight: exerciseStates[i].weight,
        difficulty: exerciseStates[i].difficulty,
        done: exerciseStates[i].done,
      })
    }
    localStorage.removeItem(WIP_KEY)
    onSave({
      id: Date.now(),
      date: new Date().toLocaleDateString("sv-SE"),
      planName: plan.name,
      icon: plan.icon ?? "Dumbbell",
      exercises,
    })
  }

  function handleSaveClick() {
    const hasUndone = exerciseStates.some((s) => !s.done)
    if (hasUndone && !showSaveWarning) {
      setShowSaveWarning(true)
      return
    }
    doSave()
  }

  function handleCancel() {
    localStorage.removeItem(WIP_KEY)
    onCancel()
  }

  const rows = []
  for (let i = 0; i < plan.exercises.length; i++) {
    const ex = plan.exercises[i]
    const state = exerciseStates[i]
    rows.push(
      <div
        key={i}
        className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${
          state.done
            ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
        }`}
      >
        <div className="px-4 pt-4 pb-3 flex items-start gap-3">
          <button
            type="button"
            onClick={() => updateDone(i, !state.done)}
            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border-2 transition-colors ${
              state.done ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-gray-500"
            }`}
          >
            {state.done && <Check size={11} className="text-white" strokeWidth={3} />}
          </button>

          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm truncate ${
              state.done ? "line-through text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"
            }`}>
              {ex.name}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{ex.sets} × {ex.reps} reps</p>
            {showOverloadHints && hints[ex.name] && (
              <p className="text-xs text-orange-500 dark:text-orange-400 font-medium mt-0.5">
                Senast: {hints[ex.name].last_weight} kg · Max: {hints[ex.name].max_weight} kg
              </p>
            )}
          </div>

          <div className="shrink-0 flex flex-col items-end gap-1">
            <span className="text-xs text-gray-400 dark:text-gray-500">Vikt (kg)</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={state.weight || ""}
                onChange={(e) => updateWeight(i, Number(e.target.value))}
                placeholder="0"
                className={`w-16 text-right text-base font-semibold rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                  state.done
                    ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                }`}
              />
              <span className="text-xs text-gray-400 dark:text-gray-500">kg</span>
            </div>
          </div>
        </div>

        <div className={`px-4 py-3 flex items-center gap-3 border-t ${
          state.done ? "border-green-200 dark:border-green-800" : "border-gray-100 dark:border-gray-800"
        }`}>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium shrink-0">Intensitet</span>
          <DifficultyPicker value={state.difficulty} onChange={(d) => updateDifficulty(i, d)} />
        </div>
      </div>
    )
  }

  const undoneExercises = plan.exercises.filter((_, i) => !exerciseStates[i].done)

  return (
    <div className="flex flex-col gap-3">
      {rows}

      {showSaveWarning && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {undoneExercises.length} övning{undoneExercises.length !== 1 ? "ar" : ""} är inte markerade som klara
          </p>
          <div className="flex flex-col gap-2">
            {plan.exercises.map((ex, i) => {
              if (exerciseStates[i].done) return null
              return (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{ex.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleSkipped(i)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                      skipped.has(i)
                        ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600"
                    }`}
                  >
                    {skipped.has(i) ? "Hoppas över" : "Hoppa över"}
                  </button>
                </div>
              )
            })}
          </div>
          <div className="flex gap-2 pt-1 border-t border-amber-200 dark:border-amber-700">
            <button
              onClick={doSave}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Spara ändå
            </button>
            <button
              onClick={() => { setShowSaveWarning(false); setSkipped(new Set()) }}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm px-4 py-2 transition-colors"
            >
              Tillbaka
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSaveClick}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2 rounded-lg transition-colors"
        >
          Spara pass
        </button>
        <button
          onClick={handleCancel}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-5 py-2"
        >
          Avbryt
        </button>
      </div>
    </div>
  )
}
