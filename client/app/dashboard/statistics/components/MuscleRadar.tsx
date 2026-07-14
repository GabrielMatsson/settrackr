"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Tooltip, ResponsiveContainer,
} from "recharts"
import { useStatistics } from "./StatisticsContext"
import type { WorkoutLog } from "./StatisticsContext"
import { getExerciseMuscles } from "@/lib/api"
import { musclesForExerciseWithOverrides, type Muscle, type MuscleOverride } from "@/lib/muscle-map"

// Six spokes = a readable hexagon. Each exercise credits its sets once per
// group it touches (a squat counts once toward Ben, not per leg muscle), so the
// web shows honest push/pull/legs balance rather than favouring groups that
// happen to span more individual muscles.
const RADAR_GROUPS: { label: string; muscles: Muscle[] }[] = [
  { label: "Bröst", muscles: ["chest"] },
  { label: "Rygg", muscles: ["lats", "traps", "lowerBack"] },
  { label: "Axlar", muscles: ["frontDelts", "backDelts"] },
  { label: "Armar", muscles: ["biceps", "triceps", "forearms"] },
  { label: "Ben", muscles: ["quads", "hamstrings", "glutes", "calves"] },
  { label: "Mage", muscles: ["abs", "obliques"] },
]

const tooltipStyle = {
  backgroundColor: "#111827",
  border: "1px solid #1f2937",
  borderRadius: 8,
  fontSize: 12,
  color: "#fff",
}

export default function MuscleRadar({ logs }: { logs: WorkoutLog[] }) {
  const { period } = useStatistics()
  const [overrides, setOverrides] = useState<MuscleOverride[]>([])

  useEffect(() => {
    getExerciseMuscles()
      .then((data) => setOverrides(data as MuscleOverride[]))
      .catch(() => {})
  }, [])

  const data = useMemo(() => {
    const overridesMap: Record<string, Muscle[]> = {}
    for (const o of overrides) overridesMap[o.name.trim().toLowerCase()] = o.muscles

    const now = new Date()
    const toStr = now.toISOString().slice(0, 10)
    const from = new Date(now)
    from.setDate(from.getDate() - period)
    const fromStr = from.toISOString().slice(0, 10)

    const groupSets: Record<string, number> = {}
    for (const g of RADAR_GROUPS) groupSets[g.label] = 0

    for (const log of logs) {
      if (log.date < fromStr || log.date > toStr) continue
      for (const ex of log.exercises) {
        const muscles = musclesForExerciseWithOverrides(ex.name, overridesMap)
        if (muscles.length === 0) continue
        for (const g of RADAR_GROUPS) {
          if (g.muscles.some((m) => muscles.includes(m))) groupSets[g.label] += ex.sets
        }
      }
    }

    return RADAR_GROUPS.map((g) => ({ group: g.label, sets: groupSets[g.label] }))
  }, [logs, overrides, period])

  const total = data.reduce((s, d) => s + d.sets, 0)

  // Highlight the extremes so the balance read has a takeaway.
  const trained = data.filter((d) => d.sets > 0)
  const most = trained.length > 0 ? trained.reduce((a, b) => (b.sets > a.sets ? b : a)) : null
  const least = trained.length > 0 ? data.reduce((a, b) => (b.sets < a.sets ? b : a)) : null

  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card p-5 flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-gray-900 dark:text-white font-semibold">Muskelbalans</p>
        <span className="text-xs text-gray-400 dark:text-gray-500">Set per grupp · {period} dagar</span>
      </div>

      {total === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
          Inga övningar loggade i perioden
        </p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={data} outerRadius="70%">
              <PolarGrid stroke="var(--color-grid)" />
              <PolarAngleAxis dataKey="group" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <PolarRadiusAxis tick={false} axisLine={false} tickCount={4} />
              <Radar
                dataKey="sets"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.35}
                dot={{ r: 3, fill: "#6366f1" }}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} set`, "Volym"]} />
            </RadarChart>
          </ResponsiveContainer>

          {most && least && most.group !== least.group && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Mest: <span className="text-gray-700 dark:text-gray-200 font-medium">{most.group}</span>
              {" · "}
              Minst: <span className="text-gray-700 dark:text-gray-200 font-medium">{least.group}</span>
            </p>
          )}
        </>
      )}
    </div>
  )
}
