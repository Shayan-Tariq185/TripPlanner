import { useState, useEffect, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CircleNotch } from '@phosphor-icons/react'
import type { Stop, Currency } from '../lib/types'
import { TextField } from './TextField'
import { Button } from './Button'

const TYPE_OPTIONS: { value: Stop['type']; label: string }[] = [
  { value: 'attraction', label: 'Attraction' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'transport', label: 'Transport' },
]

export interface StopFormValues {
  name: string
  type: Stop['type']
  start_time: string
  est_cost: string
  notes: string
}

interface StopEditorProps {
  open: boolean
  initial?: StopFormValues
  saving?: boolean
  currency: Currency
  onClose: () => void
  onSave: (values: StopFormValues) => void
}

const EMPTY: StopFormValues = { name: '', type: 'attraction', start_time: '', est_cost: '', notes: '' }

export function StopEditor({ open, initial, saving = false, currency, onClose, onSave }: StopEditorProps) {
  const [values, setValues] = useState<StopFormValues>(initial ?? EMPTY)

  useEffect(() => {
    if (open) setValues(initial ?? EMPTY)
  }, [open, initial])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!values.name.trim()) return
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
            <h2 className="font-display text-xl text-mist-50">
              {initial ? 'Edit stop' : 'Add a stop'}
            </h2>
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
              label="Name"
              placeholder="e.g. Blue Mosque"
              required
              autoFocus
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-mist-200">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValues({ ...values, type: opt.value })}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors duration-200
                                ${
                                  values.type === opt.value
                                    ? 'border-gold-400/60 bg-gold-400/10 text-mist-50'
                                    : 'border-white/10 bg-white/[0.03] text-mist-300 hover:bg-white/[0.06]'
                                }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Time"
                type="time"
                value={values.start_time}
                onChange={(e) => setValues({ ...values, start_time: e.target.value })}
              />
              <TextField
                label={`Est. cost (${currency})`}
                type="number"
                inputMode="numeric"
                min={0}
                value={values.est_cost}
                onChange={(e) => setValues({ ...values, est_cost: e.target.value })}
              />
            </div>

            <TextField
              label="Notes"
              placeholder="Optional"
              value={values.notes}
              onChange={(e) => setValues({ ...values, notes: e.target.value })}
            />

            <div className="mt-2 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !values.name.trim()}>
                {saving ? <CircleNotch size={16} className="animate-spin" /> : initial ? 'Save changes' : 'Add stop'}
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
