"use client"

import { useRef } from "react"
import { useStatistics } from "../components/StatisticsContext"
import LogCard from "../components/LogCard"

export default function HistoryPage() {
  const { logs, currentUserEmail, loading, handleDelete, handleUpdate } = useStatistics()
  const sliderRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  function handleMouseDown(e: React.MouseEvent) {
    isDragging.current = true
    startX.current = e.pageX - (sliderRef.current?.offsetLeft ?? 0)
    scrollLeft.current = sliderRef.current?.scrollLeft ?? 0
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging.current) return
    e.preventDefault()
    const x = e.pageX - (sliderRef.current?.offsetLeft ?? 0)
    const walk = x - startX.current
    if (sliderRef.current) sliderRef.current.scrollLeft = scrollLeft.current - walk
  }

  function stopDragging() {
    isDragging.current = false
  }

  const sorted = [...logs].sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <div className="flex flex-col gap-4">
      <p className="text-gray-500 dark:text-gray-400 text-sm">Historik av dina tidigare träningspass</p>
      {loading && logs.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm">Laddar…</p>
      )}
      {!loading && logs.length === 0 && (
        <p className="text-gray-400 dark:text-gray-500 text-sm">Inga loggade pass ännu.</p>
      )}
      <div
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        className="flex gap-4 overflow-x-auto pb-4 cursor-grab active:cursor-grabbing select-none no-scrollbar"
      >
        {sorted.map((log) => (
          <LogCard
            key={log.id}
            log={log}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            currentUserEmail={currentUserEmail}
          />
        ))}
      </div>
    </div>
  )
}
