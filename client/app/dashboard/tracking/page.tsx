"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CheckCircle, X } from "lucide-react"
import PlanForm from "./components/PlanForm"
import PlanCard from "./components/PlanCard"
import SharedPlanCard from "./components/SharedPlanCard"
import WorkoutLogger from "./components/WorkoutLogger"
import type { Exercise, WorkoutPlan, WorkoutLog } from "./components/types"
import { getPlans, createPlan, updatePlan, deletePlan as apiDeletePlan, createLog, getFriends, getSharedPlans, sharePlan, unsharePlan, leaveSharedPlan } from "@/lib/api"

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

  useEffect(() => {
    getPlans().then(setPlans).catch(() => setError("Kunde inte ansluta till servern"))
    getSharedPlans().then(setSharedPlans).catch(() => {})
    getFriends().then((data: FriendEntry[]) => setFriends(data.map((f) => f.friend))).catch(() => {})
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

  function addExercise() {
    setExercises([...exercises, { name: "", sets: 3, reps: 10 }])
  }

  function removeExercise(index: number) {
    const updated = [...exercises]
    updated.splice(index, 1)
    setExercises(updated)
  }

  function updateExerciseName(index: number, value: string) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], name: value }
    setExercises(updated)
  }

  function updateExerciseSets(index: number, value: number) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], sets: value }
    setExercises(updated)
  }

  function updateExerciseReps(index: number, value: number) {
    const updated = [...exercises]
    updated[index] = { ...updated[index], reps: value }
    setExercises(updated)
  }

  function openCreateForm() {
    setEditingId(null)
    setPlanName("")
    setExercises([{ name: "", sets: 3, reps: 10 }])
    setFormVisible(true)
  }

  function openEditForm(plan: WorkoutPlan) {
    setEditingId(plan.id)
    setPlanName(plan.name)
    setExercises([...plan.exercises])
    setFormVisible(true)
  }

  async function savePlan() {
    if (!planName.trim()) return
    try {
      if (editingId === null) {
        const saved = await createPlan({ name: planName, exercises })
        setPlans([...plans, saved])
      } else {
        const saved = await updatePlan(editingId, { name: planName, exercises })
        const updated = [...plans]
        for (let i = 0; i < updated.length; i++) {
          if (updated[i].id === editingId) {
            updated[i] = saved
            break
          }
        }
        setPlans(updated)
      }
      closeForm()
    } catch {
      setError("Kunde inte spara planen")
    }
  }

  async function handleDeletePlan(id: number) {
    try {
      await apiDeletePlan(id)
      const updated = []
      for (let i = 0; i < plans.length; i++) {
        if (plans[i].id !== id) {
          updated.push(plans[i])
        }
      }
      setPlans(updated)
    } catch {
      setError("Kunde inte ta bort planen")
    }
  }

  function closeForm() {
    setFormVisible(false)
    setEditingId(null)
    setPlanName("")
    setExercises([{ name: "", sets: 3, reps: 10 }])
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

  const planCards = []
  for (let i = 0; i < plans.length; i++) {
    planCards.push(
      <PlanCard
        key={plans[i].id}
        plan={plans[i]}
        onEdit={openEditForm}
        onDelete={handleDeletePlan}
        friends={friends}
        onShare={handleSharePlan}
        onUnshare={handleUnsharePlan}
      />
    )
  }

  const sharedPlanCards = []
  for (let i = 0; i < sharedPlans.length; i++) {
    sharedPlanCards.push(
      <SharedPlanCard
        key={sharedPlans[i].id}
        plan={sharedPlans[i]}
        onLog={(p) => {
          setLoggingPlan({ name: p.name, exercises: p.exercises })
          setLoggerVisible(true)
        }}
        onRemove={handleLeaveSharedPlan}
      />
    )
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

  return (
    <div className="flex flex-col gap-10 max-w-lg mx-auto w-full">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Träningsplaner</h1>
          {!formVisible && (
            <button
              onClick={openCreateForm}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Skapa ny plan
            </button>
          )}
        </div>

        {formVisible && (
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
            onSave={savePlan}
            onCancel={closeForm}
          />
        )}

        {plans.length === 0 && !formVisible && (
          <p className="text-gray-400 dark:text-gray-500">Inga träningsplaner ännu. Skapa din första!</p>
        )}

        <div className="flex flex-col gap-4">{planCards}</div>
      </section>

      {sharedPlans.length > 0 && (
        <>
          <hr className="border-gray-200 dark:border-gray-800" />
          <section className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Delade planer</h2>
            <div className="flex flex-col gap-4">{sharedPlanCards}</div>
          </section>
        </>
      )}

      <hr className="border-gray-200 dark:border-gray-800" />

      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Logga träning</h2>
          {!loggerVisible && (
            <button
              onClick={() => { setLoggingPlan(null); setLoggerVisible(true); setLogSaved(false) }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Logga pass
            </button>
          )}
        </div>

        {loggerVisible && (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <WorkoutLogger
              plans={activePlans}
              onSave={(log) => { saveLog(log); setLoggingPlan(null) }}
              onCancel={() => { setLoggerVisible(false); setLoggingPlan(null) }}
            />
          </div>
        )}

        {logSaved && (
          <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle size={18} className="text-green-500 shrink-0" />
              <span className="text-green-800 dark:text-green-300 text-sm font-medium">Träningspasset är sparat!</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/statistics/history"
                className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline"
              >
                Visa i historik →
              </Link>
              <button onClick={() => setLogSaved(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {!loggerVisible && !logSaved && (
          <p className="text-gray-400 dark:text-gray-500">Logga ett pass för att se det i statistiken.</p>
        )}
      </section>
    </div>
  )
}
