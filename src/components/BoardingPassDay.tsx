import { motion } from 'framer-motion'
import {
  ArrowsClockwise,
  Plus,
  CircleNotch,
  AirplaneTilt,
  NavigationArrow,
} from '@phosphor-icons/react'
import type { Stop, Day, Currency } from '../lib/types'
import { DayTimeline } from './DayTimeline'
import { mapsDirectionsUrl } from '../lib/maps'

type DayWithStops = Day & { stops: Stop[] }

interface BoardingPassDayProps {
  day: DayWithStops
  currency: Currency
  destination: string
  regenerating: boolean
  onRegenerate: () => void
  onAddStop: () => void
  onEditStop: (stop: Stop) => void
  onDeleteStop: (stopId: string) => void
}

function formatDayDate(date: string): { weekday: string; dayMonth: string } | null {
  if (!date) return null
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return null
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    dayMonth: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }
}

/**
 * One day rendered as a "boarding pass" — a tall ticket card with a gold
 * header stub (day number, date, stop count) and the day's timeline below.
 * Designed to sit in a horizontal snap-scroll rail so the whole trip reads as
 * a strip of tickets, one per day.
 */
export function BoardingPassDay({
  day,
  currency,
  destination,
  regenerating,
  onRegenerate,
  onAddStop,
  onEditStop,
  onDeleteStop,
}: BoardingPassDayProps) {
  const unresolvedCount = day.stops.filter((s) => s.geocode_status === 'unresolved').length
  const dateParts = formatDayDate(day.date)
  const totalCost = day.stops.reduce((sum, s) => sum + (s.est_cost ?? 0), 0)
  const directionsUrl = mapsDirectionsUrl(day.stops, destination)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-[340px] shrink-0 snap-start flex-col overflow-hidden rounded-[1.8rem] border border-hairline bg-ink-800 sm:w-[400px]"
      style={{ boxShadow: '0 30px 60px -30px rgba(0,0,0,0.6)' }}
    >
      {/* Header stub */}
      <div className="relative overflow-hidden border-b border-dashed border-hairline-strong px-6 pb-5 pt-6">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 320px 160px at 20% 0%, rgba(212,166,87,0.16), transparent 65%)',
          }}
        />
        {/* Perforation notches */}
        <div className="absolute -left-3 -bottom-3 h-6 w-6 rounded-full bg-ink-950" aria-hidden="true" />
        <div className="absolute -right-3 -bottom-3 h-6 w-6 rounded-full bg-ink-950" aria-hidden="true" />

        <div className="relative flex items-start justify-between">
          <div>
            <span className="flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.22em] text-gold-400">
              <AirplaneTilt size={12} weight="fill" />
              Day
            </span>
            <p className="mt-1 font-display text-[2.6rem] font-normal leading-none text-mist-50">
              {String(day.day_number).padStart(2, '0')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRegenerate}
              disabled={regenerating}
              aria-label="Regenerate this day"
              title="Regenerate this day"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-hairline-strong bg-ink-900/80 text-mist-400 backdrop-blur-sm transition-all duration-300 hover:border-gold-500 hover:text-gold-400 disabled:opacity-50"
            >
              {regenerating ? (
                <CircleNotch size={14} className="animate-spin" />
              ) : (
                <ArrowsClockwise size={14} weight="light" />
              )}
            </button>
            <button
              onClick={onAddStop}
              aria-label="Add stop"
              title="Add stop"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-hairline-strong bg-ink-900/80 text-mist-100 backdrop-blur-sm transition-all duration-300 hover:border-gold-500 hover:text-gold-400"
            >
              <Plus size={15} weight="bold" />
            </button>
          </div>
        </div>

        <div className="relative mt-4 flex items-center gap-4 text-[0.74rem] text-mist-300">
          {dateParts && (
            <span className="tabular flex items-center gap-1.5">
              <span className="text-mist-400">{dateParts.weekday}</span>
              {dateParts.dayMonth}
            </span>
          )}
          <span className="h-3 w-px bg-white/10" />
          <span>
            {day.stops.length} stop{day.stops.length === 1 ? '' : 's'}
          </span>
          {totalCost > 0 && (
            <>
              <span className="h-3 w-px bg-white/10" />
              <span className="tabular text-gold-300">
                {currency === 'PKR' ? 'Rs ' : '$'}
                {totalCost.toLocaleString()}
              </span>
            </>
          )}
        </div>

        <div className="relative mt-3 flex items-center gap-3">
          {directionsUrl && day.stops.length > 0 && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-hairline-strong bg-ink-900/60 px-3 py-1.5 text-[0.72rem] text-mist-200 backdrop-blur-sm transition-all duration-300 hover:border-gold-500 hover:text-gold-400"
            >
              <NavigationArrow size={12} weight="fill" className="text-gold-400" />
              {day.stops.length > 1 ? "Directions for this day" : 'Open in Maps'}
            </a>
          )}
          {unresolvedCount > 0 && (
            <span
              className="text-[0.7rem] text-mist-400"
              title="These stops aren't on our map yet, but tapping a stop still opens it in Google Maps."
            >
              {unresolvedCount} map pin{unresolvedCount === 1 ? '' : 's'} pending
            </span>
          )}
        </div>
      </div>

      {/* Timeline body */}
      <div className="flex-1 overflow-y-auto px-4 py-5 [scrollbar-width:thin]">
        <DayTimeline
          stops={day.stops}
          currency={currency}
          destination={destination}
          onEditStop={onEditStop}
          onDeleteStop={onDeleteStop}
          onAddStop={onAddStop}
        />
      </div>
    </motion.div>
  )
}
