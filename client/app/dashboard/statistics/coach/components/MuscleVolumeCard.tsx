"use client"

import { motion } from "motion/react"
import { Layers } from "lucide-react"
import { gentleSpring } from "@/lib/motion"
import { CoachMuscleVolume, VolumeSignal } from "@/lib/api"

// Band metadata. `label` carries the signal in text so identity never depends on
// color alone (colorblind-safe by construction). `bar` is the fill color.
const SIGNAL: Record<VolumeSignal, { label: string; bar: string; text: string }> = {
  none: { label: "Otränad", bar: "bg-gray-300 dark:bg-gray-700", text: "text-gray-400 dark:text-gray-500" },
  low: { label: "Låg volym", bar: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" },
  maintenance: { label: "Underhåll", bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  optimal: { label: "Optimalt", bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  high: { label: "Hög volym", bar: "bg-sky-500", text: "text-sky-600 dark:text-sky-400" },
}

// Full bar = 24 working sets/week (a bit above the ~20-set productive ceiling),
// so the optimal band lands in the upper-middle of the track.
const REF_MAX = 24

export default function MuscleVolumeCard({ volume, weeks }: { volume: CoachMuscleVolume[]; weeks: number }) {
  const trained = volume.filter((v) => v.avg_sets_per_week > 0)
  const untrained = volume.filter((v) => v.avg_sets_per_week <= 0)

  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
          <p className="text-gray-900 dark:text-white font-semibold">Veckovolym per muskel</p>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">set/vecka · snitt {weeks} v</span>
      </div>

      {trained.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm py-4 text-center">
          Ingen volym registrerad de senaste {weeks} veckorna.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {trained.map((v) => {
            const meta = SIGNAL[v.signal]
            const pct = Math.min(100, (v.avg_sets_per_week / REF_MAX) * 100)
            return (
              <li key={v.muscle} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-gray-700 dark:text-gray-200">{v.label}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-gray-900 dark:text-white font-medium tabular-nums">{v.avg_sets_per_week}</span>
                    <span className={`text-xs ${meta.text}`}>{meta.label}</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full origin-left ${meta.bar}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: pct / 100 }}
                    transition={gentleSpring}
                    style={{ width: "100%" }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {untrained.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3">
          Otränat de senaste {weeks} veckorna: {untrained.map((v) => v.label).join(", ")}.
        </p>
      )}
    </div>
  )
}
