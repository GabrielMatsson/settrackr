"use client"

import { useState } from "react"
import PlanWorkoutLogger from "./PlanWorkoutLogger"
import CustomWorkoutLogger from "./CustomWorkoutLogger"
import type { WorkoutPlan, WorkoutLog } from "./types"

type Props = {
  plans: WorkoutPlan[]
  onSave: (log: WorkoutLog) => void
  onCancel: () => void
  showOverloadHints: boolean
}

type Mode = "choose" | "plan" | "custom"

function getPlanOptions(plans: WorkoutPlan[]) {
  const options = []
  for (let i = 0; i < plans.length; i++) {
    options.push(<option key={plans[i].id} value={i}>{plans[i].name}</option>)
  }
  return options
}

export default function WorkoutLogger({ plans, onSave, onCancel, showOverloadHints }: Props) {
  const [mode, setMode] = useState<Mode>("choose")
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0)

  if (mode === "plan") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500 dark:text-gray-400">Välj träningsplan</label>
          <select
            value={selectedPlanIndex}
            onChange={(e) => setSelectedPlanIndex(Number(e.target.value))}
            className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 self-start"
          >
            {getPlanOptions(plans)}
          </select>
        </div>
        <PlanWorkoutLogger
          key={selectedPlanIndex}
          plan={plans[selectedPlanIndex]}
          onSave={onSave}
          onCancel={onCancel}
          showOverloadHints={showOverloadHints}
        />
      </div>
    )
  }

  if (mode === "custom") {
    return <CustomWorkoutLogger onSave={onSave} onCancel={onCancel} />
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">Välj hur du vill logga träningen</p>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setMode("plan")}
          disabled={plans.length === 0}
          className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-xl p-5 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <p className="text-gray-900 dark:text-white font-medium mb-1">Träningsplan</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {plans.length === 0 ? "Inga planer skapade ännu" : "Välj en befintlig plan"}
          </p>
        </button>
        <button
          onClick={() => setMode("custom")}
          className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-xl p-5 text-left transition-colors"
        >
          <p className="text-gray-900 dark:text-white font-medium mb-1">Anpassad</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Lägg till övningar manuellt</p>
        </button>
      </div>
      <button
        onClick={onCancel}
        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors self-start text-sm"
      >
        Avbryt
      </button>
    </div>
  )
}
