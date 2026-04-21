"use client"

import { useState } from "react"

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

type Period = 7 | 30 | 90

type Props = {
  logs: WorkoutLog[]
}

const stats = [
  { key: "workouts",     label: "Träningspass",          color: "bg-indigo-500" },
  { key: "totalSets",    label: "Sets",     color: "bg-violet-500" },
  { key: "totalReps",    label: "Reps",    color: "bg-cyan-500"   },
  { key: "totalWeight",  label: "Lyft", color: "bg-emerald-500"},
  { key: "heaviestLift", label: "Tyngsta lyftet",    color: "bg-rose-500"   },
]

function computeStats(logs: WorkoutLog[], days: Period) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  let workouts = 0
  let totalSets = 0
  let totalReps = 0
  let totalWeight = 0
  let heaviestLift = 0

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i]
    if (log.date < cutoffStr) continue
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

export default function WorkoutOverview({ logs }: Props) {
  const [period, setPeriod] = useState<Period>(30)

  const data = computeStats(logs, period)

  const bullets = []
  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i]
    const value = data[stat.key as keyof typeof data]
    bullets.push(
      <div key={stat.key} className="flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full shrink-0 ${stat.color}`} />
        <span className="text-gray-400 text-sm">{stat.label}</span>
        <span className="ml-auto text-white font-semibold text-sm">{value}</span>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-px bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500">
      <div className="bg-gray-950 rounded-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Översikt</h2>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value) as Period)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value={7}>Senaste 7 dagarna</option>
            <option value={30}>Senaste 30 dagarna</option>
            <option value={90}>Senaste 90 dagarna</option>
          </select>
        </div>
        <div className="flex flex-col gap-3">
          {bullets}
        </div>
      </div>
    </div>
  )
}
