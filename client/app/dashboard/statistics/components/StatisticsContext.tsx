"use client"

import { createContext, useContext } from "react"

type ExerciseLog = {
  name: string
  sets: number
  reps: number
  weight: number
  difficulty: string
  done: boolean
}

type Comment = {
  id: number
  body: string
  created_at: string
  author: { id: number; name: string | null; email: string }
}

export type WorkoutLog = {
  id: number
  date: string
  plan_name: string
  exercises: ExerciseLog[]
  reaction_count?: number
  comments?: Comment[]
}

export type Friend = { id: number; name: string | null; email: string }

type StatisticsContextType = {
  logs: WorkoutLog[]
  friends: Friend[]
  currentUserEmail: string
  loading: boolean
  error: string | null
  period: 7 | 30 | 90
  handleDelete: (id: number) => void
  handleUpdate: (updated: WorkoutLog) => void
}

export const StatisticsContext = createContext<StatisticsContextType>({
  logs: [],
  friends: [],
  currentUserEmail: "",
  loading: true,
  error: null,
  period: 30,
  handleDelete: () => {},
  handleUpdate: () => {},
})

export function useStatistics() {
  return useContext(StatisticsContext)
}
