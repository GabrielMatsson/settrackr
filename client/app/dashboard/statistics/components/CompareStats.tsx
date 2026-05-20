"use client"

import { useState, useEffect } from "react"
import { getFriendLogs } from "@/lib/api"
import ProgressCharts from "./ProgressCharts"

type ExerciseLog = {
  name: string
  sets: number
  reps: number
  weight: number
  difficulty: string
  done: boolean
}

type WorkoutLog = {
  id: number
  date: string
  plan_name: string
  exercises: ExerciseLog[]
}

type Friend = {
  id: number
  name: string | null
  email: string
}

type Props = {
  myLogs: WorkoutLog[]
  friends: Friend[]
}

export default function CompareStats({ myLogs, friends }: Props) {
  const [selectedFriendId, setSelectedFriendId] = useState<number | "">("")
  const [friendLogs, setFriendLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (friends.length > 0 && selectedFriendId === "") {
      handleSelect(friends[0].id)
    }
  }, [friends])

  async function handleSelect(id: number | "") {
    setSelectedFriendId(id)
    if (!id) { setFriendLogs([]); return }
    setLoading(true)
    try {
      const data = await getFriendLogs(id)
      setFriendLogs(data)
    } catch {
      setFriendLogs([])
    } finally {
      setLoading(false)
    }
  }

  const selectedFriend = friends.find((f) => f.id === selectedFriendId)
  const friendName = selectedFriend ? (selectedFriend.name ?? selectedFriend.email.split("@")[0]) : undefined

  if (friends.length === 0) return null

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-5 bg-white dark:bg-gray-950 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900 dark:text-white font-semibold text-lg">Jämför statistik</h2>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5">
          <select
            value={selectedFriendId}
            onChange={(e) => handleSelect(e.target.value ? Number(e.target.value) : "")}
            className="bg-transparent text-gray-900 dark:text-white text-sm focus:outline-none"
          >
            <option value="">Välj en vän…</option>
            {friends.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name ?? f.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className="text-gray-400 dark:text-gray-500 text-sm">Hämtar data…</p>}

      {selectedFriendId === "" && !loading && (
        <p className="text-gray-400 dark:text-gray-500 text-sm py-4 text-center">Välj en vän för att jämföra viktutveckling.</p>
      )}

      {selectedFriendId !== "" && !loading && (
        <ProgressCharts
          logs={myLogs}
          friendLogs={friendLogs}
          friendName={friendName}
          hideBarChart
          noCard
        />
      )}
    </div>
  )
}
