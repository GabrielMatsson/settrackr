export type Exercise = {
  name: string
  sets: number
  reps: number
}

export type WorkoutPlan = {
  id: number
  name: string
  copied_from_name?: string | null
  exercises: Exercise[]
}

export type Difficulty = "easy" | "medium" | "hard"

export type ExerciseLog = {
  name: string
  sets: number
  reps: number
  weight: number
  difficulty: Difficulty
  done: boolean
}

export type WorkoutLog = {
  id: number
  date: string
  planName: string
  exercises: ExerciseLog[]
}
