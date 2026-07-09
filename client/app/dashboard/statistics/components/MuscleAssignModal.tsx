"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { setExerciseMuscles } from "@/lib/api"
import { MUSCLE_GROUPS, MUSCLE_LABELS, type Muscle } from "@/lib/muscle-map"

type Props = {
  name: string
  initial: Muscle[]
  onClose: () => void
  onSaved: () => void
}

export default function MuscleAssignModal({ name, initial, onClose, onSaved }: Props) {
  const [selected, setSelected] = useState<Set<Muscle>>(() => new Set(initial))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(m: Muscle) {
    const next = new Set(selected)
    if (next.has(m)) next.delete(m)
    else next.add(m)
    setSelected(next)
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await setExerciseMuscles(name, [...selected])
      onSaved()
    } catch {
      setError("Kunde inte spara")
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-5 w-full max-w-md flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-gray-900 dark:text-white font-semibold truncate">{name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Välj muskelgrupper övningen tränar</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {MUSCLE_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-1.5">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{group.label}</span>
              <div className="flex flex-wrap gap-1.5">
                {group.muscles.map((m) => {
                  const on = selected.has(m)
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggle(m)}
                      className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                        on
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-500"
                      }`}
                    >
                      {MUSCLE_LABELS[m]}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            onClick={save}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {saving ? "Sparar…" : "Spara"}
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-5 py-2"
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  )
}
