"use client"

import { useState, useEffect, useRef } from "react"
import { getApiToken, getCurrentUserEmail, getFriends } from "@/lib/api"
import LogCard from "./components/LogCard"
import WorkoutOverview from "./components/WorkoutOverview"
import MyGoals from "./components/MyGoals"
import ProgressCharts from "./components/ProgressCharts"
import CompareStats from "./components/CompareStats"

type Friend = { id: number; name: string | null; email: string }
type FriendEntry = { id: number; status: string; friend: Friend }

type ExerciseLog = {
  name: string
  sets: number
  reps: number
  weight: number
  difficulty: string
  done: boolean
}

type Comment = {
  id: number
  body: string
  created_at: string
  author: { id: number; name: string | null; email: string }
}

type WorkoutLog = {
  id: number
  date: string
  plan_name: string
  exercises: ExerciseLog[]
  reaction_count?: number
  comments?: Comment[]
}

export default function StatisticsPage() {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [currentUserEmail, setCurrentUserEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let es: EventSource | null = null

    getCurrentUserEmail().then(setCurrentUserEmail).catch(() => {})

    getApiToken().then((token) => {
      es = new EventSource(`http://localhost:8000/logs/stream?token=${token}`)
      es.onmessage = (e: MessageEvent) => {
        try {
          setLogs(JSON.parse(e.data))
          setLoading(false)
        } catch {}
      }
      es.onerror = () => { setError("Kunde inte hämta träningshistorik"); setLoading(false) }
    })

    getFriends()
      .then((data: FriendEntry[]) => setFriends(data.map((f) => f.friend)))
      .catch(() => {})

    return () => { es?.close() }
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
        currentUserEmail={currentUserEmail}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-lg mx-auto w-full flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-white">Statistik</h1>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {loading && <p className="text-gray-500 text-sm">Laddar…</p>}
        <WorkoutOverview logs={logs} />
        <MyGoals logs={logs} />
        <ProgressCharts logs={logs} />
        <CompareStats myLogs={logs} friends={friends} />
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

