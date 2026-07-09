"use client"

import { anteriorPolys, posteriorPolys, BODY_VIEWBOX } from "./muscleBodyPaths"
import type { Muscle } from "@/lib/muscle-map"

// 5-step scale (0 = untrained/base), matching WorkoutHeatmap's indigo shades.
const FILL_CLASSES = [
  "fill-gray-200 dark:fill-gray-800",
  "fill-indigo-200 dark:fill-indigo-900",
  "fill-indigo-300 dark:fill-indigo-700",
  "fill-indigo-400 dark:fill-indigo-600",
  "fill-indigo-600 dark:fill-indigo-400",
]

type Props = {
  view: "front" | "back"
  levels: Partial<Record<Muscle, number>>
  labelFor?: (muscle: Muscle) => string
}

export default function MuscleBody({ view, levels, labelFor }: Props) {
  const polys = view === "front" ? anteriorPolys : posteriorPolys
  return (
    <svg
      viewBox={BODY_VIEWBOX}
      className="h-64 w-auto"
      role="img"
      aria-label={view === "front" ? "Framsida" : "Baksida"}
    >
      {polys.map((p, i) => {
        const level = p.muscle ? (levels[p.muscle] ?? 0) : 0
        return (
          <polygon
            key={i}
            points={p.points}
            className={`${FILL_CLASSES[level]} stroke-white dark:stroke-gray-950`}
            strokeWidth={0.4}
          >
            {p.muscle && labelFor && <title>{labelFor(p.muscle)}</title>}
          </polygon>
        )
      })}
    </svg>
  )
}
