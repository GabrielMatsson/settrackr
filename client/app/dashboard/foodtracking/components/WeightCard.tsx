"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Scale, ChevronDown, Trash2 } from "lucide-react"
import type { GoalMode, WeightEntry } from "@/lib/api"
import { GOAL_MODE_LABELS } from "@/lib/weight-utils"
import { formatDateLabel, todayStr } from "@/lib/food-utils"
import { accordionSpring } from "@/lib/motion"

function fmtKg(v: number): string {
  return String(Math.round(v * 10) / 10).replace(".", ",")
}

type Props = {
  date: string // currently viewed diary date — entries are logged on this date
  entries: WeightEntry[] // sorted date DESC (latest first)
  mode: GoalMode | null
  targetWeight: number | null
  onLog: (weightKg: number) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export default function WeightCard({ date, entries, mode, targetWeight, onLog, onDelete }: Props) {
  const [input, setInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const latest = entries[0] ?? null
  const delta = latest && targetWeight != null ? targetWeight - latest.weight_kg : null

  async function handleLog() {
    const value = parseFloat(input.replace(",", "."))
    if (!value || value < 20 || value > 400) return
    setSaving(true)
    try {
      await onLog(Math.round(value * 10) / 10)
      setInput("")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl shadow-card p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Scale size={16} className="text-emerald-600 dark:text-emerald-400" />
        <span className="text-sm font-semibold text-gray-900 dark:text-white">Kroppsvikt</span>
        {mode && (
          <span className="text-xs rounded-full px-2 py-0.5 ring-1 ring-inset bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-emerald-600/20">
            {GOAL_MODE_LABELS[mode]}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-0.5">
          {latest ? (
            <>
              <p className="text-gray-900 dark:text-white font-semibold text-lg leading-tight">
                {fmtKg(latest.weight_kg)} kg
                <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">{formatDateLabel(latest.date)}</span>
              </p>
              {targetWeight != null && delta != null && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Mål: {fmtKg(targetWeight)} kg
                  {Math.abs(delta) >= 0.1 && (
                    <span> · {delta > 0 ? "+" : "−"}{fmtKg(Math.abs(delta))} kg kvar</span>
                  )}
                </p>
              )}
              {targetWeight == null && mode == null && (
                <p className="text-xs text-gray-400 dark:text-gray-500">Välj läge och sätt en målvikt i profilen.</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Ingen vikt loggad ännu.</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              min="20"
              max="400"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLog()}
              placeholder="kg"
              className="w-20 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleLog}
              disabled={saving || !input}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Logga
            </button>
          </div>
          {date !== todayStr() && (
            <p className="text-xs text-gray-400 dark:text-gray-500">Loggas på {formatDateLabel(date)}</p>
          )}
        </div>
      </div>

      {entries.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="group flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <ChevronDown size={14} className={`transition-transform duration-200 ${showHistory ? "rotate-180" : ""}`} />
            Historik
          </button>
          <AnimatePresence initial={false}>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={accordionSpring}
                className="overflow-hidden"
              >
                <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
                  {entries.slice(0, 5).map((e) => (
                    <li key={e.id} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{formatDateLabel(e.date)}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-gray-900 dark:text-white font-medium">{fmtKg(e.weight_kg)} kg</span>
                        <button
                          onClick={() => onDelete(e.id)}
                          className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          aria-label={`Ta bort viktloggen ${formatDateLabel(e.date)}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

    </div>
  )
}
