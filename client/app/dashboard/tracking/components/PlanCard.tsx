"use client"

import { useState, createElement } from "react"
import { ChevronDown, GripVertical } from "lucide-react"
import PressableButton from "@/app/components/PressableButton"
import { getWorkoutIcon } from "@/lib/workout-utils"
import type { WorkoutPlan } from "./types"

type Friend = { id: number; name: string | null; email: string }
type SharedAccessSummary = { id: number; friend: Friend; status: string }

type Props = {
  plan: WorkoutPlan & { shared_with?: SharedAccessSummary[] }
  onEdit: (plan: WorkoutPlan) => void
  onDelete: (id: number) => void
  onLog: (plan: WorkoutPlan) => void
  friends?: Friend[]
  onShare?: (planId: number, friendId: number) => Promise<void>
  onUnshare?: (planId: number, friendId: number) => void
  // Starts a Motion Reorder drag from the grip handle
  onGripPointerDown?: (e: React.PointerEvent) => void
}

export default function PlanCard({ plan, onEdit, onDelete, onLog, friends = [], onShare, onUnshare, onGripPointerDown }: Props) {
  const [expanded, setExpanded] = useState(false)
  const planIcon = getWorkoutIcon(plan.icon)
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

  return (
    <div>
      <div
        className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group"
        onClick={() => setExpanded(!expanded)}
      >
        {onGripPointerDown && (
          <GripVertical
            size={16}
            className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0 touch-none"
            onPointerDown={(e) => { e.stopPropagation(); onGripPointerDown(e) }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
          {createElement(planIcon, { size: 15, className: "text-indigo-500" })}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 dark:text-white font-medium text-sm">{plan.name}</p>
          {plan.copied_from_name && (
            <p className="text-gray-400 dark:text-gray-500 text-xs">Kopia av {plan.copied_from_name}</p>
          )}
        </div>
        <span className="text-gray-400 dark:text-gray-500 text-sm shrink-0">{plan.exercises.length} övningar</span>
        {shared && <span className="text-green-500 dark:text-green-400 text-xs shrink-0">Delad!</span>}
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`}
        />
      </div>

      {expanded && (
        <div className="px-5 pb-4 pt-3 flex flex-col gap-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
          <div className="flex flex-col gap-1.5">
            {plan.exercises.map((ex, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-100 dark:border-gray-700"
              >
                <span className="text-gray-900 dark:text-white">{ex.name || "Namnlös övning"}</span>
                <span className="text-gray-400 dark:text-gray-500">{ex.sets} set · {ex.reps} reps</span>
              </div>
            ))}
          </div>

          {sharingOpen && (
            <div className="flex flex-col gap-2">
              {sharedWith.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {sharedWith.map((s) => (
                    <span key={s.id} className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-1 rounded-full">
                      {s.friend.name ?? s.friend.email.split("@")[0]}
                      {s.status === "pending" && <span className="text-gray-400 dark:text-gray-500"> (väntar)</span>}
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
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
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
                <p className="text-gray-400 dark:text-gray-500 text-xs">Planen är redan delad med alla dina vänner.</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <PressableButton
              onClick={() => onLog(plan)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              Logga pass
            </PressableButton>
            {friends.length > 0 && (
              <button
                onClick={() => setSharingOpen(!sharingOpen)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Dela
              </button>
            )}
            <button
              onClick={() => onEdit(plan)}
              className="text-sm text-indigo-500 hover:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              Redigera
            </button>
            <button
              onClick={() => onDelete(plan.id)}
              className="text-sm text-red-500 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto"
            >
              Ta bort
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
