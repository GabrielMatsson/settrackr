"use client"

import { useState, useEffect } from "react"
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts"

type ExerciseLog = {
  name: string
  weight: number
}

type WorkoutLog = {
  id: number
  date: string
  exercises: ExerciseLog[]
}

type Props = {
  logs: WorkoutLog[]
  friendLogs?: WorkoutLog[]
  friendName?: string
  hideBarChart?: boolean
  noCard?: boolean
}

function getExerciseNames(logs: WorkoutLog[], extra?: WorkoutLog[]): string[] {
  const dateSets: Record<string, Set<string>> = {}
  const all = extra ? [...logs, ...extra] : logs
  for (let i = 0; i < all.length; i++) {
    const log = all[i]
    for (let j = 0; j < log.exercises.length; j++) {
      const name = log.exercises[j].name
      if (!dateSets[name]) dateSets[name] = new Set()
      dateSets[name].add(log.date)
    }
  }
  return Object.entries(dateSets)
    .filter(([, dates]) => dates.size >= 2)
    .map(([name]) => name)
    .sort()
}

function getWeightProgressionByDate(logs: WorkoutLog[], exerciseName: string): Record<string, number> {
  const byDate: Record<string, number> = {}
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i]
    for (let j = 0; j < log.exercises.length; j++) {
      const ex = log.exercises[j]
      if (ex.name.toLowerCase() === exerciseName.toLowerCase()) {
        if (!byDate[log.date] || ex.weight > byDate[log.date]) {
          byDate[log.date] = ex.weight
        }
      }
    }
  }
  return byDate
}

function getWeightProgression(logs: WorkoutLog[], exerciseName: string, friendLogs?: WorkoutLog[]) {
  const myData = getWeightProgressionByDate(logs, exerciseName)
  const friendData = friendLogs ? getWeightProgressionByDate(friendLogs, exerciseName) : {}

  const allDates = new Set([...Object.keys(myData), ...Object.keys(friendData)])
  const entries = Array.from(allDates).sort((a, b) => a.localeCompare(b))

  return entries.map((date) => {
    const d = new Date(date)
    const label = d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" })
    const point: Record<string, unknown> = { date: label }
    if (myData[date] !== undefined) point.weight = myData[date]
    if (friendData[date] !== undefined) point.friendWeight = friendData[date]
    return point
  })
}

function getISOWeekKey(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-${String(weekNum).padStart(2, "0")}`
}

function getWeeklyWorkouts(logs: WorkoutLog[]) {
  const byWeek: Record<string, Set<string>> = {}
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i]
    const key = getISOWeekKey(new Date(log.date))
    if (!byWeek[key]) byWeek[key] = new Set()
    byWeek[key].add(log.date)
  }
  const entries = Object.entries(byWeek).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
  const result = []
  for (let i = 0; i < entries.length; i++) {
    const [key, dates] = entries[i]
    const weekNum = key.split("-")[1]
    result.push({ week: `v.${weekNum}`, count: dates.size })
  }
  return result
}

const tooltipStyle = {
  backgroundColor: "#111827",
  border: "1px solid #1f2937",
  borderRadius: "8px",
  color: "#fff",
}

export default function ProgressCharts({ logs, friendLogs, friendName, hideBarChart, noCard }: Props) {
  const exerciseNames = getExerciseNames(logs, friendLogs)
  const [selectedExercise, setSelectedExercise] = useState(exerciseNames[0] ?? "")

  useEffect(() => {
    if (exerciseNames.length > 0 && (!selectedExercise || !exerciseNames.includes(selectedExercise))) {
      setSelectedExercise(exerciseNames[0])
    }
  }, [exerciseNames])

  const lineData = selectedExercise ? getWeightProgression(logs, selectedExercise, friendLogs) : []
  const barData = getWeeklyWorkouts(logs)
  const hasFriend = !!friendLogs && friendLogs.length > 0

  return (
    <div className={hideBarChart ? "flex flex-col gap-4" : "grid grid-cols-1 lg:grid-cols-2 gap-4"}>
      <div className={noCard ? "flex flex-col gap-4" : "bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex flex-col gap-4"}>
        <div className="flex items-center justify-between">
          {!noCard && <p className="text-gray-900 dark:text-white font-semibold">Viktutveckling</p>}
          {exerciseNames.length > 0 ? (
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5">
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="bg-transparent text-gray-900 dark:text-white text-sm focus:outline-none"
              >
                {exerciseNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {lineData.length < 2 ? (
          <p className="text-gray-400 dark:text-gray-500 text-sm py-8 text-center">
            Logga samma övning vid minst 2 tillfällen för att se din utvecklingsförlopp
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={lineData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="weightGradientFriend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grid)" />
              <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11, dx: -10 }} unit=" kg" axisLine={false} tickLine={false} width={48} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`]} />
              {hasFriend && <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />}
              <Area
                type="monotone"
                dataKey="weight"
                name="Jag"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#weightGradient)"
                dot={false}
                activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                connectNulls
              />
              {hasFriend && (
                <Area
                  type="monotone"
                  dataKey="friendWeight"
                  name={friendName ?? "Vän"}
                  stroke="#a78bfa"
                  strokeWidth={2}
                  fill="url(#weightGradientFriend)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#a78bfa", stroke: "#fff", strokeWidth: 2 }}
                  connectNulls
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {!hideBarChart && (
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-gray-900 dark:text-white font-semibold">Pass per vecka</p>

          {barData.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm py-8 text-center">
              Logga fler pass för att se din veckostatistik
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grid)" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, "Pass"]} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  )
}
