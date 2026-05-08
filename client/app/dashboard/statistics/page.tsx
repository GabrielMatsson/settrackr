"use client"

import { useStatistics } from "./components/StatisticsContext"
import WorkoutOverview from "./components/WorkoutOverview"
import ProgressCharts from "./components/ProgressCharts"

export default function OverviewPage() {
  const { logs, loading } = useStatistics()

  return (
    <div className="flex flex-col gap-6">
      {loading && logs.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm">Laddar…</p>}
      <WorkoutOverview logs={logs} />
      <ProgressCharts logs={logs} />
    </div>
  )
}
