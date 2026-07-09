import { useState, useEffect, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CircleNotch, WarningCircle } from '@phosphor-icons/react'
import type { Trip, TravelStyle } from '../lib/types'
import { TextField } from './TextField'
import { Button } from './Button'

export interface TripDetailsFormValues {
  destination: string
  start_date: string
  end_date: string
  budget: string
  travel_style: TravelStyle
}

interface TripDetailsEditorProps {
  open: boolean
  trip: Trip
  saving?: boolean
  onClose: () => void
  onSave: (values: TripDetailsFormValues) => void
}

const STYLE_OPTIONS: { value: TravelStyle; label: string }[] = [
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'packed', label: 'Packed' },
  { value: 'budget', label: 'Budget' },
  { value: 'luxury', label: 'Luxury' },
]

/**
 * Edits a trip's core details (destination, dates, budget, style) after
 * creation. Deliberately does NOT touch currency (see requirements doc —
 * PKR-only for new trips, existing trips keep their original currency) or
 * regenerate the itinerary itself — changing the destination here only
 * updates the label; existing stops keep whatever the AI originally planned
 * for the old destination, and a visible warning explains this rather than
 * silently leaving stale data.
 */
export function TripDetailsEditor({ open, trip, saving = false, onClose, onSave }: TripDetailsEditorProps) {
  const [values, setValues] = useState<TripDetailsFormValues>({
    destination: trip.destination,
    start_date: trip.start_date,
    end_date: trip.end_date,
    budget: String(trip.budget),
    travel_style: trip.travel_style,
  })

  useEffect(() => {
    if (open) {
      setValues({
        destination: trip.destination,
        start_date: trip.start_date,
        end_date: trip.end_date,
        budget: String(trip.budget),
        travel_style: trip.travel_style,
      })
    }
  }, [open, trip])

  const destinationChanged = values.destination.trim() !== trip.destination
  const datesInvalid = values.start_date && values.end_date && values.start_date > values.end_date

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!values.destination.trim() || !values.start_date || !values.end_date || datesInvalid) return
    onSave(values)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink-950/80 px-4 backdrop-blur-xl"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="w-full max-w-md rounded-2xl bg-white/[0.04] p-1.5 ring-1 ring-white/[0.06]
                       shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
        <div className="rounded-[calc(theme(borderRadius.2xl)-0.375rem)] bg-ink-900/95 p-6 md:p-7">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-mist-50">Edit trip details</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-mist-400 hover:bg-white/[0.06] hover:text-mist-100 transition-colors"
            >
              <X size={16} weight="light" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <TextField
              label="Destination"
              required
              autoFocus
              value={values.destination}
              onChange={(e) => setValues({ ...values, destination: e.target.value })}
            />

            {destinationChanged && (
              <div className="flex items-start gap-2 rounded-[0.9rem] border border-gold-500/25 bg-gold-500/[0.06] px-3 py-2.5">
                <WarningCircle size={14} weight="light" className="mt-0.5 shrink-0 text-gold-400" />
                <p className="text-[0.76rem] text-mist-300">
                  This only renames the trip. Existing stops were planned for "{trip.destination}" and won't
                  move automatically — use "Regenerate itinerary" on the trip page if you want a fresh plan
                  for the new destination.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Start date"
                type="date"
                value={values.start_date}
                onChange={(e) => setValues({ ...values, start_date: e.target.value })}
              />
              <TextField
                label="End date"
                type="date"
                value={values.end_date}
                onChange={(e) => setValues({ ...values, end_date: e.target.value })}
                min={values.start_date || undefined}
              />
            </div>
            {datesInvalid && <p className="text-[0.78rem] text-coral-500">End date should be after the start date.</p>}

            <TextField
              label={`Budget (${trip.currency})`}
              type="number"
              inputMode="numeric"
              min={1}
              value={values.budget}
              onChange={(e) => setValues({ ...values, budget: e.target.value })}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-mist-200">Travel style</label>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValues({ ...values, travel_style: opt.value })}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors duration-200
                                ${
                                  values.travel_style === opt.value
                                    ? 'border-gold-400/60 bg-gold-400/10 text-mist-50'
                                    : 'border-white/10 bg-white/[0.03] text-mist-300 hover:bg-white/[0.06]'
                                }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !values.destination.trim() || !!datesInvalid}>
                {saving ? <CircleNotch size={16} className="animate-spin" /> : 'Save changes'}
              </Button>
            </div>
          </form>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
