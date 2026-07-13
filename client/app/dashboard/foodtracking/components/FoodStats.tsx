"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { ChevronLeft, ChevronRight, Flame, Beef, Target, Utensils } from "lucide-react"
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts"
import { getMealsRange, getMe, getWeightLogs, type WeightEntry } from "@/lib/api"
import { todayStr, shiftDate, startOfWeek, weekDates, dailyTotals, weekSummary, type Meal } from "@/lib/food-utils"
import AnimatedNumber from "@/app/components/AnimatedNumber"
import { fadeUp, fadeUpTransition } from "@/lib/motion"

// Chart palette validated with the dataviz six-checks script — passes light AND dark surfaces
const KCAL_COLOR = "#059669"    // emerald-600
const PROTEIN_COLOR = "#0d9488" // teal-600
const TARGET_COLOR = "#d97706"  // amber-600

const tooltipStyle = {
  backgroundColor: "#111827",
  border: "1px solid #1f2937",
  borderRadius: "8px",
  color: "#fff",
}

const WEEKDAY_LABELS = ["mån", "tis", "ons", "tors", "fre", "lör", "sön"]

function weekLabel(startStr: string): string {
  const start = new Date(startStr + "T12:00:00")
  const end = new Date(shiftDate(startStr, 6) + "T12:00:00")
  const fmt = (d: Date) => d.toLocaleDateString("sv-SE", { day: "numeric", month: "long" })
  return `${fmt(start)} – ${fmt(end)}`
}

type Tile = {
  label: string
  value: number | null // null renders as "–"
  suffix?: string
  sub: string
  icon: typeof Flame
  chip: string
}

