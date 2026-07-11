"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { Sparkles } from "lucide-react"
import { fadeUp, fadeUpTransition } from "@/lib/motion"
import { getNutritionInsights, NutritionInsights } from "@/lib/api"
import NutritionSummaryCard from "./components/NutritionSummaryCard"
import TargetsCard from "./components/TargetsCard"
import NutritionTrendCard from "./components/NutritionTrendCard"

export default function NutritionCoachPage() {
  const [data, setData] = useState<NutritionInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getNutritionInsights(8)
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => { setError("Kunde inte hämta Coach-analysen"); setLoading(false) })
  }, [])

  if (loading) {
    return <p className="text-gray-500 dark:text-gray-400 text-sm">Laddar Coach…</p>
  }
  if (error) {
    return <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
  }
  if (!data || !data.meta.has_data) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl shadow-card p-8 text-center flex flex-col items-center gap-3">
        <div className="bg-emerald-100 dark:bg-emerald-900/40 rounded-xl p-3">
          <Sparkles size={22} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-gray-900 dark:text-white font-semibold">Coach har inget att analysera än</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">
          Logga några dagars måltider i dagboken, så börjar Coach följa ditt protein och dina kalorier över tid.
        </p>
      </div>
    )
  }

  const sections = [
    <NutritionSummaryCard key="summary" summary={data.weekly_summary} />,
    <TargetsCard key="targets" protein={data.protein} calories={data.calories} />,
    <NutritionTrendCard key="trend" trend={data.weekly_trend} kcalTarget={data.calories.target} proteinTarget={data.protein.target} weeks={data.meta.weeks_analysed} />,
  ]

  return (
    <div className="flex flex-col gap-5">
      {sections.map((section, i) => (
        <motion.div key={section.key} initial={fadeUp.initial} animate={fadeUp.animate} transition={fadeUpTransition(i)}>
          {section}
        </motion.div>
      ))}
    </div>
  )
}
