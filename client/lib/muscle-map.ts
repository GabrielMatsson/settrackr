// Maps free-typed exercise names to the muscle groups they train, so the
// statistics muscle heatmap can shade a body diagram. Exercise names are
// user-entered (Swedish + English), so this is a keyword dictionary you can
// freely extend — add a rule below and the map picks it up. The muscle slugs
// here must match those in statistics/components/muscleBodyPaths.ts.

export type Muscle =
  | "chest"
  | "frontDelts"
  | "backDelts"
  | "biceps"
  | "triceps"
  | "forearms"
  | "abs"
  | "obliques"
  | "traps"
  | "lats"
  | "lowerBack"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"

export const MUSCLE_LABELS: Record<Muscle, string> = {
  chest: "Bröst",
  frontDelts: "Främre axel",
  backDelts: "Bakre axel",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Underarm",
  abs: "Mage",
  obliques: "Sneda magmuskler",
  traps: "Kappmuskel",
  lats: "Övre rygg",
  lowerBack: "Nedre rygg",
  quads: "Framsida lår",
  hamstrings: "Baksida lår",
  glutes: "Rumpa/glutes",
  calves: "Vader",
}

// A rule fires when the (lowercased) exercise name contains any `kw` substring
// and none of the optional `not` substrings. All firing rules are unioned.
type Rule = { kw: string[]; muscles: Muscle[]; not?: string[] }

export const MUSCLE_RULES: Rule[] = [
  // Chest press
  { kw: ["bänkpress", "bench", "dumbbellpress", "hantelpress", "bröstpress", "chest press", "chestpress", "incline", "lutande"], muscles: ["chest", "frontDelts", "triceps"] },
  { kw: ["armhävning", "push-up", "pushup", "push up"], muscles: ["chest", "triceps", "frontDelts"] },
  // Chest isolation
  { kw: ["pec", "fly", "flye", "flyes", "flys", "kabelcross", "cable cross", "crossover", "cross över"], muscles: ["chest"], not: ["rear", "reverse", "omvänd", "bakre"] },
  { kw: ["dips", "dip "], muscles: ["chest", "triceps"] },
  // Triceps
  { kw: ["tricep", "triceps", "pushdown", "pressdown", "skull", "french press", "frenchpress", "kickback"], muscles: ["triceps"] },
  // Biceps (guard against leg curls)
  { kw: ["bicep", "biceps", "hammercurl", "hammer curl", "hantelcurl", "preacher", "scott", "concentration", "spider", "curl"], muscles: ["biceps"], not: ["lår", "leg curl", "legcurl", "ben curl", "bencurl", "nordic", "hamstring"] },
  // Forearms
  { kw: ["forearm", "underarm", "wrist", "handled", "grip", "farmer", "gårdsgång"], muscles: ["forearms"] },
  // Shoulders
  { kw: ["front raise", "frontraise", "framåtlyft"], muscles: ["frontDelts"] },
  { kw: ["axelpress", "axel press", "shoulder press", "shoulderpress", "militärpress", "military", "overhead press", "overheadpress", "ohp", "arnold"], muscles: ["frontDelts", "triceps", "traps"] },
  { kw: ["lateral", "sidolyft", "side raise", "laterals"], muscles: ["frontDelts", "backDelts"] },
  { kw: ["rear delt", "reardelt", "rear-delt", "rear fly", "face pull", "facepull", "omvänd fly", "reverse fly", "reverse pec"], muscles: ["backDelts", "traps"] },
  { kw: ["shrug", "axelryck", "trapez"], muscles: ["traps"] },
  // Back
  { kw: ["row", "rodd", "t-bar", "tbar", "seal row"], muscles: ["lats", "traps", "biceps"] },
  { kw: ["latsdrag", "lat pulldown", "lat pull", "pulldown", "pull down", "chins", "chin-up", "chinup", "pullup", "pull-up", "pull up"], muscles: ["lats", "biceps"] },
  // Posterior chain
  { kw: ["marklyft", "mark", "deadlift", "rdl", "rumänsk", "romanian", "stiff leg"], muscles: ["lowerBack", "glutes", "hamstrings", "traps"] },
  { kw: ["ryggresning", "back extension", "hyperextension", "hyperext"], muscles: ["lowerBack"] },
  // Legs
  { kw: ["knäböj", "squat", "böj", "hack squat", "benböj", "pistol"], muscles: ["quads", "glutes"], not: ["sido"] },
  { kw: ["benpress", "leg press", "legpress"], muscles: ["quads", "glutes"] },
  { kw: ["utfall", "lunge", "split squat", "bulgar", "step up", "stepup", "uppsteg"], muscles: ["quads", "glutes"] },
  { kw: ["lårcurl", "leg curl", "legcurl", "ben curl", "bencurl", "hamstring", "nordic"], muscles: ["hamstrings"] },
  { kw: ["benspark", "leg extension", "legextension", "benextension"], muscles: ["quads"] },
  { kw: ["höftlyft", "hip thrust", "hipthrust", "glute", "hip bridge", "bäckenlyft"], muscles: ["glutes", "hamstrings"] },
  { kw: ["vad", "calf", "calves", "tåhäv"], muscles: ["calves"] },
  // Core
  { kw: ["mage", "crunch", "planka", "plank", "sit-up", "situp", "sit up", "benlyft", "leg raise", "hanging leg", "toes to bar", "ab wheel", "magrulle"], muscles: ["abs"] },
  { kw: ["oblique", "sneda", "sidoböj", "side bend", "russian twist", "rysk", "wood chop", "vedhugg", "side plank", "sidoplanka"], muscles: ["obliques"] },
]

export function musclesForExercise(name: string): Muscle[] {
  const n = name.toLowerCase()
  const found = new Set<Muscle>()
  for (const rule of MUSCLE_RULES) {
    if (rule.not && rule.not.some((x) => n.includes(x))) continue
    if (rule.kw.some((k) => n.includes(k))) {
      for (const m of rule.muscles) found.add(m)
    }
  }
  return [...found]
}

// A user-defined override fully replaces the keyword result for an exact name
// (case-insensitive). `overrides` is keyed by the lowercased, trimmed name.
export type MuscleOverride = { id: number; name: string; muscles: Muscle[] }

export function musclesForExerciseWithOverrides(name: string, overrides: Record<string, Muscle[]>): Muscle[] {
  const key = name.trim().toLowerCase()
  const o = overrides[key]
  if (o && o.length) return o
  return musclesForExercise(name)
}

// Grouping for the muscle picker UI.
export const MUSCLE_GROUPS: { label: string; muscles: Muscle[] }[] = [
  { label: "Överkropp", muscles: ["chest", "frontDelts", "backDelts", "traps", "lats", "lowerBack"] },
  { label: "Armar", muscles: ["biceps", "triceps", "forearms"] },
  { label: "Core", muscles: ["abs", "obliques"] },
  { label: "Ben", muscles: ["quads", "hamstrings", "glutes", "calves"] },
]
