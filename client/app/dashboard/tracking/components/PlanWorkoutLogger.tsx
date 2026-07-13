"use client"

import { useState, useEffect } from "react"
import { Check, X, Pencil } from "lucide-react"
import DifficultyPicker from "./DifficultyPicker"
import { getExerciseHistory } from "@/lib/api"
import { getSetOptions, getRepOptions } from "./exerciseOptions"
import type { WorkoutPlan, WorkoutLog, Difficulty } from "./types"

const WIP_KEY = "settrackr_wip"

type Props = {
  plan: WorkoutPlan
  onSave: (log: WorkoutLog) => void
  onCancel: () => void
  showOverloadHints: boolean
}

type HintMap = Record<string, { last_weight: number; max_weight: number; is_bodyweight?: boolean }>

type ExerciseState = {
  done: boolean
  weight: number
  difficulty: Difficulty
  sets: number
  reps: number
  isBodyweight: boolean
}

type ExtraExercise = {
  name: string
  sets: number
  reps: number
  weight: number
  difficulty: Difficulty
  done: boolean
  isBodyweight?: boolean
}

type WipSnapshot = {
  planId?: number
  plan?: { name?: string }
  exerciseStates?: Partial<ExerciseState>[]
  extraExercises?: ExtraExercise[]
}

function matchingWip(plan: WorkoutPlan): WipSnapshot | null {
  try {
    const raw = localStorage.getItem(WIP_KEY)
    if (!raw) return null
    const wip = JSON.parse(raw) as WipSnapshot
    const sameId = wip.planId !== undefined && wip.planId === plan.id
    const sameName = wip.plan?.name !== undefined && wip.plan.name === plan.name
    if (sameId || sameName) return wip
  } catch {}
  return null
}

function getInitialStates(plan: WorkoutPlan): ExerciseState[] {
  const wip = matchingWip(plan)
  if (wip && Array.isArray(wip.exerciseStates) && wip.exerciseStates.length === plan.exercises.length) {
    return wip.exerciseStates.map((s, i) => ({
      done: s.done ?? false,
      weight: s.weight ?? 0,
      difficulty: s.difficulty ?? "medium",
      sets: s.sets ?? plan.exercises[i].sets,
      reps: s.reps ?? plan.exercises[i].reps,
      isBodyweight: s.isBodyweight ?? false, // old WIP snapshots lack the key
    }))
  }
  return plan.exercises.map((ex) => ({ done: false, weight: 0, difficulty: "medium" as Difficulty, sets: ex.sets, reps: ex.reps, isBodyweight: false }))
}

function getInitialExtras(plan: WorkoutPlan): ExtraExercise[] {
  const wip = matchingWip(plan)
  if (wip && Array.isArray(wip.extraExercises)) return wip.extraExercises
  return []
}

