export type ExerciseLog = {
  name: string
  sets: number
  reps: number
  weight: number
  difficulty: string
}

export function getOverallDifficulty(exercises: ExerciseLog[]) {
  const difficulties = exercises.map((e) => e.difficulty)
  if (difficulties.some((d) => d === "hard")) return { label: "Tufft", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" }
  if (difficulties.length > 0 && difficulties.every((d) => d === "easy")) return { label: "Lätt", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" }
  return { label: "Medium", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" }
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
