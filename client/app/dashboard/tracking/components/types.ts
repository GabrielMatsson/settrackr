export type Exercise = {
  name: string
  sets: number
  reps: number
}

export type WorkoutPlan = {
  id: number
  name: string
  icon?: string
  copied_from_name?: string | null
  exercises: Exercise[]
}

export type Difficulty = "easy" | "medium" | "hard"

export type ExerciseLog = {
  name: string
  sets: number
  reps: number
  weight: number // extra load in kg (on top of body weight when is_bodyweight)
  difficulty: Difficulty
  done: boolean
  is_bodyweight?: boolean
}

export type WorkoutLog = {
  id: number
  date: string
  planName: string
  icon?: string
  exercises: ExerciseLog[]
}