export default function PlanWorkoutLogger({ plan, onSave, onCancel, showOverloadHints }: Props) {
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>(() => getInitialStates(plan))
  const [extraExercises, setExtraExercises] = useState<ExtraExercise[]>(() => getInitialExtras(plan))
  const [hints, setHints] = useState<HintMap>({})
  const [showSaveWarning, setShowSaveWarning] = useState(false)
  const [skipped, setSkipped] = useState<Set<number>>(new Set())
  const [wipRestored] = useState(() => matchingWip(plan) !== null)

  // Always fetched (cheap cached GET): the history both powers the overload
  // hints (display gated below) and pre-checks "Kroppsvikt" for exercises
  // last logged as bodyweight.
  useEffect(() => {
    const names = plan.exercises.map((e) => e.name)
    getExerciseHistory(names)
      .then((data) => {
        const map = data as HintMap
        setHints(map)
        if (wipRestored) return // never override a restored in-progress workout
        setExerciseStates((prev) =>
          prev.map((s, i) => {
            const h = map[plan.exercises[i].name]
            if (h?.is_bodyweight && !s.done && s.weight === 0 && !s.isBodyweight) {
              return { ...s, isBodyweight: true }
            }
            return s
          })
        )
      })
      .catch(() => {})
  }, [plan.exercises, wipRestored])

  useEffect(() => {
    // Snapshot the whole plan so an ongoing workout can be restored without
    // any network call (the backend may be cold-booting or unreachable)
    localStorage.setItem(WIP_KEY, JSON.stringify({
      planId: plan.id,
      plan: { id: plan.id, name: plan.name, icon: plan.icon, exercises: plan.exercises },
      exerciseStates,
      extraExercises,
      savedAt: Date.now(),
    }))
  }, [exerciseStates, extraExercises, plan])

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

  function updateSets(index: number, sets: number) {
    const updated = [...exerciseStates]
    updated[index] = { ...updated[index], sets }
    setExerciseStates(updated)
  }

  function updateReps(index: number, reps: number) {
    const updated = [...exerciseStates]
    updated[index] = { ...updated[index], reps }
    setExerciseStates(updated)
  }

  function updateDifficulty(index: number, difficulty: Difficulty) {
    const updated = [...exerciseStates]
    updated[index] = { ...updated[index], difficulty }
    setExerciseStates(updated)
  }

  function updateBodyweight(index: number, isBodyweight: boolean) {
    const updated = [...exerciseStates]
    updated[index] = { ...updated[index], isBodyweight }
    setExerciseStates(updated)
  }

  function toggleSkipped(index: number) {
    const next = new Set(skipped)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    setSkipped(next)
  }

  function addExtra() {
    setExtraExercises([...extraExercises, { name: "", sets: 3, reps: 10, weight: 0, difficulty: "medium", done: false, isBodyweight: false }])
  }

  function removeExtra(index: number) {
    const updated = [...extraExercises]
    updated.splice(index, 1)
    setExtraExercises(updated)
  }

  function updateExtraName(index: number, name: string) {
    const updated = [...extraExercises]
    updated[index] = { ...updated[index], name }
    setExtraExercises(updated)
  }

  function updateExtraSets(index: number, sets: number) {
    const updated = [...extraExercises]
    updated[index] = { ...updated[index], sets }
    setExtraExercises(updated)
  }

  function updateExtraReps(index: number, reps: number) {
    const updated = [...extraExercises]
    updated[index] = { ...updated[index], reps }
    setExtraExercises(updated)
  }

  function updateExtraWeight(index: number, weight: number) {
    const updated = [...extraExercises]
    updated[index] = { ...updated[index], weight }
    setExtraExercises(updated)
  }

  function updateExtraDifficulty(index: number, difficulty: Difficulty) {
    const updated = [...extraExercises]
    updated[index] = { ...updated[index], difficulty }
    setExtraExercises(updated)
  }

  function updateExtraDone(index: number, done: boolean) {
    const updated = [...extraExercises]
    updated[index] = { ...updated[index], done }
    setExtraExercises(updated)
  }

  function updateExtraBodyweight(index: number, isBodyweight: boolean) {
    const updated = [...extraExercises]
    updated[index] = { ...updated[index], isBodyweight }
    setExtraExercises(updated)
  }

  function doSave() {
    const exercises = []
    for (let i = 0; i < plan.exercises.length; i++) {
      if (skipped.has(i)) continue
      exercises.push({
        name: plan.exercises[i].name,
        sets: exerciseStates[i].sets,
        reps: exerciseStates[i].reps,
        weight: exerciseStates[i].weight,
        difficulty: exerciseStates[i].difficulty,
        done: exerciseStates[i].done,
        is_bodyweight: exerciseStates[i].isBodyweight,
      })
    }
    for (const ex of extraExercises) {
      if (!ex.name.trim()) continue
      exercises.push({
        name: ex.name.trim(),
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        difficulty: ex.difficulty,
        done: ex.done,
        is_bodyweight: ex.isBodyweight ?? false,
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
            : "border-indigo-100 dark:border-gray-700 bg-white dark:bg-gray-900"
        }`}
      >
        <div className="px-4 pt-4 pb-3 flex items-start gap-3">
          <button
            type="button"
            onClick={() => updateDone(i, !state.done)}
            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border-2 transition-colors ${
              state.done ? "bg-green-500 border-green-500" : "border-indigo-300 dark:border-gray-500"
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
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-0.5">
              <select
                value={state.sets}
                onChange={(e) => updateSets(i, Number(e.target.value))}
                className="appearance-none bg-transparent border-0 p-0 text-xs text-gray-400 dark:text-gray-500 focus:outline-none cursor-pointer"
              >
                {getSetOptions()}
              </select>
              <span>×</span>
              <select
                value={state.reps}
                onChange={(e) => updateReps(i, Number(e.target.value))}
                className="appearance-none bg-transparent border-0 p-0 text-xs text-gray-400 dark:text-gray-500 focus:outline-none cursor-pointer"
              >
                {getRepOptions()}
              </select>
              <Pencil size={10} className="shrink-0" />
            </p>
            {showOverloadHints && hints[ex.name] && (
              <p className="text-xs text-orange-500 dark:text-orange-400 font-medium mt-0.5">
                Senast: {hints[ex.name].last_weight} kg · Max: {hints[ex.name].max_weight} kg
              </p>
            )}
          </div>

          <div className="shrink-0 flex flex-col items-end gap-1">
            <span className="text-xs text-gray-400 dark:text-gray-500">{state.isBodyweight ? "Extra vikt (kg)" : "Vikt (kg)"}</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={state.weight || ""}
                onChange={(e) => updateWeight(i, Number(e.target.value))}
                placeholder="0"
                className={`w-16 text-right text-base font-semibold rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                  state.done
                    ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                    : "bg-indigo-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                }`}
              />
              <span className="text-xs text-gray-400 dark:text-gray-500">kg</span>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={state.isBodyweight}
                onChange={(e) => updateBodyweight(i, e.target.checked)}
                className="w-3.5 h-3.5 accent-indigo-500"
              />
              Kroppsvikt
            </label>
          </div>
        </div>

        <div className={`px-4 py-3 flex items-center gap-3 border-t ${
          state.done ? "border-green-200 dark:border-green-800" : "border-indigo-100 dark:border-gray-800"
        }`}>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium shrink-0">Intensitet</span>
          <DifficultyPicker value={state.difficulty} onChange={(d) => updateDifficulty(i, d)} />
        </div>
      </div>
    )
  }

  const extraRows = []
  for (let i = 0; i < extraExercises.length; i++) {
    const ex = extraExercises[i]
    extraRows.push(
      <div
        key={`extra-${i}`}
        className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${
          ex.done
            ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
            : "border-indigo-100 dark:border-gray-700 bg-white dark:bg-gray-900"
        }`}
      >
        <div className="px-4 pt-4 pb-3 flex items-start gap-3">
          <button
            type="button"
            onClick={() => updateExtraDone(i, !ex.done)}
            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border-2 transition-colors ${
              ex.done ? "bg-green-500 border-green-500" : "border-indigo-300 dark:border-gray-500"
            }`}
          >
            {ex.done && <Check size={11} className="text-white" strokeWidth={3} />}
          </button>

          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <input
              type="text"
              value={ex.name}
              onChange={(e) => updateExtraName(i, e.target.value)}
              placeholder="Extra övning"
              className="font-semibold text-sm bg-transparent border-0 border-b border-dashed border-gray-300 dark:border-gray-600 focus:outline-none focus:border-indigo-500 text-gray-900 dark:text-white px-0 py-0.5 w-full"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
              <select
                value={ex.sets}
                onChange={(e) => updateExtraSets(i, Number(e.target.value))}
                className="appearance-none bg-transparent border-0 p-0 text-xs text-gray-400 dark:text-gray-500 focus:outline-none cursor-pointer"
              >
                {getSetOptions()}
              </select>
              <span>×</span>
              <select
                value={ex.reps}
                onChange={(e) => updateExtraReps(i, Number(e.target.value))}
                className="appearance-none bg-transparent border-0 p-0 text-xs text-gray-400 dark:text-gray-500 focus:outline-none cursor-pointer"
              >
                {getRepOptions()}
              </select>
              <Pencil size={10} className="shrink-0" />
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-1">
            <span className="text-xs text-gray-400 dark:text-gray-500">{ex.isBodyweight ? "Extra vikt (kg)" : "Vikt (kg)"}</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={ex.weight || ""}
                onChange={(e) => updateExtraWeight(i, Number(e.target.value))}
                placeholder="0"
                className={`w-16 text-right text-base font-semibold rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                  ex.done
                    ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                    : "bg-indigo-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                }`}
              />
              <span className="text-xs text-gray-400 dark:text-gray-500">kg</span>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ex.isBodyweight ?? false}
                onChange={(e) => updateExtraBodyweight(i, e.target.checked)}
                className="w-3.5 h-3.5 accent-indigo-500"
              />
              Kroppsvikt
            </label>
          </div>

          <button
            type="button"
            onClick={() => removeExtra(i)}
            className="text-gray-400 dark:text-gray-500 hover:text-red-400 transition-colors shrink-0 mt-0.5"
          >
            <X size={16} />
          </button>
        </div>

        <div className={`px-4 py-3 flex items-center gap-3 border-t ${
          ex.done ? "border-green-200 dark:border-green-800" : "border-indigo-100 dark:border-gray-800"
        }`}>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium shrink-0">Intensitet</span>
          <DifficultyPicker value={ex.difficulty} onChange={(d) => updateExtraDifficulty(i, d)} />
        </div>
      </div>
    )
  }

  const undoneExercises = plan.exercises.filter((_, i) => !exerciseStates[i].done)

  return (
    <div className="flex flex-col gap-3">
      {rows}
      {extraRows}

      <button
        type="button"
        onClick={addExtra}
        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors self-start"
      >
        + Lägg till övning
      </button>

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
