"use client"

import { useState, useEffect } from "react"
import PlanForm from "./components/PlanForm"
import PlanCard from "./components/PlanCard"
import WorkoutLogger from "./components/WorkoutLogger"
import type { Exercise, WorkoutPlan, WorkoutLog } from "./components/types"
import { getPlans, createPlan, updatePlan, deletePlan as apiDeletePlan, createLog } from "@/lib/api"

export default function TrackingPage() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [formVisible, setFormVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [planName, setPlanName] = useState("")
  const [exercises, setExercises] = useState<Exercise[]>([{ name: "", sets: 3, reps: 10 }])
  const [loggerVisible, setLoggerVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load plans from the backend when the page mounts
  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch(() => setError("Kunde inte ansluta till servern"))
  }, [])

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
      />
    )
  }

  return (
    <div className="flex flex-col gap-10 max-w-lg mx-auto w-full">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Träningsplaner</h1>
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
          <p className="text-gray-500">Inga träningsplaner ännu. Skapa din första!</p>
        )}

        <div className="flex flex-col gap-4">{planCards}</div>
      </section>

      <hr className="border-gray-800" />

      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Logga träning</h2>
          {!loggerVisible && (
            <button
              onClick={() => setLoggerVisible(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Logga pass
            </button>
          )}
        </div>

        {loggerVisible && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <WorkoutLogger
              plans={plans}
              onSave={saveLog}
              onCancel={() => setLoggerVisible(false)}
            />
          </div>
        )}

        {!loggerVisible && (
          <p className="text-gray-500">Logga ett pass för att se det i statistiken.</p>
        )}
      </section>
    </div>
  )
}
