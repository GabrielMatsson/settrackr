"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getLogs } from "@/lib/api"
import WorkoutOverview from "../statistics/components/WorkoutOverview"

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

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  if (difficulty === "easy") return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-600 text-white">Lätt</span>
  if (difficulty === "medium") return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500 text-gray-900">Medium</span>
  return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-600 text-white">Tufft</span>
}

function computeStreak(logs: WorkoutLog[]): number {
  const dates = new Set(logs.map((l) => l.date))
  const d = new Date()
  const todayStr = d.toISOString().slice(0, 10)
  if (!dates.has(todayStr)) d.setDate(d.getDate() - 1)
  let streak = 0
  while (true) {
    const str = d.toISOString().slice(0, 10)
    if (!dates.has(str)) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

function daysAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return "idag"
  if (diff === 1) return "igår"
  return `${diff} dagar sedan`
}

function workoutsThisWeek(logs: WorkoutLog[]): number {
  const now = new Date()
  const day = now.getDay() === 0 ? 6 : now.getDay() - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - day)
  const mondayStr = monday.toISOString().slice(0, 10)
  return new Set(logs.filter((l) => l.date >= mondayStr).map((l) => l.date)).size
}

const WEEKLY_TARGET = 3

function WeeklyRing({ count, target }: { count: number; target: number }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const percent = Math.min(count / target, 1)
  const offset = circumference * (1 - percent)
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 70 70">
          <circle cx="35" cy="35" r={radius} fill="none" stroke="#1f2937" strokeWidth="8" />
          <circle
            cx="35" cy="35" r={radius}
            fill="none" stroke="#6366f1" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-semibold text-xs">{count}/{target}</span>
        </div>
      </div>
      <p className="text-gray-400 text-xs">Veckostatus</p>
    </div>
  )
}

type Props = {
  name: string
}

export default function HomeClient({ name }: Props) {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const today = new Date().toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

  useEffect(() => {
    getLogs()
      .then((data) => { setLogs(data); setLoading(false) })
      .catch(() => { setError("Kunde inte hämta träningsdata"); setLoading(false) })
  }, [])

  const sorted = [...logs].sort((a, b) => (a.date < b.date ? 1 : -1))
  const lastLog = sorted[0] ?? null
  const streak = computeStreak(logs)
  const weekCount = workoutsThisWeek(logs)

  const exerciseRows = []
  if (lastLog) {
    for (let i = 0; i < lastLog.exercises.length; i++) {
      const ex = lastLog.exercises[i]
      exerciseRows.push(
        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
          <div className="flex flex-col gap-1">
            <span className="text-white text-sm font-medium">{ex.name}</span>
            <span className="text-gray-400 text-xs">{ex.sets} set × {ex.reps} reps · {ex.weight} kg</span>
          </div>
          <DifficultyBadge difficulty={ex.difficulty} />
        </div>
      )
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-lg mx-auto w-full">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Hej, {name.split(" ")[0]}</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-500">{todayCapitalized}</p>
            {streak > 0 && (
              <p className="text-orange-400 text-sm font-medium">{streak} dag{streak !== 1 ? "ar" : ""} streak 🔥</p>
            )}
          </div>
        </div>
        <button
          onClick={() => router.push("/dashboard/profile")}
          className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm hover:bg-indigo-500 transition-colors shrink-0 mt-1"
        >
          {name[0]?.toUpperCase() ?? "?"}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {loading && <p className="text-gray-500 text-sm">Laddar…</p>}

      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-3 flex-1">
          <button
            onClick={() => router.push("/dashboard/tracking")}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl p-4 text-left transition-colors"
          >
            <p className="text-lg mb-0.5">+</p>
            <p className="text-sm">Logga ett pass</p>
          </button>
          <button
            onClick={() => router.push("/dashboard/statistics")}
            className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-medium rounded-xl p-4 text-left transition-colors"
          >
            <p className="text-lg mb-0.5">&nbsp;</p>
            <p className="text-sm">Se statistik</p>
          </button>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-center">
          <WeeklyRing count={weekCount} target={WEEKLY_TARGET} />
        </div>
      </div>

      <WorkoutOverview logs={logs} defaultPeriod={7} />

      {lastLog && (
        <div className="flex flex-col gap-3">
          <p className="text-white font-semibold">Senaste passet</p>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
            <div>
              <p className="text-white font-medium">{lastLog.plan_name}</p>
              <p className="text-gray-500 text-sm">{lastLog.date} · {daysAgo(lastLog.date)}</p>
            </div>
            <div className="flex flex-col">{exerciseRows}</div>
          </div>
        </div>
      )}

      {logs.length === 0 && (
        <p className="text-gray-500 text-sm">Inga pass loggade ännu, tryck på Logga ett pass för att komma igång!</p>
      )}
    </div>
  )
}
