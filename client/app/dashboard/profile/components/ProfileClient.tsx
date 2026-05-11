"use client"

import { useState, useEffect } from "react"
import { getFriends, getApiToken, acceptFriendRequest, deleteFriendship, acceptPlanInvitation, declinePlanInvitation, sendFriendRequest, getLogs, getMe, updateMe } from "@/lib/api"
import { handleSignOut } from "../actions"
import FriendProfile from "./FriendProfile"

type Friend = {
  id: number
  name: string | null
  email: string
}

type Friendship = {
  id: number
  status: string
  friend: Friend
}

type PlanInvitation = {
  id: number
  plan_id: number
  plan_name: string
  from_user: { id: number; name: string | null; email: string }
}

type Props = {
  name: string
  email: string
  image: string | null
}

const API_URL = "http://localhost:8000"

export default function ProfileClient({ name, email, image }: Props) {
  const [friends, setFriends] = useState<Friendship[]>([])
  const [requests, setRequests] = useState<Friendship[]>([])
  const [invitations, setInvitations] = useState<PlanInvitation[]>([])
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [addingFriend, setAddingFriend] = useState(false)
  const [friendEmail, setFriendEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [logs, setLogs] = useState<{ date: string }[]>([])
  const [profile, setProfile] = useState<{ name: string | null; email: string; weekly_goal: number } | null>(null)
  const [settingsName, setSettingsName] = useState("")
  const [settingsGoal, setSettingsGoal] = useState(3)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  useEffect(() => {
    getFriends().then(setFriends).catch(() => setError("Kunde inte hämta vänner"))
    getLogs().then(setLogs).catch(() => {})
    getMe().then((p) => {
      setProfile(p)
      setSettingsName(p.name ?? "")
      setSettingsGoal(p.weekly_goal)
    }).catch(() => {})

    let reqEs: EventSource | null = null
    let invEs: EventSource | null = null

    getApiToken().then((token) => {
      reqEs = new EventSource(`${API_URL}/friends/requests/stream?token=${token}`)
      reqEs.onmessage = (e) => { try { setRequests(JSON.parse(e.data)) } catch {} }

      invEs = new EventSource(`${API_URL}/plans/invitations/stream?token=${token}`)
      invEs.onmessage = (e) => { try { setInvitations(JSON.parse(e.data)) } catch {} }
    })

    return () => { reqEs?.close(); invEs?.close() }
  }, [])

  async function handleSaveSettings() {
    setSettingsSaving(true)
    try {
      const updated = await updateMe({ name: settingsName || null, weekly_goal: settingsGoal })
      setProfile(updated)
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 2000)
    } catch {
      setError("Kunde inte spara inställningar")
    } finally {
      setSettingsSaving(false)
    }
  }

  async function handleSendRequest() {
    if (!friendEmail.trim()) return
    try {
      await sendFriendRequest(friendEmail.trim())
      setSuccess("Vänförfrågan skickad!")
      setFriendEmail("")
      setAddingFriend(false)
      setError(null)
    } catch {
      setError("Kunde inte skicka vänförfrågan. Kontrollera att e-postadressen är rätt.")
    }
  }

  async function handleAccept(friendshipId: number) {
    try {
      const accepted = await acceptFriendRequest(friendshipId)
      setRequests(requests.filter((r) => r.id !== friendshipId))
      setFriends([...friends, accepted])
    } catch {
      setError("Kunde inte acceptera vänförfrågan")
    }
  }

  async function handleDecline(friendshipId: number) {
    try {
      await deleteFriendship(friendshipId)
      setRequests(requests.filter((r) => r.id !== friendshipId))
    } catch {
      setError("Kunde inte neka vänförfrågan")
    }
  }

  async function handleRemoveFriend(friendshipId: number) {
    try {
      await deleteFriendship(friendshipId)
      setFriends(friends.filter((f) => f.id !== friendshipId))
    } catch {
      setError("Kunde inte ta bort vän")
    }
  }

  async function handleAcceptInvitation(id: number) {
    try {
      await acceptPlanInvitation(id)
      setInvitations(invitations.filter((i) => i.id !== id))
    } catch {
      setError("Kunde inte acceptera planinbjudan")
    }
  }

  async function handleDeclineInvitation(id: number) {
    try {
      await declinePlanInvitation(id)
      setInvitations(invitations.filter((i) => i.id !== id))
    } catch {
      setError("Kunde inte neka planinbjudan")
    }
  }

  if (selectedFriend) {
    return (
      <div className="max-w-lg mx-auto w-full">
        <FriendProfile friend={selectedFriend} onBack={() => setSelectedFriend(null)} currentUserEmail={email} />
      </div>
    )
  }

  const friendItems = []
  for (let i = 0; i < friends.length; i++) {
    const f = friends[i]
    friendItems.push(
      <div key={f.id} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
        <button
          onClick={() => setSelectedFriend(f.friend)}
          className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
            {(f.friend.name ?? f.friend.email)[0].toUpperCase()}
          </div>
          <div>
            <p className="text-gray-900 dark:text-white text-sm font-medium">{f.friend.name ?? f.friend.email}</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">{f.friend.email}</p>
          </div>
        </button>
        <button
          onClick={() => handleRemoveFriend(f.id)}
          className="text-gray-400 dark:text-gray-600 hover:text-red-400 text-xs transition-colors"
        >
          Ta bort
        </button>
      </div>
    )
  }

  const requestItems = []
  for (let i = 0; i < requests.length; i++) {
    const r = requests[i]
    requestItems.push(
      <div key={r.id} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-900 dark:text-white text-sm font-medium shrink-0">
            {(r.friend.name ?? r.friend.email)[0].toUpperCase()}
          </div>
          <div>
            <p className="text-gray-900 dark:text-white text-sm font-medium">{r.friend.name ?? r.friend.email}</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">{r.friend.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleAccept(r.id)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            Acceptera
          </button>
          <button
            onClick={() => handleDecline(r.id)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs transition-colors px-2"
          >
            Neka
          </button>
        </div>
      </div>
    )
  }

  const totalWorkouts = logs.length
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7))
  const startStr = startOfWeek.toISOString().slice(0, 10)
  const thisWeekCount = new Set(logs.filter((l) => l.date >= startStr).map((l) => l.date)).size
  const weeklyGoal = profile?.weekly_goal ?? 3

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto w-full">
      {/* Profile card */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex items-center gap-4">
        {image ? (
          <img src={image} alt={name} className="w-16 h-16 rounded-full" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
            {name[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="flex-1">
          <p className="text-gray-900 dark:text-white font-semibold text-lg">{name}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{email}</p>
        </div>
        <form action={handleSignOut}>
          <button
            type="submit"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors"
          >
            Logga ut
          </button>
        </form>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalWorkouts}</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">träningspass totalt</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {thisWeekCount}<span className="text-gray-400 dark:text-gray-500 text-base font-normal"> / {weeklyGoal}</span>
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">denna vecka</p>
        </div>
      </div>

      {/* Settings */}
      <div className="flex flex-col gap-3">
        <p className="text-gray-900 dark:text-white font-semibold text-lg">Inställningar</p>
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-gray-500 dark:text-gray-400 text-xs font-medium">Visningsnamn</label>
            <input
              value={settingsName}
              onChange={(e) => setSettingsName(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-gray-500 dark:text-gray-400 text-xs font-medium">Veckomål (pass per vecka)</label>
            <input
              type="number"
              min={1}
              max={14}
              value={settingsGoal}
              onChange={(e) => setSettingsGoal(Number(e.target.value))}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 w-20"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveSettings}
              disabled={settingsSaving}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {settingsSaving ? "Sparar..." : "Spara"}
            </button>
            {settingsSaved && <span className="text-green-500 text-sm">Sparat!</span>}
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">{success}</p>}

      {/* Incoming friend requests */}
      {requests.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Vänförfrågningar ({requests.length})</p>
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-4">
            {requestItems}
          </div>
        </div>
      )}

      {/* Plan invitations */}
      {invitations.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Planinbjudningar ({invitations.length})</p>
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-4">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
                <div>
                  <p className="text-gray-900 dark:text-white text-sm font-medium">{inv.plan_name}</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">från {inv.from_user.name ?? inv.from_user.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptInvitation(inv.id)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Acceptera
                  </button>
                  <button
                    onClick={() => handleDeclineInvitation(inv.id)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs transition-colors px-2"
                  >
                    Neka
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <p className="text-gray-900 dark:text-white font-semibold text-lg">Mina vänner</p>
          <button
            onClick={() => { setAddingFriend(!addingFriend); setSuccess(null) }}
            className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-center text-lg leading-none"
          >
            +
          </button>
        </div>

        {addingFriend && (
          <div className="flex flex-col gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mt-1">
            <input
              placeholder="Vännens e-postadress"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendRequest()}
              className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSendRequest}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Skicka förfrågan
              </button>
              <button
                onClick={() => setAddingFriend(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors px-2"
              >
                Avbryt
              </button>
            </div>
          </div>
        )}

        {friends.length === 0 && !addingFriend && (
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Inga vänner ännu. Tryck + för att lägga till.</p>
        )}

        {friends.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-4 mt-1">
            {friendItems}
          </div>
        )}
      </div>
    </div>
  )
}
