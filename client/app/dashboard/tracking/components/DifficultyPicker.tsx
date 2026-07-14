import type { Difficulty } from "./types"
import { haptic } from "@/lib/haptics"

type Props = {
  value: Difficulty
  onChange: (value: Difficulty) => void
}

export default function DifficultyPicker({ value, onChange }: Props) {
  const pick = (d: Difficulty) => {
    haptic()
    onChange(d)
  }
  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={() => pick("easy")}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          value === "easy"
            ? "border border-green-500 bg-green-500 text-white"
            : "border border-indigo-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
        }`}
      >
        Lätt
      </button>
      <button
        type="button"
        onClick={() => pick("medium")}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          value === "medium"
            ? "border border-amber-500 bg-amber-500 text-amber-950"
            : "border border-indigo-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
        }`}
      >
        Medium
      </button>
      <button
        type="button"
        onClick={() => pick("hard")}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          value === "hard"
            ? "border border-red-500 bg-red-500 text-white"
            : "border border-indigo-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
        }`}
      >
        Tuff
      </button>
    </div>
  )
}
