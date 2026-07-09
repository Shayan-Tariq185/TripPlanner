import { useState, useRef, useEffect, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  PaperPlaneRight,
  CircleNotch,
  Check,
  X,
  Sparkle,
  WarningCircle,
  Plus,
  MapPin,
} from '@phosphor-icons/react'
import {
  askTripAssistant,
  AssistantError,
  type AssistantAction,
  type AssistantMessage,
  type AssistantSuggestion,
} from '../lib/tripAssistant'
import { applyAssistantAction, ApplyActionError } from '../lib/applyAssistantAction'
import { getDailyCount, incrementDailyCount, RATE_LIMITS } from '../lib/rateLimit'
import type { Trip, Day, Stop } from '../lib/types'

function getMessageCount(tripId: string): number {
  return getDailyCount('assistant', tripId)
}

function incrementMessageCount(tripId: string): number {
  return incrementDailyCount('assistant', tripId)
}

interface ChatEntry {
  role: 'user' | 'assistant'
  content: string
  action?: AssistantAction
  suggestions?: AssistantSuggestion[]
  applied?: boolean
}

const STARTERS = [
  'Help me plan my days',
  "What's the food like here?",
  'Any hidden gems nearby?',
  'Is my schedule too packed?',
]

interface TripAssistantPanelProps {
  trip: Trip
  days: (Day & { stops: Stop[] })[]
  onChangeApplied: () => void
}

/**
 * Conversational trip companion. Handles three kinds of reply:
 *  - answer / recommend: plain conversation, optionally with tappable place
 *    cards the user can add to the trip in one click.
 *  - edit proposals (move_time, add_stop, …): shown as a reviewable diff card,
 *    never written to the database until the user explicitly approves.
 *  - clarify / decline: shown as a normal assistant message.
 *
 * The one non-negotiable safety rail: nothing touches Supabase until approve.
 * A lightweight per-trip daily message cap (localStorage) guards free-tier
 * Groq quota against a runaway chat session.
 */
