type Exercise = {
  id: number
  name: string
  sets: number
  reps: number
}

type Owner = {
  id: number
  name: string | null
  email: string
}

type SharedPlan = {
  id: number
  name: string
  exercises: Exercise[]
  owner: Owner
}

type Props = {
  plan: SharedPlan
  onLog: (plan: SharedPlan) => void
  onRemove: (planId: number) => void
}

export default function SharedPlanCard({ plan, onLog, onRemove }: Props) {
  const ownerLabel = plan.owner.name ?? plan.owner.email.split("@")[0]

  const exerciseRows = []
  for (let i = 0; i < plan.exercises.length; i++) {
    const ex = plan.exercises[i]
    exerciseRows.push(
      <div key={i} className="flex items-center justify-between text-sm bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
        <span className="text-gray-900 dark:text-white">{ex.name}</span>
        <span className="text-gray-500 dark:text-gray-400">{ex.sets} set · {ex.reps} reps</span>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h2>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => onLog(plan)}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Logga pass
          </button>
          <button
            onClick={() => onRemove(plan.id)}
            className="text-sm text-red-500 hover:text-red-400 transition-colors"
          >
            Ta bort
          </button>
        </div>
      </div>
      <p className="text-gray-400 dark:text-gray-500 text-xs mb-4">Delad av {ownerLabel}</p>
      <div className="flex flex-col gap-2">{exerciseRows}</div>
    </div>
  )
}
