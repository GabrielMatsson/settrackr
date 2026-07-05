import { getDifficulty } from "@/lib/workout-utils"

export default function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const { label, className } = getDifficulty(difficulty)
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${className}`}>{label}</span>
}