export function TripAssistantPanel({ trip, days, onChangeApplied }: TripAssistantPanelProps) {
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [applyingKey, setApplyingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [messageCount, setMessageCount] = useState(() => getMessageCount(trip.id))
  const scrollRef = useRef<HTMLDivElement>(null)
  const capReached = messageCount >= RATE_LIMITS.assistantMessages

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [entries, thinking])

  function historyFor(): AssistantMessage[] {
    return entries.map((e) => ({ role: e.role, content: e.content }))
  }

  async function send(message: string) {
    if (!message || thinking || capReached) return

    setInput('')
    setError(null)
    setEntries((prev) => [...prev, { role: 'user', content: message }])
    setThinking(true)
    setMessageCount(incrementMessageCount(trip.id))

    try {
      const action = await askTripAssistant(message, historyFor(), {
        destination: trip.destination,
        currency: trip.currency,
        days,
      })

      if (action.type === 'answer' || action.type === 'recommend') {
        setEntries((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: action.message ?? action.summary,
            suggestions: action.suggestions,
          },
        ])
      } else if (action.type === 'clarify') {
        setEntries((prev) => [
          ...prev,
          { role: 'assistant', content: action.clarify_question ?? 'Could you clarify that?' },
        ])
      } else if (action.type === 'decline') {
        setEntries((prev) => [
          ...prev,
          { role: 'assistant', content: action.decline_reason ?? "I can't make that change here." },
        ])
      } else {
        setEntries((prev) => [...prev, { role: 'assistant', content: action.summary, action }])
      }
    } catch (err) {
      setError(err instanceof AssistantError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setThinking(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    send(input.trim())
  }

  async function handleApprove(index: number) {
    const entry = entries[index]
    if (!entry.action) return

    setApplyingKey(`edit-${index}`)
    setError(null)

    try {
      await applyAssistantAction(trip, entry.action, days)
      setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, applied: true } : e)))
      onChangeApplied()
    } catch (err) {
      setError(err instanceof ApplyActionError ? err.message : 'Could not apply that change. Try again.')
    } finally {
      setApplyingKey(null)
    }
  }

  function handleReject(index: number) {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, content: e.content + ' (dismissed)', action: undefined } : e))
    )
  }

  // Turn a recommended place directly into a saved stop. We resolve which day
  // to attach it to: the suggested day if given and valid, otherwise the
  // first day — the user can always drag it elsewhere afterwards.
  async function handleAddSuggestion(entryIndex: number, sugIndex: number, sug: AssistantSuggestion) {
    const key = `sug-${entryIndex}-${sugIndex}`
    setApplyingKey(key)
    setError(null)

    const targetDay =
      (sug.suggested_day_number != null
        ? days.find((d) => d.day_number === sug.suggested_day_number)
        : undefined) ?? days[0]

    if (!targetDay) {
      setError('No day to add this to yet.')
      setApplyingKey(null)
      return
    }

    try {
      await applyAssistantAction(
        trip,
        {
          type: 'add_stop',
          summary: `Add ${sug.name}`,
          day_id: targetDay.id,
          new_stop_name: sug.name,
          new_stop_type: sug.suggested_type ?? 'attraction',
        },
        days
      )
      setEntries((prev) =>
        prev.map((e, i) =>
          i === entryIndex && e.suggestions
            ? {
                ...e,
                suggestions: e.suggestions.map((s, si) =>
                  si === sugIndex ? { ...s, reason: '__added__' } : s
                ),
              }
            : e
        )
      )
      onChangeApplied()
    } catch (err) {
      setError(err instanceof ApplyActionError ? err.message : 'Could not add that place. Try again.')
    } finally {
      setApplyingKey(null)
    }
  }

  const showStarters = entries.length === 0 && !thinking

  return (
    <div className="flex h-[560px] flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
        {showStarters && (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-500/30 bg-gold-500/[0.08]">
              <Sparkle size={22} weight="light" className="text-gold-400" />
            </div>
            <div>
              <p className="font-display text-[1.05rem] text-mist-50">Your AI travel companion</p>
              <p className="mt-1 max-w-[260px] text-[0.8rem] leading-relaxed text-mist-400">
                Ask me anything about {trip.destination.split(',')[0]}, and I'll help shape your plan — everything I suggest is just an idea you can adjust.
              </p>
            </div>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-hairline-strong bg-ink-900 px-3 py-1.5 text-[0.74rem] text-mist-300 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-gold-500/50 hover:text-gold-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {entries.map((entry, i) => {
            if (entry.role === 'user') {
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="ml-auto max-w-[85%] rounded-[1.1rem] rounded-tr-md bg-gradient-to-b from-ink-500 to-ink-600 px-3.5 py-2.5 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.5)]"
                >
                  <p className="text-[0.85rem] text-mist-50">{entry.content}</p>
                </motion.div>
              )
            }

            if (entry.action) {
              const applying = applyingKey === `edit-${i}`
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="max-w-[94%] rounded-[1.1rem] rounded-tl-md border border-gold-500/25 bg-gradient-to-b from-gold-500/[0.09] to-gold-500/[0.04] px-3.5 py-3"
                >
                  <div className="flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.16em] text-gold-400">
                    <Sparkle size={11} weight="fill" />
                    Proposed change
                  </div>
                  <p className="mt-1.5 text-[0.86rem] leading-snug text-mist-50">{entry.content}</p>
                  {entry.applied ? (
                    <p className="mt-2.5 flex items-center gap-1.5 text-[0.76rem] text-success-500">
                      <Check size={13} weight="bold" />
                      Applied to your trip
                    </p>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleApprove(i)}
                        disabled={applying}
                        className="flex items-center gap-1.5 rounded-full bg-gradient-to-b from-gold-400 to-gold-500 px-3.5 py-1.5 text-[0.78rem] font-medium text-[#1a1206] transition-transform duration-200 hover:brightness-105 active:scale-[0.97] disabled:opacity-60"
                      >
                        {applying ? <CircleNotch size={12} className="animate-spin" /> : <Check size={12} weight="bold" />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(i)}
                        disabled={applying}
                        className="flex items-center gap-1.5 rounded-full border border-hairline-strong px-3.5 py-1.5 text-[0.78rem] text-mist-300 transition-colors hover:text-mist-100"
                      >
                        <X size={12} weight="bold" />
                        Dismiss
                      </button>
                    </div>
                  )}
                </motion.div>
              )
            }

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-[92%] space-y-2.5"
              >
                <div className="rounded-[1.1rem] rounded-tl-md border border-hairline bg-ink-900/80 px-3.5 py-2.5">
                  <p className="text-[0.86rem] leading-relaxed text-mist-100">{entry.content}</p>
                </div>

                {entry.suggestions && entry.suggestions.length > 0 && (
                  <div className="space-y-2">
                    {entry.suggestions.map((sug, si) => {
                      const added = sug.reason === '__added__'
                      const busy = applyingKey === `sug-${i}-${si}`
                      const placeName = sug.name.split(',')[0]
                      return (
                        <div
                          key={si}
                          className="group flex items-center gap-3 rounded-[1rem] border border-hairline bg-ink-800/60 px-3 py-2.5 transition-colors duration-300 hover:border-hairline-strong"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-hairline-strong bg-ink-900 text-gold-400">
                            <MapPin size={15} weight="light" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[0.82rem] font-medium text-mist-50">{placeName}</p>
                            {!added && sug.reason && (
                              <p className="truncate text-[0.74rem] text-mist-400">{sug.reason}</p>
                            )}
                            {added && <p className="text-[0.74rem] text-success-500">Added to your trip</p>}
                          </div>
                          {added ? (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-success-500">
                              <Check size={15} weight="bold" />
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddSuggestion(i, si, sug)}
                              disabled={busy || days.length === 0}
                              aria-label={`Add ${placeName} to trip`}
                              title="Add to trip"
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-hairline-strong text-mist-300 transition-all duration-300 hover:border-gold-500 hover:text-gold-400 disabled:opacity-40"
                            >
                              {busy ? <CircleNotch size={14} className="animate-spin" /> : <Plus size={14} weight="bold" />}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>

        {thinking && (
          <div className="flex w-fit items-center gap-2 rounded-[1.1rem] rounded-tl-md border border-hairline bg-ink-900/80 px-3.5 py-2.5">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold-400" />
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-2 flex items-center gap-2 rounded-[0.9rem] border border-coral-500/25 bg-coral-500/[0.06] px-3 py-2 text-[0.78rem] text-coral-500">
          <WarningCircle size={13} weight="light" />
          {error}
        </div>
      )}

      {capReached ? (
        <div className="flex items-center gap-2 rounded-[1.1rem] border border-hairline-strong bg-ink-900 px-4 py-3 text-[0.8rem] text-mist-400">
          <WarningCircle size={14} weight="light" />
          You've reached today's limit for assistant messages on this trip. Try again tomorrow.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything, or request a change…"
            className="flex-1 rounded-[1.1rem] border border-hairline-strong bg-ink-900 px-4 py-3 text-[0.85rem]
                       text-mist-100 placeholder:text-mist-500
                       transition-all duration-400
                       focus:border-gold-500 focus:shadow-[0_0_0_4px_rgba(212,166,87,0.12)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={thinking || !input.trim()}
            aria-label="Send"
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-gold-400 to-gold-500 text-[#1a1206]
                       transition-transform duration-200 hover:brightness-105 active:scale-[0.96] disabled:opacity-40"
          >
            {thinking ? <CircleNotch size={16} className="animate-spin" /> : <PaperPlaneRight size={15} weight="fill" />}
          </button>
        </form>
      )}
    </div>
  )
}
