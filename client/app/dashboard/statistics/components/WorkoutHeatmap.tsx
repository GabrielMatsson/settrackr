"use client"

import type { WorkoutLog } from "./StatisticsContext"

const WEEKS = 26

const LEVEL_CLASSES = [
  "bg-gray-100 dark:bg-gray-800",
  "bg-indigo-200 dark:bg-indigo-900",
  "bg-indigo-300 dark:bg-indigo-700",
  "bg-indigo-400 dark:bg-indigo-600",
  "bg-indigo-600 dark:bg-indigo-400",
]

const WEEKDAY_LABELS = ["Mån", "", "Ons", "", "Fre", "", ""]

function dayKey(d: Date): string {
  // Matches how logs are saved (new Date().toLocaleDateString("sv-SE")) → "YYYY-MM-DD"
  return d.toLocaleDateString("sv-SE")
}

type Cell = {
  key: string
  date: Date
  level: number
  count: number
  volume: number
  future: boolean
}

function buildCells(logs: WorkoutLog[]): { weeks: Cell[][]; monthLabels: string[] } {
  const volumeByDay: Record<string, number> = {}
  const countByDay: Record<string, number> = {}
  for (const log of logs) {
    const vol = log.exercises.reduce((s, e) => s + e.sets * e.reps * e.weight, 0)
    volumeByDay[log.date] = (volumeByDay[log.date] ?? 0) + vol
    countByDay[log.date] = (countByDay[log.date] ?? 0) + 1
  }
  const maxVol = Math.max(0, ...Object.values(volumeByDay))

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayIdx = (today.getDay() + 6) % 7 // 0 = Mon … 6 = Sun
  const start = new Date(today)
  start.setDate(today.getDate() - dayIdx - (WEEKS - 1) * 7)

  const weeks: Cell[][] = []
  const monthLabels: string[] = []
  let prevMonth = -1

  for (let w = 0; w < WEEKS; w++) {
    const col: Cell[] = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      const key = dayKey(date)
      const count = countByDay[key] ?? 0
      const volume = volumeByDay[key] ?? 0
      const future = date > today
      let level = 0
      if (!future && count > 0) {
        level = maxVol === 0 ? 1 : Math.min(4, Math.max(1, Math.ceil((volume / maxVol) * 4)))
      }
      col.push({ key, date, level, count, volume, future })
    }
    // Month label above a column when its Monday starts a new month
    const colMonth = col[0].date.getMonth()
    if (colMonth !== prevMonth) {
      monthLabels.push(col[0].date.toLocaleDateString("sv-SE", { month: "short" }))
      prevMonth = colMonth
    } else {
      monthLabels.push("")
    }
    weeks.push(col)
  }

  return { weeks, monthLabels }
}

function tooltip(c: Cell): string | undefined {
  if (c.future) return undefined
  if (c.count === 0) return `${c.key} · vila`
  if (c.volume <= 0) return `${c.key} · ${c.count} pass`
  return `${c.key} · ${c.count} pass · ${Math.round(c.volume).toLocaleString("sv-SE")} kg`
}

export default function WorkoutHeatmap({ logs }: { logs: WorkoutLog[] }) {
  const { weeks, monthLabels } = buildCells(logs)

  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card p-5 flex flex-col gap-4">
      <p className="text-gray-900 dark:text-white font-semibold">Träningskalender</p>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-1">
          {/* Weekday labels */}
          <div className="flex flex-col gap-1 pr-1">
            <div className="h-4" />
            {WEEKDAY_LABELS.map((lbl, i) => (
              <div key={i} className="h-3 text-[9px] leading-3 text-gray-400 dark:text-gray-500 whitespace-nowrap">
                {lbl}
              </div>
            ))}
          </div>

          {/* Month row + week columns */}
          <div className="flex flex-col gap-1">
            <div className="flex gap-1 h-4">
              {monthLabels.map((m, i) => (
                <div key={i} className="w-3 relative">
                  {m && (
                    <span className="absolute left-0 top-0 text-[9px] leading-4 text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {m}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((c) => (
                    <div
                      key={c.key}
                      title={tooltip(c)}
                      className={`w-3 h-3 rounded-sm transition-colors ${c.future ? "bg-transparent" : LEVEL_CLASSES[c.level]}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">Mindre</span>
        {LEVEL_CLASSES.map((cls, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
        ))}
        <span className="text-[10px] text-gray-400 dark:text-gray-500">Mer</span>
      </div>
    </div>
  )
}
