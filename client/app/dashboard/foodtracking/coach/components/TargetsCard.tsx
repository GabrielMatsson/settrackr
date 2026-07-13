"use client"

import { Beef, Flame, Target, Zap } from "lucide-react"
import AnimatedNumber from "@/app/components/AnimatedNumber"
import { NutritionInsights, ProteinSignal, KcalSignal, GoalDirection } from "@/lib/api"

const PROTEIN_BADGE: Record<ProteinSignal, { label: string; cls: string }> = {
  good: { label: "I mål", cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-emerald-600/20" },
  low: { label: "Något under", cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 ring-amber-600/20" },
  poor: { label: "Under mål", cls: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 ring-rose-600/20" },
  none: { label: "Ingen data", cls: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 ring-gray-500/20" },
}

const KCAL_BADGE: Record<KcalSignal, { label: string; cls: string }> = {
  good: { label: "Under mål", cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-emerald-600/20" },
  slightly_over: { label: "Något över", cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 ring-amber-600/20" },
  over: { label: "Över mål", cls: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 ring-rose-600/20" },
  slightly_under: { label: "Något under", cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 ring-amber-600/20" },
  under: { label: "Under mål", cls: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 ring-rose-600/20" },
  well_under: { label: "Långt under mål", cls: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 ring-rose-600/20" },
  none: { label: "Ingen data", cls: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 ring-gray-500/20" },
}

// "good" reads differently per goal mode: on deff it means staying under the
// ceiling; on bulk/maintain it means hitting the target.
function kcalBadge(signal: KcalSignal, direction: GoalDirection) {
  if (signal === "good" && (direction === "surplus" || direction === "maintain")) {
    return { ...KCAL_BADGE.good, label: "I mål" }
  }
  return KCAL_BADGE[signal]
}

function Badge({ label, cls }: { label: string; cls: string }) {
  return <span className={`text-xs rounded-full px-2 py-0.5 ring-1 ring-inset ${cls}`}>{label}</span>
}

export default function TargetsCard({ protein, calories }: Pick<NutritionInsights, "protein" | "calories">) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Protein */}
      <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl shadow-card p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400">
              <Beef size={17} />
            </div>
            <p className="text-gray-900 dark:text-white font-semibold">Protein</p>
          </div>
          <Badge {...PROTEIN_BADGE[protein.signal]} />
        </div>

        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
            <AnimatedNumber value={protein.avg} /> g
          </p>
          <span className="text-sm text-gray-400 dark:text-gray-500">snitt/dag · mål {protein.target} g</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><Target size={13} className="text-teal-500 dark:text-teal-400" /> {protein.pct_days_on_target}% av dagarna i mål</span>
          {protein.streak > 0 && (
            <span className="flex items-center gap-1">
              <Zap size={13} className="text-teal-500 dark:text-teal-400" />
              <span className="text-teal-600 dark:text-teal-400 font-medium">{protein.streak} dagars svit</span>
            </span>
          )}
        </div>

        {protein.suggestion && <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{protein.suggestion}</p>}
      </div>

      {/* Calories */}
      <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl shadow-card p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <Flame size={17} />
            </div>
            <p className="text-gray-900 dark:text-white font-semibold">Kalorier</p>
          </div>
          <Badge {...kcalBadge(calories.signal, calories.direction)} />
        </div>

        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
            <AnimatedNumber value={calories.avg} /> kcal
          </p>
          <span className="text-sm text-gray-400 dark:text-gray-500">snitt/dag · mål {calories.target}</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><Target size={13} className="text-emerald-500 dark:text-emerald-400" /> {calories.pct_days_at_or_under}% av dagarna i mål</span>
          {calories.days_over > 0 && <span>{calories.days_over} av {calories.logged_days} dagar över</span>}
        </div>

        {calories.suggestion && <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{calories.suggestion}</p>}
      </div>
    </div>
  )
}
