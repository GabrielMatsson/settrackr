"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { CheckCircle, X, Dumbbell, Users, Calendar } from "lucide-react"
import PlanForm from "./components/PlanForm"
import PlanCard from "./components/PlanCard"
import SharedPlanCard from "./components/SharedPlanCard"
import WorkoutLogger from "./components/WorkoutLogger"
import type { Exercise, WorkoutPlan, WorkoutLog } from "./components/types"
import { getPlans, createPlan, updatePlan, deletePlan as apiDeletePlan, createLog, getFriends, getSharedPlans, sharePlan, unsharePlan, leaveSharedPlan, getMe, reorderPlans } from "@/lib/api"

type Friend = { id: number; name: string | null; email: string }
type FriendEntry = { id: number; status: string; friend: Friend }
type SharedPlan = { id: number; name: string; exercises: { id: number; name: string; sets: number; reps: number }[]; owner: Friend }

export default function TrackingPage() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [sharedPlans, setSharedPlans] = useState<SharedPlan[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [formVisible, setFormVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [planName, setPlanName] = useState("")
  const [exercises, setExercises] = useState<Exercise[]>([{ name: "", sets: 3, reps: 10 }])
  const [loggerVisible, setLoggerVisible] = useState(false)
  const [loggingPlan, setLoggingPlan] = useState<{ name: string; exercises: Exercise[] } | null>(null)
  const [logSaved, setLogSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showOverloadHints, setShowOverloadHints] = useState(false)
  const planDragIndex = useRef<number | null>(null)
  const sharedPlanDragIndex = useRef<number | null>(null)

  useEffect(() => {
    getPlans().then(setPlans).catch(() => setError("Kunde inte ansluta till servern"))
    getSharedPlans().then(setSharedPlans).catch(() => {})
    getFriends().then((data: FriendEntry[]) => setFriends(data.map((f) => f.friend))).catch(() => {})
    getMe().then((p: { show_overload_hints: boolean }) => setShowOverloadHints(p.show_overload_hints ?? false)).catch(() => {})
  }, [])

  async function handleSharePlan(planId: number, friendId: number) {
    await sharePlan(planId, friendId)
    const updated = await getPlans()
    setPlans(updated)
  }

  async function handleUnsharePlan(planId: number, friendId: number) {
    await unsharePlan(planId, friendId)
    const updated = await getPlans()
    setPlans(updated)
  }

  async function handleLeaveSharedPlan(planId: number) {
    try {
      await leaveSharedPlan(planId)
      setSharedPlans(sharedPlans.filter((p) => p.id !== planId))
    } catch {
      setError("Kunde inte ta bort delad plan")
    }
  }

  function addExercise() { setExercises([...exercises, { name: "", sets: 3, reps: 10 }]) }
  function removeExercise(index: number) { const u = [...exercises]; u.splice(index, 1); setExercises(u) }
  function updateExerciseName(index: number, value: string) { const u = [...exercises]; u[index] = { ...u[index], name: value }; setExercises(u) }
  function updateExerciseSets(index: number, value: number) { const u = [...exercises]; u[index] = { ...u[index], sets: value }; setExercises(u) }
  function updateExerciseReps(index: number, value: number) { const u = [...exercises]; u[index] = { ...u[index], reps: value }; setExercises(u) }
  function reorderExercise(from: number, to: number) {
    if (from === to) return
    const updated = [...exercises]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    setExercises(updated)
  }

  function openCreateForm() {
    setEditingId(null); setPlanName(""); setExercises([{ name: "", sets: 3, reps: 10 }]); setFormVisible(true)
  }

  function openEditForm(plan: WorkoutPlan) {
    setEditingId(plan.id); setPlanName(plan.name); setExercises([...plan.exercises]); setFormVisible(true)
  }

  async function savePlan() {
    if (!planName.trim()) return
    try {
      if (editingId === null) {
        const saved = await createPlan({ name: planName, exercises })
        setPlans([...plans, saved])
      } else {
        const saved = await updatePlan(editingId, { name: planName, exercises })
        setPlans(plans.map((p) => (p.id === editingId ? saved : p)))
      }
      closeForm()
    } catch {
      setError("Kunde inte spara planen")
    }
  }

  async function handleDeletePlan(id: number) {
    try {
      await apiDeletePlan(id)
      setPlans(plans.filter((p) => p.id !== id))
    } catch {
      setError("Kunde inte ta bort planen")
    }
  }

  function closeForm() {
    setFormVisible(false); setEditingId(null); setPlanName(""); setExercises([{ name: "", sets: 3, reps: 10 }])
  }

  async function saveLog(log: WorkoutLog) {
    try {
      await createLog({ plan_name: log.planName, date: log.date, exercises: log.exercises })
      setLoggerVisible(false)
      setLogSaved(true)
    } catch {
      setError("Kunde inte spara träningspasset")
    }
  }

  async function reorderPlan(from: number, to: number) {
    if (from === to) return
    const updated = [...plans]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    setPlans(updated)
    await reorderPlans(updated.map((p) => p.id))
  }

  function reorderSharedPlan(from: number, to: number) {
    if (from === to) return
    const updated = [...sharedPlans]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    setSharedPlans(updated)
  }

  function openLogger(plan?: { name: string; exercises: Exercise[] }) {
    setLoggingPlan(plan ?? null)
    setLoggerVisible(true)
    setLogSaved(false)
  }

  const allPlans: WorkoutPlan[] = [
    ...plans,
    ...sharedPlans.map((p) => ({
      id: p.id,
      name: `${p.name} (${p.owner.name ?? p.owner.email.split("@")[0]})`,
      exercises: p.exercises,
    })),
  ]
  const activePlans = loggingPlan ? [loggingPlan as unknown as WorkoutPlan] : allPlans

  const totalExercises = plans.reduce((acc, p) => acc + p.exercises.length, 0)

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Träningsplaner</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">Skapa, hantera och följ dina träningsplaner.</p>
        </div>
        <div className="flex items-center gap-2 sm:w-auto w-full">
          <button
            onClick={() => openLogger()}
            className="flex-1 sm:flex-none border border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-medium px-4 py-2 rounded-lg transition-colors text-sm"
          >
            + Logga pass
          </button>
          <button
            onClick={openCreateForm}
            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
          >
            + Skapa ny plan
          </button>
        </div>
      </div>

      {logSaved && (
        <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl px-5 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle size={18} className="text-green-500 shrink-0" />
            <span className="text-green-800 dark:text-green-300 text-sm font-medium">Träningspasset är sparat!</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/statistics/history" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
              Visa i historik →
            </Link>
            <button onClick={() => setLogSaved(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 items-start">
        <div className="flex flex-col gap-4">
          {formVisible && (
            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-6 bg-white dark:bg-gray-950">
              <PlanForm
                isEditing={editingId !== null}
                planName={planName}
                exercises={exercises}
                onPlanNameChange={setPlanName}
                onAddExercise={addExercise}
                onRemoveExercise={removeExercise}
                onUpdateName={updateExerciseName}
                onUpdateSets={updateExerciseSets}
                onUpdateReps={updateExerciseReps}
                onReorder={reorderExercise}
                onSave={savePlan}
                onCancel={closeForm}
              />
            </div>
          )}

          {loggerVisible && (
            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-6 bg-white dark:bg-gray-950">
              <WorkoutLogger
                plans={activePlans}
                onSave={(log) => { saveLog(log); setLoggingPlan(null) }}
                onCancel={() => { setLoggerVisible(false); setLoggingPlan(null) }}
                showOverloadHints={showOverloadHints}
              />
            </div>
          )}
          {/* Own plans panel */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-950">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                <Dumbbell size={15} className="text-indigo-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Träningsplaner</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Dina färdiga träningspass</p>
              </div>
            </div>

            {plans.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm px-5 py-4">Inga planer ännu. Skapa din första!</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {plans.map((plan, i) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onEdit={openEditForm}
                    onDelete={handleDeletePlan}
                    onLog={(p) => openLogger({ name: p.name, exercises: p.exercises })}
                    friends={friends}
                    onShare={handleSharePlan}
                    onUnshare={handleUnsharePlan}
                    onDragStart={() => { planDragIndex.current = i }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => { if (planDragIndex.current !== null) reorderPlan(planDragIndex.current, i) }}
                  />
                ))}
              </div>
            )}

            <button
              onClick={openCreateForm}
              className="w-full text-center text-indigo-600 dark:text-indigo-300 text-sm font-medium py-3 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors rounded-b-2xl border-t border-indigo-100 dark:border-indigo-900/50"
            >
              + Skapa ny plan
            </button>
          </div>

          {/* Shared plans panel */}
          {sharedPlans.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-950">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <Users size={15} className="text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Delade planer</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">Träningsplaner som delats med dig</p>
                </div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {sharedPlans.map((plan, i) => (
                  <SharedPlanCard
                    key={plan.id}
                    plan={plan}
                    onLog={(p) => openLogger({ name: p.name, exercises: p.exercises })}
                    onRemove={handleLeaveSharedPlan}
                    onDragStart={() => { sharedPlanDragIndex.current = i }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => { if (sharedPlanDragIndex.current !== null) reorderSharedPlan(sharedPlanDragIndex.current, i) }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Overview panel */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex flex-col gap-5 bg-white dark:bg-gray-950 sticky top-8">
          <h3 className="font-semibold text-gray-900 dark:text-white">Översikt</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Calendar size={16} className="text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{plans.length}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Planer</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                <Dumbbell size={16} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{totalExercises}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Övningar</p>
              </div>
            </div>
            {sharedPlans.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <Users size={16} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{sharedPlans.length}</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Delade planer</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
