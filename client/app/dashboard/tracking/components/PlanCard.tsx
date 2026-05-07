import { useState } from "react"
import type { WorkoutPlan } from "./types"

type Friend = {
  id: number
  name: string | null
  email: string
}

type SharedAccessSummary = {
  id: number
  friend: Friend
  status: string
}

type Props = {
  plan: WorkoutPlan & { shared_with?: SharedAccessSummary[] }
  onEdit: (plan: WorkoutPlan) => void
  onDelete: (id: number) => void
  friends?: Friend[]
  onShare?: (planId: number, friendId: number) => Promise<void>
  onUnshare?: (planId: number, friendId: number) => void
}

export default function PlanCard({ plan, onEdit, onDelete, friends = [], onShare, onUnshare }: Props) {
  const [sharingOpen, setSharingOpen] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<number | "">("")
  const [shared, setShared] = useState(false)

  const sharedWith: SharedAccessSummary[] = plan.shared_with ?? []
  const sharable = friends.filter((f) => !sharedWith.some((s) => s.friend.id === f.id))

  async function handleShare() {
    if (!selectedFriend || !onShare) return
    await onShare(plan.id, Number(selectedFriend))
    setSelectedFriend("")
    setSharingOpen(false)
    setShared(true)
    setTimeout(() => setShared(false), 2500)
  }

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
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
          {plan.copied_from_name && (
            <p className="text-gray-500 text-xs mt-0.5">Kopia av {plan.copied_from_name}</p>
          )}
        </div>
        <div className="flex gap-4 items-center">
          {shared && <span className="text-green-400 text-xs">Delad!</span>}
          {friends.length > 0 && (
            <button
              onClick={() => setSharingOpen(!sharingOpen)}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Dela
            </button>
          )}
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

      {sharingOpen && (
        <div className="mb-4 flex flex-col gap-2">
          {sharedWith.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {sharedWith.map((s) => (
                <span key={s.id} className="flex items-center gap-1 bg-indigo-900/40 text-indigo-300 text-xs px-2 py-1 rounded-full">
                  {s.friend.name ?? s.friend.email.split("@")[0]}
                  {s.status === "pending" && <span className="text-gray-500"> (väntar)</span>}
                  {onUnshare && (
                    <button onClick={() => onUnshare(plan.id, s.friend.id)} className="hover:text-red-400 transition-colors ml-1">×</button>
                  )}
                </span>
              ))}
            </div>
          )}
          {sharable.length > 0 ? (
            <div className="flex gap-2">
              <select
                value={selectedFriend}
                onChange={(e) => setSelectedFriend(e.target.value ? Number(e.target.value) : "")}
                className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Välj vän att dela med…</option>
                {sharable.map((f) => (
                  <option key={f.id} value={f.id}>{f.name ?? f.email}</option>
                ))}
              </select>
              <button
                onClick={handleShare}
                disabled={!selectedFriend}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
              >
                Dela
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-xs">Planen är redan delad med alla dina vänner.</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {exerciseRows}
      </div>
    </div>
  )
}
