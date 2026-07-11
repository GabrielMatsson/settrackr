"use client"

import { useState } from "react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { Trophy } from "lucide-react"
import { CoachPR, CoachTrend } from "@/lib/api"

const tooltipStyle = {
  backgroundColor: "#111827",
  border: "1px solid #1f2937",
  borderRadius: "8px",
  color: "#fff",
}

function fmt(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })
}

export default function RecordsCard({ prs, trends }: { prs: CoachPR[]; trends: CoachTrend[] }) {
  const [selected, setSelected] = useState("")
  const effective = trends.find((t) => t.exercise === selected) ?? trends[0]

  const chartData = effective
    ? effective.points.map((p) => ({ date: shortDate(p.date), e1rm: p.e1rm }))
    : []

  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card p-5 sm:p-6 flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Trophy size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
        <p className="text-gray-900 dark:text-white font-semibold">Rekord & styrketrend</p>
      </div>

      {/* Estimated-1RM trend (single series → no legend needed). */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm text-gray-600 dark:text-gray-300">Beräknad 1RM över tid</p>
          {trends.length > 0 && (
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5">
              <select
                value={effective?.exercise ?? ""}
                onChange={(e) => setSelected(e.target.value)}
                className="bg-transparent text-gray-900 dark:text-white text-sm focus:outline-none"
              >
                {trends.map((t) => (
                  <option key={t.exercise} value={t.exercise}>{t.exercise}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {chartData.length < 2 ? (
          <p className="text-gray-400 dark:text-gray-500 text-sm py-8 text-center">
            Logga samma övning vid minst 2 tillfällen för att se din styrketrend.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="e1rmGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grid)" />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11, dx: -10 }} unit=" kg" axisLine={false} tickLine={false} width={48} domain={["dataMin - 5", "dataMax + 5"]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`, "Ber. 1RM"]} />
              <Area
                type="monotone"
                dataKey="e1rm"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#e1rmGradient)"
                dot={false}
                activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent PRs */}
      <div className="flex flex-col gap-2 border-t border-gray-100 dark:border-gray-800 pt-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">Senaste rekord</p>
        {prs.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-sm py-2">
            Inga rekord ännu – slå ditt första genom att öka vikt eller reps på en övning du loggat förut.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
            {prs.slice(0, 8).map((p, i) => (
              <li key={`${p.exercise}-${p.date}-${i}`} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <span className="text-gray-900 dark:text-white text-sm font-medium block truncate">{p.exercise}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{shortDate(p.date)}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-gray-900 dark:text-white text-sm tabular-nums">{fmt(p.weight)} kg × {p.reps}</span>
                  <span className="block text-xs text-indigo-600 dark:text-indigo-400">
                    {p.type === "weight" ? "Ny maxvikt" : `Ber. 1RM ${fmt(p.e1rm)} kg`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
