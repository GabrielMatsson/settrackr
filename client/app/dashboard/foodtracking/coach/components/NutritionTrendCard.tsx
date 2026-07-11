"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts"
import { TrendingUp } from "lucide-react"
import { NutritionInsights } from "@/lib/api"

// Same palette as FoodStats (validated for light + dark surfaces).
const KCAL_COLOR = "#059669"    // emerald-600
const PROTEIN_COLOR = "#0d9488" // teal-600
const TARGET_COLOR = "#d97706"  // amber-600

const tooltipStyle = {
  backgroundColor: "#111827",
  border: "1px solid #1f2937",
  borderRadius: "8px",
  color: "#fff",
}

type Props = {
  trend: NutritionInsights["weekly_trend"]
  kcalTarget: number
  proteinTarget: number
  weeks: number
}

export default function NutritionTrendCard({ trend, kcalTarget, proteinTarget, weeks }: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl shadow-card p-5 sm:p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-gray-900 dark:text-white font-semibold">Trend per vecka</p>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">snitt/dag · senaste {weeks} v</span>
      </div>

      {trend.length < 2 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm py-8 text-center">
          Logga måltider under minst två veckor för att se din trend.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">Kalorier (snitt/dag)</p>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={trend} margin={{ top: 12, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grid)" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kcal`, "Snitt/dag"]} cursor={{ fill: "rgba(5,150,105,0.08)" }} />
                <ReferenceLine y={kcalTarget} stroke={TARGET_COLOR} strokeDasharray="4 4" label={{ value: "Mål", fill: TARGET_COLOR, fontSize: 11, position: "insideTopRight" }} />
                <Bar dataKey="avg_kcal" fill={KCAL_COLOR} radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">Protein (snitt/dag)</p>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={trend} margin={{ top: 12, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grid)" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} unit=" g" width={44} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} g protein`, "Snitt/dag"]} cursor={{ fill: "rgba(13,148,136,0.08)" }} />
                <ReferenceLine y={proteinTarget} stroke={TARGET_COLOR} strokeDasharray="4 4" label={{ value: "Mål", fill: TARGET_COLOR, fontSize: 11, position: "insideTopRight" }} />
                <Bar dataKey="avg_protein" fill={PROTEIN_COLOR} radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
