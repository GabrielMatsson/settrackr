"use client"

import { useState, useEffect, createElement } from "react"
import { ChevronDown } from "lucide-react"
import { getApiToken, getFriendPlans, copyFriendPlan, getFriendLevel } from "@/lib/api"
import { getOverallDifficulty, getTotalLyft, estimate1RM, getWorkoutIcon } from "@/lib/workout-utils"
import WorkoutOverview from "../../statistics/components/WorkoutOverview"
import DifficultyBadge from "@/app/components/DifficultyBadge"

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
  icon?: string
  exercises: ExerciseLog[]
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
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00")
  return {
    day: d.getDate(),
    month: d.toLocaleDateString("sv-SE", { month: "short" }).replace(".", ""),
    year: d.getFullYear(),
    weekday: d.toLocaleDateString("sv-SE", { weekday: "short" }).replace(".", ""),
  }
}


function FriendLogRow({ log }: { log: WorkoutLog }) {
  const [expanded, setExpanded] = useState(false)
  const { day, month, year, weekday } = formatDate(log.date)
  const difficulty = getOverallDifficulty(log.exercises)
  const totalLyft = getTotalLyft(log.exercises)
  const exerciseNames = log.exercises.map((e) => e.name).join(" · ")
  const workoutIcon = getWorkoutIcon(log.icon)

  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl">
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex flex-col items-center w-12 shrink-0 text-center">
          <span className="text-xl font-bold text-gray-900 dark:text-white leading-none">{day}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">{month}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{year}</span>
          <span className="text-xs text-gray-300 dark:text-gray-600 capitalize mt-0.5">{weekday}</span>
        </div>

        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-100 dark:bg-indigo-900/40">
          {createElement(workoutIcon, { size: 18, className: "text-indigo-600 dark:text-indigo-400" })}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-gray-900 dark:text-white font-semibold text-sm leading-tight">{log.plan_name}</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5 truncate">{exerciseNames}</p>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <span className="text-xs text-gray-400 dark:text-gray-500">Total lyft</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{totalLyft}</span>
        </div>

        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${difficulty.className}`}>
          {difficulty.label}
        </span>

        <ChevronDown
          size={15}
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </div>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Övningar</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">Set</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">Reps</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">Vikt</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">1RM (est.)</th>
                <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {log.exercises.map((ex, i) => (
                <tr key={i}>
                  <td className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">{ex.name}</td>
                  <td className="px-3 py-3 text-center text-sm text-gray-600 dark:text-gray-400">{ex.sets}</td>
                  <td className="px-3 py-3 text-center text-sm text-gray-600 dark:text-gray-400">{ex.reps}</td>
                  <td className="px-3 py-3 text-center text-sm text-gray-600 dark:text-gray-400">{ex.weight} kg</td>
                  <td className="px-3 py-3 text-center text-sm text-gray-600 dark:text-gray-400">{estimate1RM(ex.weight, ex.reps)}</td>
                  <td className="px-5 py-3 text-right"><DifficultyBadge difficulty={ex.difficulty} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FriendPlanRow({ plan, copiedPlanId, onCopy }: {
  plan: FriendPlan
  copiedPlanId: number | null
  onCopy: (planId: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const planIcon = getWorkoutIcon()
  return (
    <div>
      <div
        className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
          {createElement(planIcon, { size: 15, className: "text-indigo-500" })}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 dark:text-white font-medium text-sm">{plan.name}</p>
        </div>
        <span className="text-gray-400 dark:text-gray-500 text-sm shrink-0">{plan.exercises.length} övningar</span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`}
        />
      </div>

      {expanded && (
        <div className="px-5 pb-4 pt-3 flex flex-col gap-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
          <div className="flex flex-col gap-1.5">
            {plan.exercises.map((ex, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-100 dark:border-gray-700"
              >
                <span className="text-gray-900 dark:text-white">{ex.name}</span>
                <span className="text-gray-400 dark:text-gray-500">{ex.sets} set · {ex.reps} reps</span>
              </div>
            ))}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onCopy(plan.id) }}
            className="self-start bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            {copiedPlanId === plan.id ? "Kopierad!" : "Kopiera till mina planer"}
          </button>
        </div>
      )}
    </div>
  )
}

export default function FriendProfile({ friend, onBack }: Props) {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<FriendPlan[]>([])
  const [copiedPlanId, setCopiedPlanId] = useState<number | null>(null)
  const [friendLevel, setFriendLevel] = useState<{ level: number; title: string } | null>(null)

  useEffect(() => {
    getFriendPlans(friend.id).then(setPlans).catch(() => {})
    getFriendLevel(friend.id)
      .then((l) => {
        setFriendLevel(l as { level: number; title: string })
      })
      .catch(() => {})
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

  const sorted = [...logs].sort((a, b) => (a.date < b.date ? 1 : -1))

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
          {friendLevel && (
            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium px-2.5 py-1 rounded-full">
              Nivå {friendLevel.level} · {friendLevel.title}
            </span>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}

      <WorkoutOverview logs={logs} />

      <div className="flex flex-col gap-2">
        <p className="text-gray-900 dark:text-white font-semibold">Träningshistorik</p>
        {loading && logs.length === 0 && <p className="text-gray-400 dark:text-gray-500 text-sm">Laddar…</p>}
        {!loading && logs.length === 0 && !error && <p className="text-gray-400 dark:text-gray-500 text-sm">Inga loggade pass ännu.</p>}
        {sorted.map((log) => (
          <FriendLogRow key={log.id} log={log} />
        ))}
      </div>

      {plans.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-gray-900 dark:text-white font-semibold">Träningsplaner</p>
          <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-950">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {plans.map((plan) => (
                <FriendPlanRow
                  key={plan.id}
                  plan={plan}
                  copiedPlanId={copiedPlanId}
                  onCopy={handleCopyPlan}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
