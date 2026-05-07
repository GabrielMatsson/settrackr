"use client"

import { useState, useEffect } from "react"
import { toggleLike, addComment, deleteComment } from "@/lib/api"

type Comment = {
  id: number
  body: string
  created_at: string
  author: { id: number; name: string | null; email: string }
}

type Props = {
  logId: number
  initialCount: number
  initialLiked: boolean
  initialComments?: Comment[]
  currentUserEmail: string
}

export default function LogReactions({ logId, initialCount, initialLiked, initialComments, currentUserEmail }: Props) {
  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(initialLiked)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>(initialComments ?? [])
  const [newComment, setNewComment] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    setCount(initialCount)
    setLiked(initialLiked)
  }, [initialCount, initialLiked])

  useEffect(() => {
    if (initialComments) setComments(initialComments)
  }, [initialComments])

  async function handleLike() {
    const prev = liked
    setLiked(!liked)
    setCount(prev ? count - 1 : count + 1)
    try {
      await toggleLike(logId)
    } catch {
      setLiked(prev)
      setCount(count)
    }
  }

  function handleToggleComments() {
    setShowComments(!showComments)
  }

  async function handleSend() {
    if (!newComment.trim() || sending) return
    const text = newComment.trim()
    setNewComment("")
    const tempId = -Date.now()
    const tempComment: Comment = {
      id: tempId,
      body: text,
      created_at: new Date().toISOString(),
      author: { id: 0, name: null, email: currentUserEmail },
    }
    setComments((prev) => [...prev, tempComment])
    setSending(true)
    try {
      const created = await addComment(logId, text)
      setComments((prev) => prev.map((c) => (c.id === tempId ? created : c)))
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== tempId))
      setNewComment(text)
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(commentId: number) {
    try {
      await deleteComment(logId, commentId)
      setComments(comments.filter((c) => c.id !== commentId))
    } catch {
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-gray-800">
      <div className="flex items-center gap-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-indigo-400" : "text-gray-500 hover:text-gray-300"}`}
        >
          <svg className="w-4 h-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {count > 0 && <span>{count}</span>}
        </button>

        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{comments.length > 0 ? comments.length : "Kommentera"}</span>
        </button>
      </div>

      {showComments && (
        <div className="flex flex-col gap-2">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-2 bg-gray-800 rounded-lg px-3 py-2">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-indigo-400 text-xs font-medium">{c.author.name ?? c.author.email.split("@")[0]}</span>
                <span className="text-gray-200 text-sm">{c.body}</span>
                <span className="text-gray-600 text-xs">{formatDate(c.created_at)}</span>
              </div>
              {c.author.email === currentUserEmail && (
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-gray-600 hover:text-red-400 text-xs transition-colors shrink-0 mt-0.5"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend() }}
              placeholder="Skriv en kommentar…"
              className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSend}
              disabled={!newComment.trim() || sending}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
            >
              Skicka
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
