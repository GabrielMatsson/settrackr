"use client"

import { useState } from "react"
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
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
}

function getExerciseNames(logs: WorkoutLog[]): string[] {
  const names = new Set<string>()
  for (let i = 0; i < logs.length; i++) {
    for (let j = 0; j < logs[i].exercises.length; j++) {
      names.add(logs[i].exercises[j].name)
    }
  }
  return Array.from(names).sort()
}

function getWeightProgression(logs: WorkoutLog[], exerciseName: string) {
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
  const entries = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b))
  const result = []
  for (let i = 0; i < entries.length; i++) {
    const [date, weight] = entries[i]
    const d = new Date(date)
    const label = d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" })
    result.push({ date: label, weight })
  }
  return result
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

export default function ProgressCharts({ logs }: Props) {
  const exerciseNames = getExerciseNames(logs)
  const [selectedExercise, setSelectedExercise] = useState(exerciseNames[0] ?? "")

  const lineData = selectedExercise ? getWeightProgression(logs, selectedExercise) : []
  const barData = getWeeklyWorkouts(logs)

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-white font-semibold">Viktutveckling</p>
          {exerciseNames.length > 0 ? (
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              {exerciseNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          ) : null}
        </div>

        {lineData.length < 2 ? (
          <p className="text-gray-500 text-sm py-8 text-center">
            Logga samma övning vid minst 2 tillfällen för att se din utvecklingsförlopp
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} unit=" kg" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`, "Max vikt"]} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: "#6366f1", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
        <p className="text-white font-semibold">Pass per vecka</p>

        {barData.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">
            Logga fler pass för att se din veckostatistik
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, "Pass"]} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
