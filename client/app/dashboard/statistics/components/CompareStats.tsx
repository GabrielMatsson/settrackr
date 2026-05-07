"use client"

import { useState } from "react"
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">Jämför statistik</h2>
        <select
          value={selectedFriendId}
          onChange={(e) => handleSelect(e.target.value ? Number(e.target.value) : "")}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
        >
          <option value="">Välj en vän…</option>
          {friends.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name ?? f.email}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-500 text-sm">Hämtar data…</p>}

      {selectedFriendId !== "" && !loading && (
        <ProgressCharts
          logs={myLogs}
          friendLogs={friendLogs}
          friendName={friendName}
          hideBarChart
        />
      )}
    </div>
  )
}
