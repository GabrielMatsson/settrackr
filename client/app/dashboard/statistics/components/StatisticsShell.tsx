"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar } from "lucide-react"
import { getCurrentUserEmail, getFriends, getLogs } from "@/lib/api"
import { StatisticsContext, WorkoutLog } from "./StatisticsContext"

type FriendEntry = { id: number; status: string; friend: { id: number; name: string | null; email: string } }

const tabs = [
  { label: "Översikt", href: "/dashboard/statistics" },
  { label: "Historik", href: "/dashboard/statistics/history" },
]

export default function StatisticsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [friends, setFriends] = useState<{ id: number; name: string | null; email: string }[]>([])
  const [currentUserEmail, setCurrentUserEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<7 | 30 | 90>(30)

  useEffect(() => {
    getCurrentUserEmail().then(setCurrentUserEmail).catch(() => {})
    getLogs()
      .then((data) => { setLogs(data); setLoading(false) })
      .catch(() => { setError("Kunde inte hämta träningshistorik"); setLoading(false) })
    getFriends()
      .then((data: FriendEntry[]) => setFriends(data.map((f) => f.friend)))
      .catch(() => {})
  }, [])

  function handleDelete(id: number) {
    setLogs((prev) => prev.filter((l) => l.id !== id))
  }

  function handleUpdate(updated: WorkoutLog) {
    setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
  }

  return (
    <StatisticsContext.Provider value={{ logs, friends, currentUserEmail, loading, error, period, handleDelete, handleUpdate }}>
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistik</h1>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            {tabs.map(({ label, href }) => {
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
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5">
              <Calendar size={14} className="text-gray-500 dark:text-gray-400 shrink-0" />
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value) as 7 | 30 | 90)}
                className="bg-transparent text-gray-900 dark:text-white text-sm focus:outline-none"
              >
                <option value={7}>Senaste 7 dagarna</option>
                <option value={30}>Senaste 30 dagarna</option>
                <option value={90}>Senaste 90 dagarna</option>
              </select>
            </div>
          )}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {children}
      </div>
    </StatisticsContext.Provider>
  )
}
