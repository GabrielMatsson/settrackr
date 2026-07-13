"use client"

import { useState } from "react"
import { Lightbulb, Check } from "lucide-react"
import PressableButton from "@/app/components/PressableButton"
import { updateMe, clearCache, type TargetSuggestion } from "@/lib/api"
import { GOAL_MODE_LABELS } from "@/lib/weight-utils"

function fmtKg(v: number): string {
  return String(Math.round(v * 10) / 10).replace(".", ",")
}

function fmtTrend(kgPerWeek: number): string {
  const sign = kgPerWeek >= 0 ? "+" : "−"
  return `${sign}${String(Math.abs(Math.round(kgPerWeek * 100) / 100)).replace(".", ",")} kg/vecka`
}

type Props = {
  suggestion: TargetSuggestion
  weeks: number
  onApplied: () => void
}

export default function SuggestedTargetCard({ suggestion, weeks, onApplied }: Props) {
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)

  const { mode, current_weight, target_weight, weekly_change_kg, basis, suggested_kcal, current_target, reasoning } = suggestion
  const showApply = basis === "trend" && suggested_kcal != null && suggested_kcal !== current_target

  async function handleApply() {
    if (suggested_kcal == null) return
    setApplying(true)
    try {
      await updateMe({ kcal_target: suggested_kcal })
      // PATCH /users/me only invalidates /users* — the insights response caches
      // the old target, so drop it before refetching
      clearCache(`/insights/nutrition?weeks=${weeks}`)
      setApplied(true)
      onApplied()
    } finally {
      setApplying(false)
    }
  }

  const facts: string[] = []
  if (current_weight != null) {
    facts.push(target_weight != null ? `Vikt: ${fmtKg(current_weight)} kg → mål ${fmtKg(target_weight)} kg` : `Vikt: ${fmtKg(current_weight)} kg`)
  }
  if (weekly_change_kg != null) facts.push(`trend ${fmtTrend(weekly_change_kg)}`)

  return (
    <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl shadow-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
            <Lightbulb size={17} />
          </div>
          <p className="text-gray-900 dark:text-white font-semibold">Kaloriförslag</p>
        </div>
        {mode && (
          <span className="text-xs rounded-full px-2 py-0.5 ring-1 ring-inset bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-emerald-600/20">
            {GOAL_MODE_LABELS[mode]}
          </span>
        )}
      </div>

      {facts.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500">{facts.join(" · ")}</p>
      )}

      {basis === "trend" && suggested_kcal != null && (
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{suggested_kcal} kcal</p>
          <span className="text-sm text-gray-400 dark:text-gray-500">föreslaget mål · nuvarande {current_target}</span>
        </div>
      )}

      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{reasoning}</p>

      {showApply && (
        applied ? (
          <p className="flex items-center gap-1.5 text-sm text-green-500 dark:text-green-400 font-medium">
            <Check size={16} /> Nytt kalorimål sparat
          </p>
        ) : (
          <PressableButton
            onClick={handleApply}
            disabled={applying}
            className="self-start bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {applying ? "Sparar…" : "Använd som mål"}
          </PressableButton>
        )
      )}
    </div>
  )
}
