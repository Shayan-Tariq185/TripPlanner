import { useState, type FormEvent } from 'react'
import { CircleNotch, PaperPlaneRight, Trash, ChatCircleDots } from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import type { Comment } from '../lib/types'

interface CommentsPanelProps {
  tripId: string
  comments: Comment[]
  onCommentAdded: (comment: Comment) => void
  onCommentDeleted: (commentId: string) => void
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function CommentsPanel({ tripId, comments, onCommentAdded, onCommentDeleted }: CommentsPanelProps) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || !user) return
    setSending(true)

    const { data, error } = await supabase
      .from('comments')
      .insert({ trip_id: tripId, user_id: user.id, content: trimmed })
      .select()
      .single()

    setSending(false)
    if (!error && data) {
      onCommentAdded({ ...(data as Comment), author_name: user.email ?? 'You' })
      setContent('')
    }
  }

  async function handleDelete(commentId: string) {
    onCommentDeleted(commentId)
    await supabase.from('comments').delete().eq('id', commentId)
  }

  return (
    <div className="flex flex-col gap-4">
      <span className="eyebrow">
        <span className="eyebrow-dot" /> Comments
      </span>

      {comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <ChatCircleDots size={22} weight="light" className="text-mist-500" />
          <p className="max-w-[220px] text-sm text-mist-400">
            No comments yet — good for coordinating with anyone joining this trip.
          </p>
        </div>
      ) : (
        <div className="flex max-h-[360px] flex-col gap-3 overflow-y-auto pr-1">
          {comments.map((comment) => {
            const isOwn = comment.user_id === user?.id
            const name = isOwn ? 'You' : comment.author_name ?? 'Traveler'
            return (
              <div key={comment.id} className="group flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-hairline-strong bg-ink-900 text-[0.72rem] font-medium text-gold-400">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 rounded-[1rem] border border-hairline bg-ink-900/60 px-3.5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[0.78rem] font-medium text-mist-200">{name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[0.7rem] text-mist-500">{timeAgo(comment.created_at)}</span>
                      {isOwn && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          aria-label="Delete comment"
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Trash size={12} weight="light" className="text-mist-500 hover:text-coral-500" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-[0.85rem] leading-relaxed text-mist-100">{comment.content}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded-[1.1rem] border border-hairline-strong bg-ink-900 px-4 py-3 text-[0.88rem]
                     text-mist-100 placeholder:text-mist-500
                     transition-all duration-400
                     focus:border-gold-500 focus:shadow-[0_0_0_4px_rgba(212,166,87,0.12)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          aria-label="Send comment"
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-gold-400 to-gold-500 text-[#1a1206]
                     transition-opacity duration-300 disabled:opacity-40"
        >
          {sending ? <CircleNotch size={16} className="animate-spin" /> : <PaperPlaneRight size={15} weight="fill" />}
        </button>
      </form>
    </div>
  )
}
