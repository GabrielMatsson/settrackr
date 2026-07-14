"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar } from "lucide-react"
import { getLogs, getMe, getWeightLogs } from "@/lib/api"
import { makeBodyweightResolver, effectiveWeight } from "@/lib/weight-utils"
import { StatisticsContext, WorkoutLog } from "./StatisticsContext"
import SheetSelect from "@/app/components/SheetSelect"

const tabs = [
  { label: "Översikt", href: "/dashboard/statistics" },
  { label: "Coach", href: "/dashboard/statistics/coach" },
  { label: "Historik", href: "/dashboard/statistics/history" },
]

const COACH_HREF = "/dashboard/statistics/coach"

function decorateLogs(logs: WorkoutLog[], resolve: (d: string) => number | null): WorkoutLog[] {
  return logs.map((log) => ({
    ...log,
    exercises: log.exercises.map((ex) => ({
      ...ex,
      effective_weight: effectiveWeight(ex, log.date, resolve),
    })),
  }))
}

export default function StatisticsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<7 | 30 | 90>(30)
  // Coach defaults on; hide its tab only once we learn it's off (no flash).
  const [coachEnabled, setCoachEnabled] = useState(true)
  const [resolveBodyweight, setResolveBodyweight] = useState<(d: string) => number | null>(() => () => null)

  useEffect(() => {
    // Body weight entries turn bodyweight-flagged sets into effective load
    // (body weight at the log's date + extra kg). Missing data => no-op resolver.
    Promise.all([
      getLogs(),
      getWeightLogs().catch(() => []),
    ])
      .then(([logData, weightEntries]) => {
        const resolve = makeBodyweightResolver(weightEntries)
        setResolveBodyweight(() => resolve)
        setLogs(decorateLogs(logData, resolve))
        setLoading(false)
      })
      .catch(() => { setError("Kunde inte hämta träningshistorik"); setLoading(false) })
    getMe().then((p) => setCoachEnabled(p.show_training_coach !== false)).catch(() => {})
  }, [])

  const visibleTabs = tabs.filter((t) => coachEnabled || t.href !== COACH_HREF)
  const coachDisabledHere = !coachEnabled && pathname.startsWith(COACH_HREF)

  function handleDelete(id: number) {
    setLogs((prev) => prev.filter((l) => l.id !== id))
  }

  function handleUpdate(updated: WorkoutLog) {
    const [decorated] = decorateLogs([updated], resolveBodyweight)
    setLogs((prev) => prev.map((l) => (l.id === updated.id ? decorated : l)))
  }

  return (
    <StatisticsContext.Provider value={{ logs, loading, error, period, handleDelete, handleUpdate }}>
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistik</h1>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            {visibleTabs.map(({ label, href }) => {
              const isActive = href === "/dashboard/statistics"
                ? pathname === href
                : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={
                    isActive
                      ? "bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  }
                >
                  {label}
                </Link>
              )
            })}
          </div>
          {pathname === "/dashboard/statistics" && (
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5">
              <Calendar size={14} className="text-gray-500 dark:text-gray-400 shrink-0" />
              <SheetSelect
                value={period}
                options={[
                  { value: 7, label: "Senaste 7 dagarna" },
                  { value: 30, label: "Senaste 30 dagarna" },
                  { value: 90, label: "Senaste 90 dagarna" },
                ]}
                onChange={(v) => setPeriod(v as 7 | 30 | 90)}
                ariaLabel="Tidsperiod"
                triggerClassName="flex items-center gap-1 bg-transparent text-gray-900 dark:text-white text-sm focus:outline-none"
              />
            </div>
          )}
        </div>

        {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}

        {coachDisabledHere ? (
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Träningscoach är avstängd.</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Slå på den igen under Profil → Inställningar → Funktioner.</p>
          </div>
        ) : (
          children
        )}
      </div>
    </StatisticsContext.Provider>
  )
}
