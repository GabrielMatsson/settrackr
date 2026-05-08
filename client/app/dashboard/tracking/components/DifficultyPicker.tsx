import type { Difficulty } from "./types"

type Props = {
  value: Difficulty
  onChange: (value: Difficulty) => void
}

export default function DifficultyPicker({ value, onChange }: Props) {
  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => onChange("easy")}
        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
          value === "easy"
            ? "bg-green-600 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        }`}
      >
        Lätt
      </button>
      <button
        type="button"
        onClick={() => onChange("medium")}
        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
          value === "medium"
            ? "bg-yellow-500 text-gray-900"
            : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        }`}
      >
        Medium
      </button>
      <button
        type="button"
        onClick={() => onChange("hard")}
        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
          value === "hard"
            ? "bg-red-600 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        }`}
      >
        Tufft
      </button>
    </div>
  )
}
