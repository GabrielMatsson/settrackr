"use client"

import { useEffect, useState } from "react"
import { Pencil, X, ChevronDown, ChevronRight } from "lucide-react"
import { useStatistics } from "./StatisticsContext"
import type { WorkoutLog } from "./StatisticsContext"
import { getExerciseMuscles, deleteExerciseMuscle } from "@/lib/api"
import { musclesForExerciseWithOverrides, MUSCLE_LABELS, type Muscle, type MuscleOverride } from "@/lib/muscle-map"
import MuscleBody from "./MuscleBody"
import MuscleAssignModal from "./MuscleAssignModal"

// Legend swatches — same 5-step indigo scale as MuscleBody / WorkoutHeatmap.
const LEGEND_CLASSES = [
  "bg-gray-200 dark:bg-gray-800",
  "bg-indigo-200 dark:bg-indigo-900",
  "bg-indigo-300 dark:bg-indigo-700",
  "bg-indigo-400 dark:bg-indigo-600",
  "bg-indigo-600 dark:bg-indigo-400",
]

export default function MuscleHeatmap({ logs }: { logs: WorkoutLog[] }) {
  const { period } = useStatistics()
  const [overrides, setOverrides] = useState<MuscleOverride[]>([])
  const [editing, setEditing] = useState<{ name: string; initial: Muscle[] } | null>(null)
  const [overridesOpen, setOverridesOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true
    return localStorage.getItem("settrackr_overrides_open") !== "closed"
  })

  function toggleOverrides() {
    setOverridesOpen((prev) => {
      const next = !prev
      localStorage.setItem("settrackr_overrides_open", next ? "open" : "closed")
      return next
    })
  }

  function loadOverrides() {
    getExerciseMuscles()
      .then((data) => setOverrides(data as MuscleOverride[]))
      .catch(() => {})
  }

  useEffect(() => {
    loadOverrides()
  }, [])

  const overridesMap: Record<string, Muscle[]> = {}
  for (const o of overrides) overridesMap[o.name.trim().toLowerCase()] = o.muscles

  const now = new Date()
  const toStr = now.toISOString().slice(0, 10)
  const from = new Date(now)
  from.setDate(from.getDate() - period)
  const fromStr = from.toISOString().slice(0, 10)

  // Accumulate sets per muscle over the selected period. Sets (not volume) so
  // bodyweight moves (pull-ups, planks) still register — the standard
  // "weekly sets per muscle" metric.
  const setsByMuscle: Partial<Record<Muscle, number>> = {}
  const unmatched = new Set<string>()
  for (const log of logs) {
    if (log.date < fromStr || log.date > toStr) continue
    for (const ex of log.exercises) {
      const muscles = musclesForExerciseWithOverrides(ex.name, overridesMap)
      if (muscles.length === 0) {
        if (ex.name.trim()) unmatched.add(ex.name.trim())
        continue
      }
      for (const m of muscles) setsByMuscle[m] = (setsByMuscle[m] ?? 0) + ex.sets
    }
  }

  const maxSets = Math.max(0, ...Object.values(setsByMuscle))
  const levels: Partial<Record<Muscle, number>> = {}
  for (const [m, sets] of Object.entries(setsByMuscle) as [Muscle, number][]) {
    levels[m] = sets === 0 || maxSets === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((sets / maxSets) * 4)))
  }

  const hasData = Object.keys(setsByMuscle).length > 0
  const labelFor = (m: Muscle) => `${MUSCLE_LABELS[m]} · ${setsByMuscle[m] ?? 0} set`

  async function removeOverride(id: number) {
    try {
      await deleteExerciseMuscle(id)
      loadOverrides()
    } catch {}
  }

  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card p-5 flex flex-col gap-4">
      <p className="text-gray-900 dark:text-white font-semibold">Muskelkarta</p>

      {!hasData && (
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">
          Inga övningar loggade i perioden
        </p>
      )}

      <div className="flex justify-center gap-6 flex-wrap">
        {(["front", "back"] as const).map((view) => (
          <div key={view} className="flex flex-col items-center gap-1">
            <MuscleBody view={view} levels={levels} labelFor={labelFor} />
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {view === "front" ? "Framsida" : "Baksida"}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-1.5">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">Mindre</span>
        {LEGEND_CLASSES.map((cls, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
        ))}
        <span className="text-[10px] text-gray-400 dark:text-gray-500">Mer</span>
      </div>

      {unmatched.size > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-gray-100 dark:border-gray-800 pt-3">
          <span className="text-xs text-gray-400 dark:text-gray-500">Ej kategoriserade — tryck för att tilldela muskler</span>
          <div className="flex flex-wrap gap-1.5">
            {[...unmatched].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setEditing({ name, initial: [] })}
                className="text-xs px-2.5 py-1 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
              >
                + {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {overrides.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-gray-100 dark:border-gray-800 pt-3">
          <button
            type="button"
            onClick={toggleOverrides}
            className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors self-start"
          >
            {overridesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Anpassade muskler ({overrides.length})
          </button>
          {overridesOpen && (
          <div className="flex flex-col gap-1">
            {overrides.map((o) => (
              <div key={o.id} className="flex items-center gap-2 text-sm">
                <span className="text-gray-700 dark:text-gray-300 shrink-0">{o.name}</span>
                <span className="text-gray-400 dark:text-gray-500 text-xs truncate flex-1">
                  {o.muscles.map((m) => MUSCLE_LABELS[m]).join(", ")}
                </span>
                <button
                  type="button"
                  onClick={() => setEditing({ name: o.name, initial: o.muscles })}
                  className="text-gray-400 dark:text-gray-500 hover:text-indigo-500 transition-colors shrink-0"
                  aria-label="Ändra"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => removeOverride(o.id)}
                  className="text-gray-400 dark:text-gray-500 hover:text-red-400 transition-colors shrink-0"
                  aria-label="Ta bort"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {editing && (
        <MuscleAssignModal
          name={editing.name}
          initial={editing.initial}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); loadOverrides() }}
        />
      )}
    </div>
  )
}
