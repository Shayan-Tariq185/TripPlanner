import { useEffect, useRef, useState } from 'react'
import { CheckCircle, CircleNotch } from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'
import type { Note } from '../lib/types'

interface NotesPanelProps {
  tripId: string
  dayId: string | null // null = trip-level notes, not tied to a specific day
  notes: Note[]
  onNoteChanged: (note: Note) => void
}

const SAVE_DELAY_MS = 900

/**
 * A single autosaving note tied to either the trip as a whole (dayId = null)
 * or one specific day. Debounces writes so it doesn't hit Supabase on every
 * keystroke, and shows a small "Saved" confirmation rather than a loud toast.
 */
export function NotesPanel({ tripId, dayId, notes, onNoteChanged }: NotesPanelProps) {
  const existing = notes.find((n) => n.day_id === dayId)
  const [content, setContent] = useState(existing?.content ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local content when switching between day-level notes (e.g. user
  // changes the active day) — only when there's no in-flight edit timer.
  useEffect(() => {
    if (!timerRef.current) {
      setContent(existing?.content ?? '')
      setStatus('idle')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayId])

  function handleChange(value: string) {
    setContent(value)
    setStatus('idle')

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setStatus('saving')

      if (existing) {
        const { data, error } = await supabase
          .from('notes')
          .update({ content: value, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single()
        if (!error && data) {
          onNoteChanged(data as Note)
          setStatus('saved')
        }
      } else {
        const { data, error } = await supabase
          .from('notes')
          .insert({ trip_id: tripId, day_id: dayId, content: value })
          .select()
          .single()
        if (!error && data) {
          onNoteChanged(data as Note)
          setStatus('saved')
        }
      }
    }, SAVE_DELAY_MS)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label htmlFor="trip-notes" className="text-[0.85rem] text-mist-200">
          {dayId ? 'Notes for this day' : 'Trip notes'}
        </label>
        <span className="flex items-center gap-1 text-[0.72rem] text-mist-500">
          {status === 'saving' && (
            <>
              <CircleNotch size={11} className="animate-spin" />
              Saving…
            </>
          )}
          {status === 'saved' && (
            <>
              <CheckCircle size={11} weight="light" />
              Saved
            </>
          )}
        </span>
      </div>
      <textarea
        id="trip-notes"
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={
          dayId
            ? 'Reservation numbers, reminders, ideas for this day…'
            : 'Anything about the whole trip — visa notes, emergency contacts, general reminders…'
        }
        rows={11}
        className="w-full resize-none rounded-[1.1rem] border border-hairline-strong bg-ink-900 px-[1.1rem] py-[0.9rem] text-[0.88rem] leading-relaxed
                   text-mist-100 placeholder:text-mist-500
                   transition-all duration-400
                   focus:border-gold-500 focus:shadow-[0_0_0_4px_rgba(212,166,87,0.12)] focus:outline-none"
      />
    </div>
  )
}
