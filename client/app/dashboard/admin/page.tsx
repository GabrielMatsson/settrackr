"use client"

import { useState, useEffect } from "react"
import { Trash2 } from "lucide-react"
import { getCurrentUserEmail, getAdminUsers, deleteAdminUser } from "@/lib/api"

const ADMIN_EMAIL = "matssongabriel@gmail.com"

type AdminUser = { id: number; name: string | null; email: string }

export default function AdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [confirmId, setConfirmId] = useState<number | null>(null)

  useEffect(() => {
    getCurrentUserEmail().then((email) => {
      if (email !== ADMIN_EMAIL) {
        setAuthorized(false)
        return
      }
      setAuthorized(true)
      getAdminUsers().then((data) => setUsers(data as AdminUser[]))
    })
  }, [])

  async function handleDelete(id: number) {
    await deleteAdminUser(id)
    setUsers((prev) => prev.filter((u) => u.id !== id))
    setConfirmId(null)
  }

  if (authorized === false) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Åtkomst nekad</p>
      </div>
    )
  }

  if (authorized === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Laddar...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Användare ({users.length})
      </h1>
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {users.length === 0 ? (
          <p className="text-gray-400 text-sm px-4 py-6 text-center">Inga användare</p>
        ) : (
          users.map((user, i) => (
            <div
              key={user.id}
              className={`flex items-center gap-4 px-4 py-3 ${i < users.length - 1 ? "border-b border-gray-100 dark:border-gray-800" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name ?? "—"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>

              {user.email === ADMIN_EMAIL ? (
                <span className="text-xs text-indigo-400 font-medium shrink-0">Admin</span>
              ) : confirmId === user.id ? (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-xs px-2.5 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Bekräfta
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Avbryt
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(user.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  aria-label="Ta bort användare"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
