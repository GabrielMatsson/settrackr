"use client"

import { useRef } from "react"
import { GripVertical, X } from "lucide-react"
import IconPicker from "./IconPicker"
import type { Exercise } from "./types"

type Props = {
  isEditing: boolean
  planName: string
  planIcon: string
  exercises: Exercise[]
  onPlanNameChange: (value: string) => void
  onPlanIconChange: (value: string) => void
  onAddExercise: () => void
  onRemoveExercise: (index: number) => void
  onUpdateName: (index: number, value: string) => void
  onUpdateSets: (index: number, value: number) => void
  onUpdateReps: (index: number, value: number) => void
  onReorder: (from: number, to: number) => void
  onSave: () => void
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

export default function PlanForm({
  isEditing,
  planName,
  planIcon,
  exercises,
  onPlanNameChange,
  onPlanIconChange,
  onAddExercise,
  onRemoveExercise,
  onUpdateName,
  onUpdateSets,
  onUpdateReps,
  onReorder,
  onSave,
  onCancel,
}: Props) {
  const dragIndex = useRef<number | null>(null)

  const exerciseRows = []
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i]
    exerciseRows.push(
      <div
        key={i}
        draggable
        onDragStart={() => { dragIndex.current = i }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => { if (dragIndex.current !== null) onReorder(dragIndex.current, i) }}
        className="flex gap-3 items-center group"
      >
        <GripVertical
          size={16}
          className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 cursor-grab shrink-0"
        />
        <input
          type="text"
          value={ex.name}
          onChange={(e) => onUpdateName(i, e.target.value)}
          placeholder="Övningens namn"
          className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={ex.sets}
          onChange={(e) => onUpdateSets(i, Number(e.target.value))}
          className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
        >
          {getSetOptions()}
        </select>
        <select
          value={ex.reps}
          onChange={(e) => onUpdateReps(i, Number(e.target.value))}
          className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
        >
          {getRepOptions()}
        </select>
        {exercises.length > 1 && (
          <button
            onClick={() => onRemoveExercise(i)}
            className="text-gray-400 dark:text-gray-500 hover:text-red-400 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {isEditing ? "Redigera plan" : "Ny träningsplan"}
      </h2>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-500 dark:text-gray-400">Planens namn</label>
        <input
          type="text"
          value={planName}
          onChange={(e) => onPlanNameChange(e.target.value)}
          placeholder="T.ex. Bröst & Triceps"
          className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-500 dark:text-gray-400">Ikon</label>
        <IconPicker value={planIcon} onChange={onPlanIconChange} />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">Övningar</p>
        {exerciseRows}
        <button
          onClick={onAddExercise}
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors self-start"
        >
          + Lägg till övning
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onSave}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2 rounded-lg transition-colors"
        >
          Spara plan
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