export default function FoodStats() {
  const [weekStart, setWeekStart] = useState(startOfWeek(todayStr()))
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kcalTarget, setKcalTarget] = useState(2200)
  const [proteinTarget, setProteinTarget] = useState(150)
  const [targetWeight, setTargetWeight] = useState<number | null>(null)
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([])

  useEffect(() => {
    getMe()
      .then((p) => {
        setKcalTarget(p.kcal_target ?? 2200)
        setProteinTarget(p.protein_target ?? 150)
        setTargetWeight(p.target_weight ?? null)
        if (p.show_weight_tracking !== false) {
          getWeightLogs().then(setWeightEntries).catch(() => {})
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    getMealsRange(weekStart, shiftDate(weekStart, 6))
      .then((data) => {
        setMeals(data as Meal[])
        setLoading(false)
      })
      .catch(() => {
        setError("Kunde inte hämta kostdata")
        setLoading(false)
      })
  }, [weekStart])

  const isCurrentWeek = weekStart === startOfWeek(todayStr())
  const days = dailyTotals(meals, weekDates(weekStart))
  const summary = weekSummary(days, kcalTarget, proteinTarget)

  const chartData = days.map((d, i) => ({
    day: WEEKDAY_LABELS[i],
    kcal: d.kcal,
    protein: d.protein,
  }))

  // Weight trend spans all entries (not the selected week) — weight change is
  // only meaningful over a longer window.
  const weightData = [...weightEntries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      date: new Date(e.date + "T12:00:00").toLocaleDateString("sv-SE", { day: "numeric", month: "numeric" }),
      kg: e.weight_kg,
    }))
  // Body weight moves in a narrow band — pad the domain around min/max
  // (including the target line) instead of starting at 0.
  const weightValues = weightData.map((d) => d.kg).concat(targetWeight != null ? [targetWeight] : [])
  const weightDomain: [number, number] = weightValues.length
    ? [Math.floor(Math.min(...weightValues)) - 1, Math.ceil(Math.max(...weightValues)) + 1]
    : [0, 100]

  const tiles: Tile[] = [
    {
      label: "Snitt kcal/dag", value: summary.loggedDays > 0 ? summary.avgKcal : null,
      sub: `mål ${kcalTarget}`, icon: Flame,
      chip: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Snitt protein/dag", value: summary.loggedDays > 0 ? summary.avgProtein : null, suffix: " g",
      sub: `mål ${proteinTarget} g`, icon: Beef,
      chip: "bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400",
    },
    {
      label: "Dagar i mål", value: summary.loggedDays > 0 ? summary.daysOnTarget : null,
      sub: `av ${summary.loggedDays} loggade`, icon: Target,
      chip: "bg-lime-100 dark:bg-lime-900/40 text-lime-600 dark:text-lime-400",
    },
    {
      label: "Måltider", value: meals.length,
      sub: "denna vecka", icon: Utensils,
      chip: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-gray-900 dark:text-white font-semibold text-sm capitalize">{weekLabel(weekStart)}</p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekStart(shiftDate(weekStart, -7))}
            className="group p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 transition-colors"
            aria-label="Föregående vecka"
          >
            <ChevronLeft size={18} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
          </button>
          <button
            onClick={() => setWeekStart(shiftDate(weekStart, 7))}
            disabled={isCurrentWeek}
            className="group p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Nästa vecka"
          >
            <ChevronRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
          {!isCurrentWeek && (
            <button
              onClick={() => setWeekStart(startOfWeek(todayStr()))}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium px-2 py-1 transition-colors"
            >
              Denna vecka
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
      {loading && <p className="text-gray-400 dark:text-gray-500 text-sm">Laddar…</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map(({ label, value, suffix, sub, icon: Icon, chip }, i) => (
          <motion.div
            key={label}
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={fadeUpTransition(i)}
            className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl shadow-card p-4 flex flex-col gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${chip}`}>
              <Icon size={17} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                {value === null ? "–" : <><AnimatedNumber value={value} />{suffix}</>}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {summary.loggedDays === 0 && !loading ? (
        <div className="bg-white/60 dark:bg-gray-900/60 border border-dashed border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Inga måltider loggade den här veckan.</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Logga måltider i dagboken för att se statistik.</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl shadow-card p-5 flex flex-col gap-4">
            <p className="text-gray-900 dark:text-white font-semibold">Kalorier per dag</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 12, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grid)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kcal`]} cursor={{ fill: "rgba(5,150,105,0.08)" }} />
                <ReferenceLine y={kcalTarget} stroke={TARGET_COLOR} strokeDasharray="4 4" label={{ value: "Mål", fill: TARGET_COLOR, fontSize: 11, position: "insideTopRight" }} />
                <Bar dataKey="kcal" fill={KCAL_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl shadow-card p-5 flex flex-col gap-4">
            <p className="text-gray-900 dark:text-white font-semibold">Protein per dag</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 12, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grid)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} unit=" g" width={44} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} g protein`]} cursor={{ fill: "rgba(13,148,136,0.08)" }} />
                <ReferenceLine y={proteinTarget} stroke={TARGET_COLOR} strokeDasharray="4 4" label={{ value: "Mål", fill: TARGET_COLOR, fontSize: 11, position: "insideTopRight" }} />
                <Bar dataKey="protein" fill={PROTEIN_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {weightData.length >= 2 && (
        <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl shadow-card p-5 flex flex-col gap-4">
          <p className="text-gray-900 dark:text-white font-semibold">Viktutveckling</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weightData} margin={{ top: 12, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="bodyWeightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={KCAL_COLOR} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={KCAL_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grid)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={weightDomain} tick={{ fill: "#94a3b8", fontSize: 11 }} unit=" kg" axisLine={false} tickLine={false} width={52} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`]} />
              {targetWeight != null && (
                <ReferenceLine y={targetWeight} stroke={TARGET_COLOR} strokeDasharray="4 4" label={{ value: "Mål", fill: TARGET_COLOR, fontSize: 11, position: "insideTopRight" }} />
              )}
              <Area
                type="monotone"
                dataKey="kg"
                stroke={KCAL_COLOR}
                strokeWidth={2}
                fill="url(#bodyWeightGradient)"
                dot={false}
                activeDot={{ r: 5, fill: KCAL_COLOR, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
