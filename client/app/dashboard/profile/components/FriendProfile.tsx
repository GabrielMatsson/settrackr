"use client"

import { useState, useEffect, useRef } from "react"
import { getApiToken } from "@/lib/api"
import WorkoutOverview from "../../statistics/components/WorkoutOverview"

const API_URL = "http://localhost:8000"

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

type Friend = {
  id: number
  name: string | null
  email: string
}

type Props = {
  friend: Friend
  onBack: () => void
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  if (difficulty === "easy") return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-600 text-white">Lätt</span>
  if (difficulty === "medium") return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500 text-gray-900">Medium</span>
  return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-600 text-white">Tufft</span>
}

export default function FriendProfile({ friend, onBack }: Props) {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [error, setError] = useState<string | null>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  useEffect(() => {
    let es: EventSource

    getApiToken().then((token) => {
      es = new EventSource(`${API_URL}/friends/${friend.id}/stream?token=${token}`)

      es.onmessage = (e) => {
        const data = JSON.parse(e.data)
        if (data.error) {
          setError("Ni är inte längre vänner")
          es.close()
        } else {
          setLogs(data)
        }
      }

      es.onerror = () => setError("Anslutningen bröts")
    })

    return () => {
      if (es) es.close()
    }
  }, [friend.id])

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

  const cards = []
  for (let i = 0; i < sorted.length; i++) {
    const log = sorted[i]
    const exercises = []
    for (let j = 0; j < log.exercises.length; j++) {
      const ex = log.exercises[j]
      exercises.push(
        <div key={j} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
          <div className="flex flex-col gap-1">
            <span className="text-white text-sm font-medium">{ex.name}</span>
            <span className="text-gray-400 text-xs">{ex.sets} set × {ex.reps} reps · {ex.weight} kg</span>
          </div>
          <DifficultyBadge difficulty={ex.difficulty} />
        </div>
      )
    }
    cards.push(
      <div key={log.id} className="min-w-72 bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3 shrink-0">
        <div>
          <p className="text-white font-semibold">{log.plan_name}</p>
          <p className="text-gray-500 text-sm">{log.date}</p>
        </div>
        <div className="flex flex-col">{exercises}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors text-sm">
          ← Tillbaka
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
            {(friend.name ?? friend.email)[0].toUpperCase()}
          </div>
          <div>
            <p className="text-white font-medium">{friend.name ?? friend.email}</p>
            <p className="text-gray-500 text-xs">{friend.email}</p>
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <WorkoutOverview logs={logs} />

      <div className="flex flex-col gap-2">
        <p className="text-gray-400 text-sm">Träningshistorik</p>
        {logs.length === 0 && !error && (
          <p className="text-gray-500 text-sm">Inga loggade pass ännu.</p>
        )}
      </div>

      <div
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        className="flex gap-4 overflow-x-auto pb-4 cursor-grab active:cursor-grabbing select-none no-scrollbar"
      >
        {cards}
      </div>
    </div>
  )
}
