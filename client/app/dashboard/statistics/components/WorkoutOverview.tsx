"use client"

import { Dumbbell, Layers, RotateCcw, TrendingUp, Flame } from "lucide-react"
import AnimatedNumber from "@/app/components/AnimatedNumber"
import { useStatistics } from "./StatisticsContext"

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

type Props = {
  logs: WorkoutLog[]
  allTime?: boolean
}

function computeStats(logs: WorkoutLog[], fromStr: string, toStr: string, allTime = false) {
  let workouts = 0
  let totalSets = 0
  let totalReps = 0
  let totalWeight = 0
  let heaviestLift = 0

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i]
    if (!allTime && (log.date < fromStr || log.date > toStr)) continue
    workouts++
    for (let j = 0; j < log.exercises.length; j++) {
      const ex = log.exercises[j]
      totalSets += ex.sets
      totalReps += ex.sets * ex.reps
      totalWeight += ex.sets * ex.reps * ex.weight
      if (ex.weight > heaviestLift) heaviestLift = ex.weight
    }
  }

  return {
    workouts,
    totalSets,
    totalReps,
    totalWeight: Math.round(totalWeight),
    heaviestLift,
  }
}

const statDefs = [
  {
    key: "workouts" as const,
    label: "Träningspass",
    Icon: Dumbbell,
    iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    format: (v: number) => String(v),
  },
  {
    key: "totalSets" as const,
    label: "Sets",
    Icon: Layers,
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
    iconColor: "text-violet-600 dark:text-violet-400",
    format: (v: number) => String(v),
  },
  {
    key: "totalReps" as const,
    label: "Reps",
    Icon: RotateCcw,
    iconBg: "bg-cyan-100 dark:bg-cyan-900/40",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    format: (v: number) => String(v),
  },
  {
    key: "totalWeight" as const,
    label: "Lyft",
    Icon: TrendingUp,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    format: (v: number) => `${v.toLocaleString("sv-SE")} kg`,
  },
  {
    key: "heaviestLift" as const,
    label: "Tyngsta lyftet",
    Icon: Flame,
    iconBg: "bg-rose-100 dark:bg-rose-900/40",
    iconColor: "text-rose-600 dark:text-rose-400",
    format: (v: number) => `${v} kg`,
  },
]

export default function WorkoutOverview({ logs, allTime = false }: Props) {
  const { period } = useStatistics()

  const now = new Date()
  const toStr = now.toISOString().slice(0, 10)

  const currentFrom = new Date(now)
  currentFrom.setDate(currentFrom.getDate() - period)
  const currentFromStr = currentFrom.toISOString().slice(0, 10)

  const current = computeStats(logs, currentFromStr, toStr, allTime)

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card bg-white dark:bg-gray-950 overflow-hidden">
      <div className="px-5 pt-5 pb-2">
        <h2 className="text-gray-900 dark:text-white font-semibold text-lg">Översikt</h2>
      </div>
      <div className="flex flex-col sm:flex-row">
        {statDefs.map(({ key, label, Icon, iconBg, iconColor, format }) => {
          const value = current[key]

          return (
            <div key={key} className="flex items-center gap-3 px-5 py-8 flex-1 min-w-0">
              <div className={`${iconBg} rounded-xl p-2.5 w-10 h-10 flex items-center justify-center shrink-0`}>
                <Icon size={18} className={iconColor} />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-gray-900 dark:text-white leading-none whitespace-nowrap"><AnimatedNumber value={value} format={format} /></p>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
