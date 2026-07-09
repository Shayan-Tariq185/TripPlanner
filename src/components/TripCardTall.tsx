import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarBlank, Wallet, MapPin } from '@phosphor-icons/react'
import type { Trip } from '../lib/types'
import { formatMoney } from '../lib/currency'

const MotionLink = motion.create(Link)

const STYLE_LABEL: Record<Trip['travel_style'], string> = {
  relaxed: 'Relaxed',
  packed: 'Packed',
  budget: 'Budget',
  luxury: 'Luxury',
}

// Each style keeps a signature colour, now expressed as a bright dot on a
// solid dark pill rather than tinted text on a translucent fill — the old
// version washed out over bright/warm photos (sunsets, snow, sky). A dark
// scrim + light label stays legible over ANY cover image.
const STYLE_DOT: Record<Trip['travel_style'], string> = {
  budget: '#9bb99a',
  luxury: '#e8c077',
  relaxed: '#e8785a',
  packed: '#b7c0d1',
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(s)} – ${fmt(e)}`
}

interface TripCardTallProps {
  trip: Trip
  daysPlanned?: number
  totalDays?: number
}

/**
 * Tall postcard-style trip card: a large cover photo fills the top two-thirds
 * so the destination is unmistakably *seen*, with trip details on a solid
 * footer below. Built for a horizontal swipe rail on the dashboard. When no
 * cover exists, a warm brass gradient stands in so the card never looks broken.
 */
export function TripCardTall({ trip, daysPlanned = 0, totalDays = 0 }: TripCardTallProps) {
  const dotColor = STYLE_DOT[trip.travel_style]
  const percent = totalDays > 0 ? Math.round((daysPlanned / totalDays) * 100) : 0
  const cityShort = trip.destination.split(',')[0]

  return (
    <MotionLink
      to={`/trips/${trip.id}`}
      className="group relative flex h-[440px] w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-[1.8rem] border border-hairline bg-ink-800 sm:w-[320px]"
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      style={{ boxShadow: '0 30px 60px -30px rgba(0,0,0,0.6)' }}
    >
      {/* Cover — large, filling most of the card */}
      <div className="relative h-[280px] w-full overflow-hidden">
        {trip.cover_image_url ? (
          <img
            src={trip.cover_image_url}
            alt={trip.destination}
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: 'linear-gradient(150deg, color-mix(in srgb, var(--gold-500) 28%, transparent), color-mix(in srgb, var(--coral-500) 16%, transparent) 55%, var(--surface))' }}
          >
            <MapPin size={40} weight="light" className="text-gold-400/60" />
          </div>
        )}

        {/* Gradient scrim so the title/badge stay legible over any photo */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 60%, transparent) 0%, transparent 30%, color-mix(in srgb, var(--surface) 78%, transparent) 82%, var(--surface) 100%)' }}
        />

        <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-3 py-[0.4rem] text-[9px] font-medium uppercase tracking-[0.16em] text-white shadow-[0_2px_10px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />
          {STYLE_LABEL[trip.travel_style]}
        </span>

        <h3 className="absolute inset-x-5 bottom-4 font-display text-[1.5rem] leading-tight text-mist-50 [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]">
          {cityShort}
        </h3>
      </div>

      {/* Footer details */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="flex flex-col gap-2.5 text-[0.82rem] text-mist-300">
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
          <div className="mt-4">
            <div className="h-1 overflow-hidden rounded-full bg-mist-400/15">
              <div
                className="h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: `${percent}%`, background: 'linear-gradient(90deg, #d4a657, #e8c077)' }}
              />
            </div>
            <p className="mt-2 text-[0.7rem] text-mist-400">
              {daysPlanned} of {totalDays} days planned
            </p>
          </div>
        )}
      </div>
    </MotionLink>
  )
}
