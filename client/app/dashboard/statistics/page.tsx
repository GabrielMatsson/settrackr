"use client"

import { useState, useEffect, useRef } from "react"
import { getLogs } from "@/lib/api"
import LogCard from "./components/LogCard"
import WorkoutOverview from "./components/WorkoutOverview"
import MyGoals from "./components/MyGoals"

type ExerciseLog = {
  name: string
  sets: number
  reps: number
  weight: number
  difficulty: string
  done: boolean
}

type WorkoutLog = {
  id: number
  date: string
  plan_name: string
  exercises: ExerciseLog[]
}

export default function StatisticsPage() {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [error, setError] = useState<string | null>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  useEffect(() => {
    getLogs()
      .then(setLogs)
      .catch(() => setError("Kunde inte hämta träningshistorik"))
  }, [])

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

  function handleDelete(id: number) {
    const updated = []
    for (let i = 0; i < logs.length; i++) {
      if (logs[i].id !== id) updated.push(logs[i])
    }
    setLogs(updated)
  }

  function handleUpdate(updated: WorkoutLog) {
    const newLogs = [...logs]
    for (let i = 0; i < newLogs.length; i++) {
      if (newLogs[i].id === updated.id) {
        newLogs[i] = updated
        break
      }
    }
    setLogs(newLogs)
  }

  const sorted = [...logs].sort((a, b) => (a.date < b.date ? 1 : -1))

  const cards = []
  for (let i = 0; i < sorted.length; i++) {
    cards.push(
      <LogCard
        key={sorted[i].id}
        log={sorted[i]}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-lg mx-auto w-full flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-white">Statistik</h1>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <WorkoutOverview logs={logs} />
        <MyGoals logs={logs} />
      </div>
      <div className="flex flex-col gap-2 max-w-3xl mx-auto w-full">
        <p className="text-gray-400">Historik av dina tidigare träningspass</p>
        {logs.length === 0 && !error && (
          <p className="text-gray-500">Inga loggade pass ännu.</p>
        )}
      </div>
      <div
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        className="flex gap-4 overflow-x-auto pb-4 cursor-grab active:cursor-grabbing select-none no-scrollbar max-w-3xl mx-auto w-full"
      >
        {cards}
      </div>
    </div>
  )
}

