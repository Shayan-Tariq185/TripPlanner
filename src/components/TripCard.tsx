import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarBlank, Wallet } from '@phosphor-icons/react'
import type { Trip } from '../lib/types'
import { formatMoney } from '../lib/currency'

const MotionLink = motion.create(Link)

const STYLE_LABEL: Record<Trip['travel_style'], string> = {
  relaxed: 'Relaxed',
  packed: 'Packed',
  budget: 'Budget',
  luxury: 'Luxury',
}

// Each travel style gets its own pill accent, matching the reference's
// budget/luxury/relaxed pill treatment (sage/gold/coral respectively).
const STYLE_ACCENT: Record<Trip['travel_style'], { text: string; bg: string; border: string }> = {
  budget: { text: 'text-teal-400', bg: 'bg-teal-500/[0.08]', border: 'border-teal-500/35' },
  luxury: { text: 'text-gold-400', bg: 'bg-gold-500/[0.08]', border: 'border-gold-500/35' },
  relaxed: { text: 'text-coral-500', bg: 'bg-coral-500/[0.08]', border: 'border-coral-500/35' },
  packed: { text: 'text-mist-200', bg: 'bg-white/[0.05]', border: 'border-hairline-strong' },
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(s)} – ${fmt(e)}`
}

interface TripCardProps {
  trip: Trip
  /** Number of days that have at least one stop planned. */
  daysPlanned?: number
  /** Total number of days in the trip. */
  totalDays?: number
}

export function TripCard({ trip, daysPlanned = 0, totalDays = 0 }: TripCardProps) {
  const accent = STYLE_ACCENT[trip.travel_style]
  const percent = totalDays > 0 ? Math.round((daysPlanned / totalDays) * 100) : 0

  return (
    <MotionLink
      to={`/trips/${trip.id}`}
      className="group relative block overflow-hidden rounded-[1.8rem] border border-hairline bg-ink-800"
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <div
        className="absolute inset-x-0 top-0 z-10 h-[3px] origin-left scale-x-0 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 group-hover:opacity-100"
        style={{ background: 'linear-gradient(90deg, #d4a657, transparent)' }}
      />

      {trip.cover_image_url ? (
        <div className="relative h-[120px] w-full overflow-hidden">
          <img
            src={trip.cover_image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
            loading="lazy"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, transparent 40%, var(--surface) 100%)' }}
          />
        </div>
      ) : (
        <div
          className="h-[60px] w-full"
          style={{ background: 'linear-gradient(135deg, rgba(212,166,87,0.1), transparent)' }}
        />
      )}

      <div className="p-6 pt-5">
        <div className="mb-6 flex items-start justify-between gap-3">
          <p className="font-display text-[1.35rem] text-mist-50">{trip.destination}</p>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-[0.32rem] text-[9px] uppercase tracking-[0.14em] ${accent.text} ${accent.bg} ${accent.border}`}
          >
            {STYLE_LABEL[trip.travel_style]}
          </span>
        </div>

        <div className="mb-6 flex flex-col gap-2.5 text-[0.82rem] text-mist-300">
          <div className="flex items-center gap-2">
            <CalendarBlank size={14} weight="light" className="opacity-70" />
            <span className="tabular">{formatDateRange(trip.start_date, trip.end_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Wallet size={14} weight="light" className="opacity-70" />
            <span className="tabular">{formatMoney(trip.budget, trip.currency)} budget</span>
          </div>
        </div>

        {totalDays > 0 && (
          <>
            <div className="h-1 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: `${percent}%`, background: 'linear-gradient(90deg, #d4a657, #e8c077)' }}
              />
            </div>
            <p className="mt-2 text-[0.7rem] text-mist-400">
              {daysPlanned} of {totalDays} days planned
            </p>
          </>
        )}
      </div>
    </MotionLink>
  )
}
