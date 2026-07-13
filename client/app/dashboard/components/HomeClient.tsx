"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, useMotionValue, useSpring } from "motion/react"
import { Flame, Apple, ChevronRight } from "lucide-react"
import { getLogs, getMe, getMyLevel, getMeals, getWeightLogs } from "@/lib/api"
import { getOverallDifficulty, getTotalLyft, estimate1RM, getWorkoutIcon, hasChickenLegs, isGymGhost } from "@/lib/workout-utils"
import { makeBodyweightResolver, effectiveWeight } from "@/lib/weight-utils"
import { sumMealsMacros, todayStr, type Meal } from "@/lib/food-utils"
import WorkoutOverview from "../statistics/components/WorkoutOverview"
import GymMascot from "./GymMascot"
import ChickenAnimation from "@/app/components/ChickenAnimation"
import GhostAnimation from "@/app/components/GhostAnimation"
import DifficultyBadge from "@/app/components/DifficultyBadge"
import ProgressRing from "@/app/components/ProgressRing"
import AnimatedNumber from "@/app/components/AnimatedNumber"
import { pressSpring } from "@/lib/motion"
import { useHoverCapable } from "@/lib/useHoverCapable"

type ExerciseLog = {
  name: string
  sets: number
  reps: number
  weight: number // extra load in kg (on top of body weight when is_bodyweight)
  difficulty: string
  done: boolean
  is_bodyweight?: boolean
  effective_weight?: number
}

type WorkoutLog = {
  id: number
  date: string
  plan_name: string
  icon?: string
  exercises: ExerciseLog[]
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

function daysSinceLastLog(lastLog: WorkoutLog | null): number | null {
  if (!lastLog) return null
  return Math.floor((Date.now() - new Date(lastLog.date).getTime()) / 86400000)
}

function workoutsThisWeek(logs: WorkoutLog[]): number {
  const now = new Date()
  const day = now.getDay() === 0 ? 6 : now.getDay() - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - day)
  const mondayStr = monday.toISOString().slice(0, 10)
  return new Set(logs.filter((l) => l.date >= mondayStr).map((l) => l.date)).size
}

type EasterEggProfile = {
  weekly_goal: number
  show_chicken_legs: boolean
  show_gym_ghost: boolean
  show_gym_mascot?: boolean
  show_food_tracking?: boolean
  kcal_target?: number
  protein_target?: number
}


type Props = {
  name: string
}

