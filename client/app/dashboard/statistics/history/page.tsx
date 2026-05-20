"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { useStatistics } from "../components/StatisticsContext"
import LogCard from "../components/LogCard"

const PAGE = 10

export default function HistoryPage() {
  const { logs, currentUserEmail, loading, handleDelete, handleUpdate } = useStatistics()
  const [visible, setVisible] = useState(PAGE)

  const sorted = [...logs].sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <div className="flex flex-col gap-4">
      {loading && logs.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm">Laddar…</p>
      )}
      {!loading && logs.length === 0 && (
        <p className="text-gray-400 dark:text-gray-500 text-sm">Inga loggade pass ännu.</p>
      )}
      {sorted.length > 0 && (
        <div className="flex flex-col gap-2">
          {sorted.slice(0, visible).map((log) => (
            <LogCard
              key={log.id}
              log={log}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              currentUserEmail={currentUserEmail}
            />
          ))}
        </div>
      )}
      {visible < sorted.length && (
        <button
          onClick={() => setVisible((v) => v + PAGE)}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 transition-colors"
        >
          <ChevronDown size={15} /> Visa fler pass
        </button>
      )}
    </div>
  )
}
