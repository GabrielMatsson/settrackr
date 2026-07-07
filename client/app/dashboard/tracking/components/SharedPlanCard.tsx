"use client"

import { useState } from "react"
import { ChevronDown, GripVertical } from "lucide-react"

type Exercise = { id: number; name: string; sets: number; reps: number }
type Owner = { id: number; name: string | null; email: string }
type SharedPlan = { id: number; name: string; exercises: Exercise[]; owner: Owner }

type Props = {
  plan: SharedPlan
  onLog: (plan: SharedPlan) => void
  onRemove: (planId: number) => void
  // Starts a Motion Reorder drag from the grip handle
  onGripPointerDown?: (e: React.PointerEvent) => void
}

export default function SharedPlanCard({ plan, onLog, onRemove, onGripPointerDown }: Props) {
  const [expanded, setExpanded] = useState(false)

  const ownerLabel = plan.owner.name ?? plan.owner.email.split("@")[0]
  const initials = ownerLabel.slice(0, 2).toUpperCase()

  return (
    <div>
      <div
        className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group"
        onClick={() => setExpanded(!expanded)}
      >
        {onGripPointerDown && (
          <GripVertical
            size={16}
            className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0 touch-none"
            onPointerDown={(e) => { e.stopPropagation(); onGripPointerDown(e) }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 text-white text-xs font-semibold">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 dark:text-white font-medium text-sm">{plan.name}</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs">Delad av {ownerLabel}</p>
        </div>
        <span className="text-gray-400 dark:text-gray-500 text-sm shrink-0">{plan.exercises.length} övningar</span>
        <button
          onClick={(e) => { e.stopPropagation(); onLog(plan) }}
          className="text-sm border border-indigo-400 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors shrink-0"
        >
          Logga pass
        </button>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`}
        />
      </div>

      {expanded && (
        <div className="px-5 pb-4 pt-3 flex flex-col gap-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
          <div className="flex flex-col gap-1.5">
            {plan.exercises.map((ex, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-100 dark:border-gray-700"
              >
                <span className="text-gray-900 dark:text-white">{ex.name}</span>
                <span className="text-gray-400 dark:text-gray-500">{ex.sets} set · {ex.reps} reps</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => onRemove(plan.id)}
            className="self-start text-sm text-red-500 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Ta bort
          </button>
        </div>
      )}
    </div>
  )
}
