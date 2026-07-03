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

export type WorkoutLog = {
  id: number
  date: string
  plan_name: string
  exercises: ExerciseLog[]
}

type StatisticsContextType = {
  logs: WorkoutLog[]
  loading: boolean
  error: string | null
  period: 7 | 30 | 90
  handleDelete: (id: number) => void
  handleUpdate: (updated: WorkoutLog) => void
}

export const StatisticsContext = createContext<StatisticsContextType>({
  logs: [],
  loading: true,
  error: null,
  period: 30,
  handleDelete: () => {},
  handleUpdate: () => {},
})

export function useStatistics() {
  return useContext(StatisticsContext)
}
