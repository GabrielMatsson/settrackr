"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { getCurrentUserEmail, getFriends, getLogs } from "@/lib/api"
import { StatisticsContext, WorkoutLog } from "./StatisticsContext"

type FriendEntry = { id: number; status: string; friend: { id: number; name: string | null; email: string } }

const tabs = [
  { label: "Översikt", href: "/dashboard/statistics" },
  { label: "Historik", href: "/dashboard/statistics/history" },
  { label: "Mål", href: "/dashboard/statistics/goals" },
  { label: "Jämför", href: "/dashboard/statistics/compare" },
]

export default function StatisticsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [friends, setFriends] = useState<{ id: number; name: string | null; email: string }[]>([])
  const [currentUserEmail, setCurrentUserEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    <StatisticsContext.Provider value={{ logs, friends, currentUserEmail, loading, error, handleDelete, handleUpdate }}>
      <div className="max-w-lg mx-auto w-full flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistik</h1>

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

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {children}
      </div>
    </StatisticsContext.Provider>
  )
}
