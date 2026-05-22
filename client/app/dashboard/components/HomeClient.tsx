"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Flame } from "lucide-react"
import { getLogs, getMe, getMyLevel } from "@/lib/api"
import { getOverallDifficulty, getTotalLyft, estimate1RM, getWorkoutIcon } from "@/lib/workout-utils"
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
  icon?: string
  exercises: ExerciseLog[]
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  if (difficulty === "easy") return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Lätt</span>
  if (difficulty === "hard") return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Tufft</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Medium</span>
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

function WeeklyRing({ count, target }: { count: number; target: number }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const percent = Math.min(count / target, 1)
  const offset = circumference * (1 - percent)
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 70 70">
          <circle cx="35" cy="35" r={radius} fill="none" stroke="var(--ring-track)" strokeWidth="8" />
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
          <span className="text-gray-900 dark:text-white font-semibold text-xs">{count}/{target}</span>
        </div>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-xs">Veckostatus</p>
    </div>
  )
}

type Props = {
  name: string
}

export default function HomeClient({ name }: Props) {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [weeklyGoal, setWeeklyGoal] = useState(3)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [levelInfo, setLevelInfo] = useState<{ level: number; title: string; xp: number } | null>(null)
  const router = useRouter()

  const today = new Date().toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

  useEffect(() => {
    getLogs()
      .then((data) => { setLogs(data); setLoading(false) })
      .catch(() => { setError("Kunde inte hämta träningsdata"); setLoading(false) })
    getMe().then((p) => setWeeklyGoal(p.weekly_goal)).catch(() => {})
    getMyLevel().then((l) => setLevelInfo(l as { level: number; title: string; xp: number })).catch(() => {})
  }, [])

  const sorted = [...logs].sort((a, b) => (a.date < b.date ? 1 : -1))
  const lastLog = sorted[0] ?? null
  const streak = computeStreak(logs)
  const weekCount = workoutsThisWeek(logs)

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hej, {name.split(" ")[0]}</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-400 dark:text-gray-500">{todayCapitalized}</p>
            {streak > 0 && (
              <p className="flex items-center gap-1 text-orange-400 text-sm font-medium"><Flame size={14} className="shrink-0" />{streak} dag{streak !== 1 ? "ar" : ""} streak</p>
            )}
          </div>
          {levelInfo && (
            <p className="text-indigo-500 dark:text-indigo-400 text-sm font-medium mt-1">
              Nivå {levelInfo.level} · {levelInfo.title} · {levelInfo.xp} XP
            </p>
          )}
        </div>
        <button
          onClick={() => router.push("/dashboard/profile")}
          className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm hover:bg-indigo-500 transition-colors shrink-0 mt-1"
        >
          {name[0]?.toUpperCase() ?? "?"}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {loading && <p className="text-gray-400 dark:text-gray-500 text-sm">Laddar…</p>}

      <div className="flex items-stretch gap-4">
        <button
          onClick={() => router.push("/dashboard/tracking")}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-2xl p-6 text-left transition-colors flex flex-col justify-between min-h-[120px]"
        >
          <p className="text-xl font-bold">Logga ett pass</p>
          <p className="text-indigo-200 text-sm mt-1">Håll koll på din träning och dina framsteg</p>
          <span className="mt-4 inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors text-white text-sm font-medium px-4 py-1.5 rounded-lg self-start">
            + Nytt pass
          </span>
        </button>
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex items-center justify-center shrink-0">
          <WeeklyRing count={weekCount} target={weeklyGoal} />
        </div>
      </div>

      <WorkoutOverview logs={logs} />

      {lastLog && (() => {
        const difficulty = getOverallDifficulty(lastLog.exercises)
        const totalLyft = getTotalLyft(lastLog.exercises)
        const WorkoutIcon = getWorkoutIcon(lastLog.icon)
        return (
          <div className="flex flex-col gap-3">
            <p className="text-gray-900 dark:text-white font-semibold">Senaste passet</p>
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-100 dark:bg-indigo-900/40">
                  <WorkoutIcon size={18} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 dark:text-white font-semibold text-sm leading-tight">{lastLog.plan_name}</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{lastLog.date} · {daysAgo(lastLog.date)}</p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-xs text-gray-400 dark:text-gray-500">Total lyft</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{totalLyft}</span>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${difficulty.className}`}>
                  {difficulty.label}
                </span>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
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
                    {lastLog.exercises.map((ex, i) => (
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
            </div>
          </div>
        )
      })()}

      {logs.length === 0 && (
        <p className="text-gray-400 dark:text-gray-500 text-sm">Inga pass loggade ännu, tryck på Logga ett pass för att komma igång!</p>
      )}
    </div>
  )
}
