import type { WorkoutPlan } from "./types"

type Props = {
  plan: WorkoutPlan
  onEdit: (plan: WorkoutPlan) => void
  onDelete: (id: number) => void
}

export default function PlanCard({ plan, onEdit, onDelete }: Props) {
  const exerciseRows = []
  for (let i = 0; i < plan.exercises.length; i++) {
    const ex = plan.exercises[i]
    exerciseRows.push(
      <div key={i} className="flex items-center justify-between text-sm bg-gray-800 rounded-lg px-4 py-2">
        <span className="text-white">{ex.name || "Namnlös övning"}</span>
        <span className="text-gray-400">{ex.sets} set · {ex.reps} reps</span>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
        <div className="flex gap-4">
          <button
            onClick={() => onEdit(plan)}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Redigera
          </button>
          <button
            onClick={() => onDelete(plan.id)}
            className="text-sm text-red-500 hover:text-red-400 transition-colors"
          >
            Ta bort
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {exerciseRows}
      </div>
    </div>
  )
}
