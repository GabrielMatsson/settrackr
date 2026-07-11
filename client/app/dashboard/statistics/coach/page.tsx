"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { Sparkles } from "lucide-react"
import { fadeUp, fadeUpTransition } from "@/lib/motion"
import { getCoachInsights, CoachInsights } from "@/lib/api"
import WeeklySummaryCard from "./components/WeeklySummaryCard"
import PlateauCard from "./components/PlateauCard"
import MuscleVolumeCard from "./components/MuscleVolumeCard"
import RecordsCard from "./components/RecordsCard"

export default function CoachPage() {
  const [data, setData] = useState<CoachInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCoachInsights(8)
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
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card p-8 text-center flex flex-col items-center gap-3">
        <div className="bg-indigo-100 dark:bg-indigo-900/40 rounded-xl p-3">
          <Sparkles size={22} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <p className="text-gray-900 dark:text-white font-semibold">Coach har inget att analysera än</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">
          Logga några pass med vikter och reps, så börjar Coach hitta rekord, platåer och volymmönster i din träning.
        </p>
      </div>
    )
  }

  const sections = [
    <WeeklySummaryCard key="summary" summary={data.weekly_summary} />,
    <RecordsCard key="records" prs={data.prs} trends={data.one_rm_trends} />,
    <PlateauCard key="plateaus" plateaus={data.plateaus} />,
    <MuscleVolumeCard key="volume" volume={data.muscle_volume} weeks={data.meta.weeks_analysed} />,
  ]

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section, i) => (
        <motion.div key={section.key} initial={fadeUp.initial} animate={fadeUp.animate} transition={fadeUpTransition(i)}>
          {section}
        </motion.div>
      ))}
    </div>
  )
}
