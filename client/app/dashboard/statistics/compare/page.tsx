"use client"

import { useStatistics } from "../components/StatisticsContext"
import CompareStats from "../components/CompareStats"

export default function ComparePage() {
  const { logs, friends } = useStatistics()

  if (friends.length === 0) {
    return <p className="text-gray-400 dark:text-gray-500 text-sm">Lägg till vänner för att jämföra statistik.</p>
  }

  return <CompareStats myLogs={logs} friends={friends} />
}
