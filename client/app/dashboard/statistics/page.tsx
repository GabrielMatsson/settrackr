"use client"

import { motion } from "motion/react"
import { fadeUp, fadeUpTransition } from "@/lib/motion"
import { useStatistics } from "./components/StatisticsContext"
import WorkoutOverview from "./components/WorkoutOverview"
import WorkoutHeatmap from "./components/WorkoutHeatmap"
import MuscleHeatmap from "./components/MuscleHeatmap"
import MyGoals from "./components/MyGoals"
import ProgressCharts from "./components/ProgressCharts"

export default function OverviewPage() {
  const { logs, loading } = useStatistics()

  const sections = [
    <WorkoutOverview key="overview" logs={logs} />,
    <WorkoutHeatmap key="heatmap" logs={logs} />,
    <MuscleHeatmap key="muscles" logs={logs} />,
    <MyGoals key="goals" logs={logs} />,
    <ProgressCharts key="charts" logs={logs} />,
  ]

  return (
    <div className="flex flex-col gap-6">
      {loading && logs.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm">Laddar…</p>}
      {sections.map((section, i) => (
        <motion.div key={section.key} initial={fadeUp.initial} animate={fadeUp.animate} transition={fadeUpTransition(i)}>
          {section}
        </motion.div>
      ))}
    </div>
  )
}
