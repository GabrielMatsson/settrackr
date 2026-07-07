"use client"

import { useState, useRef, useEffect, createElement } from "react"
import { MoreHorizontal, ChevronDown } from "lucide-react"
import { updateLog, deleteLog } from "@/lib/api"
import { getOverallDifficulty, getTotalLyft, estimate1RM, getWorkoutIcon } from "@/lib/workout-utils"
import DifficultyBadge from "@/app/components/DifficultyBadge"

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

type Props = {
  log: WorkoutLog
  onDelete: (id: number) => void
  onUpdate: (updated: WorkoutLog) => void
}


function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00")
  const day = d.getDate()
  const month = d.toLocaleDateString("sv-SE", { month: "short" }).replace(".", "")
  const year = d.getFullYear()
  const weekday = d.toLocaleDateString("sv-SE", { weekday: "short" }).replace(".", "")
  return { day, month, year, weekday }
}


function DifficultyPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options = [
    { key: "easy", label: "Lätt", active: "bg-green-600 text-white", inactive: "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400" },
    { key: "medium", label: "Medium", active: "bg-amber-500 text-amber-950", inactive: "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400" },
    { key: "hard", label: "Tufft", active: "bg-red-600 text-white", inactive: "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400" },
  ]
  return (
    <div className="flex gap-1">
      {options.map(({ key, label, active, inactive }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${value === key ? active : inactive}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default function LogCard({ log, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [planName, setPlanName] = useState(log.plan_name)
  const [date, setDate] = useState(log.date)
  const [exercises, setExercises] = useState<ExerciseLog[]>(log.exercises)
  const [error, setError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [menuOpen])

  function updateExerciseField(index: number, field: keyof ExerciseLog, value: string | number | boolean) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], [field]: value }
    setExercises(updated)
  }

  async function handleSave() {
    try {
      const updated = await updateLog(log.id, { plan_name: planName, date, exercises })
      onUpdate(updated)
      setEditing(false)
      setError(null)
    } catch {
      setError("Kunde inte spara ändringarna")
    }
  }

  async function handleDelete() {
    try {
      await deleteLog(log.id)
      onDelete(log.id)
    } catch {
      setError("Kunde inte ta bort träningspasset")
    }
  }

  function handleCancel() {
    setPlanName(log.plan_name)
    setDate(log.date)
    setExercises(log.exercises)
    setError(null)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="bg-white dark:bg-gray-950 border border-indigo-500 rounded-2xl shadow-card overflow-hidden p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <input
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-semibold text-base rounded px-3 py-1.5 focus:outline-none focus:border-indigo-500 w-full"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded px-3 py-1.5 focus:outline-none focus:border-indigo-500 self-start"
          />
        </div>
        <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-800">
          {exercises.map((ex, i) => (
            <div key={i} className="flex flex-col gap-2 py-3">
              <input
                value={ex.name}
                onChange={(e) => updateExerciseField(i, "name", e.target.value)}
                className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-2 flex-wrap">
                {(["sets", "reps", "weight"] as const).map((field) => (
                  <label key={field} className="flex flex-col gap-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {field === "sets" ? "Set" : field === "reps" ? "Reps" : "Vikt (kg)"}
                    <input
                      type="number"
                      value={ex[field] as number}
                      onChange={(e) => updateExerciseField(i, field, Number(e.target.value))}
                      className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded px-2 py-1 w-16 focus:outline-none focus:border-indigo-500"
                    />
                  </label>
                ))}
              </div>
              <DifficultyPicker value={ex.difficulty} onChange={(v) => updateExerciseField(i, "difficulty", v)} />
            </div>
          ))}
        </div>
        {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Spara
          </button>
          <button
            onClick={handleCancel}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors px-2"
          >
            Avbryt
          </button>
        </div>
      </div>
    )
  }

  const { day, month, year, weekday } = formatDate(log.date)
  const difficulty = getOverallDifficulty(log.exercises)
  const totalLyft = getTotalLyft(log.exercises)
  const exerciseNames = log.exercises.map((e) => e.name).join(" · ")
  const workoutIcon = getWorkoutIcon(log.icon)

  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card">
      <div
        className="flex items-center gap-2 sm:gap-4 px-3 py-3 sm:px-5 sm:py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
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

        <div className="hidden sm:flex flex-col items-end shrink-0">
          <span className="text-xs text-gray-400 dark:text-gray-500">Total lyft</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{totalLyft}</span>
        </div>

        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${difficulty.className}`}>
          {difficulty.label}
        </span>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded transition-colors"
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 min-w-[120px] py-1 overflow-hidden">
              <button
                onClick={() => { setMenuOpen(false); setEditing(true) }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Redigera
              </button>
              <button
                onClick={() => { setMenuOpen(false); handleDelete() }}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Ta bort
              </button>
            </div>
          )}
        </div>

        <ChevronDown
          size={15}
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </div>

      {expanded && (
        <div className="border-t border-indigo-100 dark:border-gray-800 bg-indigo-50/50 dark:bg-gray-900/50 rounded-b-2xl overflow-hidden">
          <div className="md:hidden flex flex-col divide-y divide-indigo-100/60 dark:divide-gray-800 px-3 py-2">
            {log.exercises.map((ex, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-3">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{ex.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {ex.sets} set × {ex.reps} reps · {ex.weight} kg · 1RM ~{estimate1RM(ex.weight, ex.reps)}
                  </span>
                </div>
                <DifficultyBadge difficulty={ex.difficulty} />
              </div>
            ))}
          </div>
          <table className="hidden md:table w-full text-sm">
            <thead>
              <tr className="border-b border-indigo-100 dark:border-gray-800">
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Övningar</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">Set</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">Reps</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">Vikt</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">1RM (est.)</th>
                <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-100/60 dark:divide-gray-800">
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
