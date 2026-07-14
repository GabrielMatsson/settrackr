"use client"

import { useState } from "react"
import { X } from "lucide-react"
import DifficultyPicker from "./DifficultyPicker"
import IconPicker from "./IconPicker"
import SheetSelect from "@/app/components/SheetSelect"
import { SET_OPTIONS, REP_OPTIONS } from "./exerciseOptions"
import type { WorkoutLog, Difficulty } from "./types"

type CustomExercise = {
  name: string
  sets: number
  reps: number
  weight: number
  difficulty: Difficulty
  isBodyweight: boolean
}

type Props = {
  onSave: (log: WorkoutLog) => void
  onCancel: () => void
}

const BOXED_SELECT = "flex items-center justify-between gap-2 bg-white dark:bg-gray-800 border border-indigo-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"

export default function CustomWorkoutLogger({ onSave, onCancel }: Props) {
  const [planName, setPlanName] = useState("Anpassad träning")
  const [icon, setIcon] = useState("Dumbbell")
  const [exercises, setExercises] = useState<CustomExercise[]>([
    { name: "", sets: 3, reps: 10, weight: 0, difficulty: "medium", isBodyweight: false },
  ])
  const [error, setError] = useState<string | null>(null)

  function addExercise() {
    setExercises([...exercises, { name: "", sets: 3, reps: 10, weight: 0, difficulty: "medium", isBodyweight: false }])
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

  function updateBodyweight(index: number, value: boolean) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], isBodyweight: value }
    setExercises(updated)
  }

  function save() {
    if (!planName.trim()) {
      setError("Passet måste ha ett namn")
      return
    }
    for (let i = 0; i < exercises.length; i++) {
      if (!exercises[i].name.trim()) {
        setError("Alla övningar måste ha ett namn")
        return
      }
    }
    setError(null)
    const logs = []
    for (let i = 0; i < exercises.length; i++) {
      const { isBodyweight, ...rest } = exercises[i]
      logs.push({ ...rest, is_bodyweight: isBodyweight, done: true })
    }
    onSave({
      id: Date.now(),
      date: new Date().toLocaleDateString("sv-SE"),
      planName: planName.trim(),
      icon,
      exercises: logs,
    })
  }

  const rows = []
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i]
    rows.push(
      <div key={i} className="flex flex-col gap-2 bg-indigo-50/60 dark:bg-gray-800 border border-indigo-100 dark:border-transparent rounded-lg p-3">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={ex.name}
            onChange={(e) => updateName(i, e.target.value)}
            placeholder="Övningens namn"
            className="flex-1 bg-white dark:bg-gray-800 border border-indigo-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
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
          <SheetSelect
            value={ex.sets}
            options={SET_OPTIONS}
            onChange={(v) => updateSets(i, v)}
            ariaLabel="Antal set"
            triggerClassName={BOXED_SELECT}
          />
          <SheetSelect
            value={ex.reps}
            options={REP_OPTIONS}
            onChange={(v) => updateReps(i, v)}
            ariaLabel="Antal reps"
            triggerClassName={BOXED_SELECT}
          />
          <input
            type="number"
            value={ex.weight || ""}
            onChange={(e) => updateWeight(i, Number(e.target.value))}
            placeholder={ex.isBodyweight ? "extra kg" : "kg"}
            className="w-16 bg-white dark:bg-gray-800 border border-indigo-100 dark:border-gray-700 text-gray-900 dark:text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
          />
          <DifficultyPicker
            value={ex.difficulty}
            onChange={(d) => updateDifficulty(i, d)}
          />
          <label className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={ex.isBodyweight}
              onChange={(e) => updateBodyweight(i, e.target.checked)}
              className="w-3.5 h-3.5 accent-indigo-500"
            />
            Kroppsvikt
          </label>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-500 dark:text-gray-400">Passnamn</label>
        <input
          type="text"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="T.ex. Ben & Axlar"
          className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-500 dark:text-gray-400">Ikon</label>
        <IconPicker value={icon} onChange={setIcon} />
      </div>
      <div className="flex flex-col gap-3">
        {rows}
        <button
          onClick={addExercise}
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors self-start"
        >
          + Lägg till övning
        </button>
      </div>
      {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}
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
