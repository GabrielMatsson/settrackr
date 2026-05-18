"use client"

import { useState, useEffect, useRef } from "react"
import { getApiToken, getFriendPlans, copyFriendPlan } from "@/lib/api"
import WorkoutOverview from "../../statistics/components/WorkoutOverview"
import LogReactions from "./LogReactions"

const API_URL = "http://localhost:8000"

type ExerciseLog = {
  name: string
  sets: number
  reps: number
  weight: number
  difficulty: string
  done: boolean
}

type CommentAuthor = { id: number; name: string | null; email: string }
type Comment = { id: number; body: string; created_at: string; author: CommentAuthor }

type WorkoutLog = {
  id: number
  date: string
  plan_name: string
  exercises: ExerciseLog[]
  reaction_count: number
  liked_by_me: boolean
  comments: Comment[]
}

type FriendPlan = {
  id: number
  name: string
  exercises: { id: number; name: string; sets: number; reps: number }[]
}

type Friend = {
  id: number
  name: string | null
  email: string
}

type Props = {
  friend: Friend
  onBack: () => void
  currentUserEmail: string
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  if (difficulty === "easy") return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-600 text-white">Lätt</span>
  if (difficulty === "medium") return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500 text-gray-900">Medium</span>
  return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-600 text-white">Tufft</span>
}

export default function FriendProfile({ friend, onBack, currentUserEmail }: Props) {

  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<FriendPlan[]>([])
  const [copiedPlanId, setCopiedPlanId] = useState<number | null>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  useEffect(() => {
    getFriendPlans(friend.id).then(setPlans).catch(() => {})
  }, [friend.id])

  async function handleCopyPlan(planId: number) {
    try {
      await copyFriendPlan(friend.id, planId)
      setCopiedPlanId(planId)
      setTimeout(() => setCopiedPlanId(null), 2500)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    let mounted = true
    let es: EventSource | null = null

    getApiToken().then((token) => {
      if (!mounted) return
      es = new EventSource(`${API_URL}/friends/${friend.id}/stream?token=${token}`)

      es.onmessage = (e) => {
        const data = JSON.parse(e.data)
        if (data.error) {
          setError("Ni är inte längre vänner")
          es?.close()
        } else {
          setLogs(data)
          setLoading(false)
        }
      }

      es.onerror = () => { setError("Anslutningen bröts"); setLoading(false) }
    })

    return () => {
      mounted = false
      es?.close()
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
        <div key={j} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 last:border-0">
          <div className="flex flex-col gap-1">
            <span className="text-gray-900 dark:text-white text-sm font-medium">{ex.name}</span>
            <span className="text-gray-500 dark:text-gray-400 text-xs">{ex.sets} set × {ex.reps} reps · {ex.weight} kg</span>
          </div>
          <DifficultyBadge difficulty={ex.difficulty} />
        </div>
      )
    }
    cards.push(
      <div key={log.id} className="min-w-72 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex flex-col gap-3 shrink-0">
        <div>
          <p className="text-gray-900 dark:text-white font-semibold">{log.plan_name}</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">{log.date}</p>
        </div>
        <div className="flex flex-col">{exercises}</div>
        <LogReactions
          logId={log.id}
          initialCount={log.reaction_count ?? 0}
          initialLiked={log.liked_by_me ?? false}
          initialComments={log.comments ?? []}
          currentUserEmail={currentUserEmail}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">
          ← Tillbaka
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
            {(friend.name ?? friend.email)[0].toUpperCase()}
          </div>
          <div>
            <p className="text-gray-900 dark:text-white font-medium">{friend.name ?? friend.email}</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">{friend.email}</p>
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <WorkoutOverview logs={logs} />

      <div className="flex flex-col gap-2">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Träningshistorik</p>
        {loading && logs.length === 0 && <p className="text-gray-400 dark:text-gray-500 text-sm">Laddar…</p>}
        {!loading && logs.length === 0 && !error && <p className="text-gray-400 dark:text-gray-500 text-sm">Inga loggade pass ännu.</p>}
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

      {plans.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Träningsplaner</p>
          {plans.map((plan) => (
            <div key={plan.id} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-gray-900 dark:text-white font-semibold">{plan.name}</p>
                <button
                  onClick={() => handleCopyPlan(plan.id)}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {copiedPlanId === plan.id ? "Kopierad!" : "Kopiera till mina planer"}
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {plan.exercises.map((ex, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                    <span className="text-gray-900 dark:text-white">{ex.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">{ex.sets} set · {ex.reps} reps</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
