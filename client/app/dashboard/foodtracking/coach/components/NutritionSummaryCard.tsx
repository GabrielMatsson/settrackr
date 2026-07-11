"use client"

import { Sparkles } from "lucide-react"

export default function NutritionSummaryCard({ summary }: { summary: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl shadow-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="bg-emerald-100 dark:bg-emerald-900/40 rounded-xl p-2.5 shrink-0">
          <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="text-gray-900 dark:text-white font-semibold">Veckans sammanfattning</p>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mt-1">{summary}</p>
        </div>
      </div>
    </div>
  )
}