export default function HomeClient({ name }: Props) {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [weeklyGoal, setWeeklyGoal] = useState(3)
  const [profile, setProfile] = useState<EasterEggProfile | null>(null)
  const [chickenDismissed, setChickenDismissed] = useState(false)
  const [ghostDismissed, setGhostDismissed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [levelInfo, setLevelInfo] = useState<{ level: number; title: string; xp: number } | null>(null)
  const [foodMeals, setFoodMeals] = useState<Meal[]>([])
  const router = useRouter()

  // Weak magnetic pull on the big CTA — hover devices only
  const hoverable = useHoverCapable()
  const magnetX = useMotionValue(0)
  const magnetY = useMotionValue(0)
  const magnetSpringX = useSpring(magnetX, { stiffness: 300, damping: 20 })
  const magnetSpringY = useSpring(magnetY, { stiffness: 300, damping: 20 })

  function handleMagnetMove(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const clamp = (v: number) => Math.max(-10, Math.min(10, v))
    magnetX.set(clamp((e.clientX - (rect.left + rect.width / 2)) * 0.15))
    magnetY.set(clamp((e.clientY - (rect.top + rect.height / 2)) * 0.15))
  }

  function resetMagnet() {
    magnetX.set(0)
    magnetY.set(0)
  }

  const today = new Date().toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

  useEffect(() => {
    // Weight log turns bodyweight-flagged sets into effective load (body
    // weight at the log's date + extra kg); without entries it's a no-op.
    Promise.all([getLogs(), getWeightLogs().catch(() => [])])
      .then(([data, weightEntries]) => {
        const resolve = makeBodyweightResolver(weightEntries)
        setLogs((data as WorkoutLog[]).map((log) => ({
          ...log,
          exercises: log.exercises.map((ex) => ({ ...ex, effective_weight: effectiveWeight(ex, log.date, resolve) })),
        })))
        setLoading(false)
      })
      .catch(() => {
        setError("Kunde inte hämta träningsdata")
        setLoading(false)
      })
    getMe()
      .then((p) => {
        setWeeklyGoal(p.weekly_goal)
        setProfile(p)
      })
      .catch(() => {})
    getMyLevel().then((l) => setLevelInfo(l as { level: number; title: string; xp: number })).catch(() => {})
    getMeals(todayStr()).then((data) => setFoodMeals(data as Meal[])).catch(() => {})
  }, [])

  const showChicken = !chickenDismissed && profile !== null && profile.show_chicken_legs && logs.length > 0 && hasChickenLegs(logs)
  const showGhost = !ghostDismissed && profile !== null && profile.show_gym_ghost && logs.length > 0 && isGymGhost(logs)

  const sorted = [...logs].sort((a, b) => (a.date < b.date ? 1 : -1))
  const lastLog = sorted[0] ?? null
  const streak = computeStreak(logs)
  const weekCount = workoutsThisWeek(logs)
  const daysSinceLast = daysSinceLastLog(lastLog)

  return (
    <div className="xl:grid xl:grid-cols-[1fr_200px] xl:gap-4 xl:items-start max-w-4xl xl:max-w-5xl mx-auto w-full">
    <div className="flex flex-col gap-8 min-w-0">
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
              Nivå {levelInfo.level} · {levelInfo.title} · <AnimatedNumber value={levelInfo.xp} /> XP
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
        <motion.button
          onClick={() => router.push("/dashboard/tracking")}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          transition={pressSpring}
          style={{ x: magnetSpringX, y: magnetSpringY }}
          onMouseMove={hoverable ? handleMagnetMove : undefined}
          onMouseLeave={hoverable ? resetMagnet : undefined}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-2xl p-6 text-left transition-colors flex flex-col justify-between min-h-[120px]"
        >
          <p className="text-xl font-bold">Logga ett pass</p>
          <p className="text-indigo-200 text-sm mt-1">Håll koll på din träning och dina framsteg</p>
          <span className="mt-4 inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors text-white text-sm font-medium px-4 py-1.5 rounded-lg self-start">
            + Nytt pass
          </span>
        </motion.button>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card p-5 flex items-center justify-center shrink-0">
          <ProgressRing value={weekCount} target={weeklyGoal} label="Veckostatus" />
        </div>
      </div>

      {profile?.show_gym_mascot && (
        <div className="xl:hidden">
          <GymMascot compact weekCount={weekCount} weeklyGoal={weeklyGoal} daysSinceLast={daysSinceLast} />
        </div>
      )}

      {profile?.show_food_tracking === false ? null : (() => {
        const foodTotals = sumMealsMacros(foodMeals)
        const kcalTarget = profile?.kcal_target ?? 2200
        const proteinTarget = profile?.protein_target ?? 150
        return (
          <Link
            href="/dashboard/foodtracking"
            className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 dark:bg-emerald-900/40">
              <Apple size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 dark:text-white font-semibold text-sm leading-tight">Kost idag</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">
                <AnimatedNumber value={foodTotals.kcal} /> / {kcalTarget} kcal · <AnimatedNumber value={foodTotals.protein} decimals={1} /> / {proteinTarget} g protein
              </p>
            </div>
            <ChevronRight size={18} className="text-gray-400 dark:text-gray-500 shrink-0" />
          </Link>
        )
      })()}

      <WorkoutOverview logs={logs} allTime />

      {lastLog && (() => {
        const difficulty = getOverallDifficulty(lastLog.exercises)
        const totalLyft = getTotalLyft(lastLog.exercises)
        const WorkoutIcon = getWorkoutIcon(lastLog.icon)
        return (
          <div className="flex flex-col gap-3">
            <p className="text-gray-900 dark:text-white font-semibold">Senaste passet</p>
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">
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
              <div className="border-t border-gray-100 dark:border-gray-800 overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50">
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
                        <td className="px-3 py-3 text-center text-sm text-gray-600 dark:text-gray-400">{ex.is_bodyweight ? (ex.weight ? `Kv + ${ex.weight} kg` : "Kv") : `${ex.weight} kg`}</td>
                        <td className="px-3 py-3 text-center text-sm text-gray-600 dark:text-gray-400">{estimate1RM(ex.effective_weight ?? ex.weight, ex.reps)}</td>
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

      {showChicken && <ChickenAnimation onDone={() => setChickenDismissed(true)} />}
      {showGhost   && <GhostAnimation   onDone={() => setGhostDismissed(true)} />}
    </div>

    {profile?.show_gym_mascot && (
      <div className="hidden xl:block sticky top-8">
        <GymMascot weekCount={weekCount} weeklyGoal={weeklyGoal} daysSinceLast={daysSinceLast} />
      </div>
    )}
    </div>
  )
}
