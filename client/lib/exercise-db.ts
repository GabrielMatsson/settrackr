import type { Muscle } from "./muscle-map"

// Exercise library vendored from free-exercise-db (public domain):
// https://github.com/yuhonas/free-exercise-db
// Muscle names are pre-translated to SetTrackr slugs at build time (see the
// slimming script noted in the JSON's git history). Images are served from
// the dataset's GitHub raw content.

export type LibraryExercise = {
  name: string
  level: "beginner" | "intermediate" | "expert"
  equipment: string | null
  category: string
  mechanic: "compound" | "isolation" | null
  primary: Muscle[]
  secondary: Muscle[]
  instructions: string[]
  image: string | null
}

const IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/"

export function exerciseImageUrl(ex: LibraryExercise): string | null {
  return ex.image ? `${IMAGE_BASE}${ex.image}` : null
}

// Swedish labels for the dataset's vocabulary (UI is Swedish throughout).
export const LEVEL_LABELS: Record<LibraryExercise["level"], string> = {
  beginner: "Nybörjare",
  intermediate: "Medel",
  expert: "Avancerad",
}

export const EQUIPMENT_LABELS: Record<string, string> = {
  "barbell": "Skivstång",
  "dumbbell": "Hantlar",
  "body only": "Kroppsvikt",
  "machine": "Maskin",
  "cable": "Kabel",
  "kettlebells": "Kettlebell",
  "bands": "Gummiband",
  "e-z curl bar": "EZ-stång",
  "exercise ball": "Pilatesboll",
  "medicine ball": "Medicinboll",
  "foam roll": "Foamroller",
  "other": "Övrigt",
}

export function equipmentLabel(equipment: string | null): string {
  if (!equipment) return "Övrigt"
  return EQUIPMENT_LABELS[equipment] ?? "Övrigt"
}

// The dataset is ~170 kB — load it lazily so it never enters the main bundle.
let cached: LibraryExercise[] | null = null

export async function loadExerciseDb(): Promise<LibraryExercise[]> {
  if (cached) return cached
  const mod = await import("./exercise-db.json")
  cached = mod.default as LibraryExercise[]
  return cached
}

// Union of primary + secondary movers — same semantics as the app's own
// keyword rules (e.g. bench press -> chest, frontDelts, triceps).
export function allMuscles(ex: LibraryExercise): Muscle[] {
  const out: Muscle[] = [...ex.primary]
  for (const m of ex.secondary) if (!out.includes(m)) out.push(m)
  return out
}
