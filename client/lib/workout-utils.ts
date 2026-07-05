import { Dumbbell, Flame, Zap, Target, Footprints, Trophy, Heart, Star } from "lucide-react"
import type { ElementType } from "react"

export const WORKOUT_ICONS: Record<string, ElementType> = {
  Dumbbell, Flame, Zap, Target, Footprints, Trophy, Heart, Star,
}

export function getWorkoutIcon(name?: string): ElementType {
  return WORKOUT_ICONS[name ?? "Dumbbell"] ?? Dumbbell
}

export type ExerciseLog = {
  name: string
  sets: number
  reps: number
  weight: number
  difficulty: string
}

export function getDifficulty(difficulty: string): { label: string; className: string } {
  if (difficulty === "hard") return { label: "Tufft", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" }
  if (difficulty === "easy") return { label: "Lätt", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" }
  return { label: "Medium", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" }
}

export function getOverallDifficulty(exercises: ExerciseLog[]) {
  const difficulties = exercises.map((e) => e.difficulty)
  if (difficulties.some((d) => d === "hard")) return getDifficulty("hard")
  if (difficulties.length > 0 && difficulties.every((d) => d === "easy")) return getDifficulty("easy")
  return getDifficulty("medium")
}

export function getTotalLyft(exercises: ExerciseLog[]): string {
  const total = exercises.reduce((sum, e) => sum + e.sets * e.reps * e.weight, 0)
  if (total === 0) return "–"
  return total.toLocaleString("sv-SE") + " kg"
}

export function estimate1RM(weight: number, reps: number): string {
  if (weight === 0 || reps === 0) return "–"
  const rm = weight * (1 + reps / 30)
  return (Math.round(rm * 2) / 2) + " kg"
}

type WorkoutLogStub = { date: string; plan_name: string }

export function hasChickenLegs(logs: WorkoutLogStub[]): boolean {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date))
  if (sorted.length < 3) return false
  const kws = ["ben", "leg", "legs"]
  return sorted.slice(0, 3).every(l => !kws.some(kw => l.plan_name.toLowerCase().includes(kw)))
}

export function isGymGhost(logs: WorkoutLogStub[]): boolean {
  if (logs.length === 0) return false
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date))
  return Math.floor((Date.now() - new Date(sorted[0].date).getTime()) / 86400000) >= 7
}
