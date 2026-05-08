"use client"

import { useStatistics } from "../components/StatisticsContext"
import MyGoals from "../components/MyGoals"

export default function GoalsPage() {
  const { logs } = useStatistics()
  return <MyGoals logs={logs} />
}
