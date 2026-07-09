import { MapPinLine } from '@phosphor-icons/react'

interface TicketCardProps {
  city: string
  dates: string
  badge: string
  className?: string
}

/**
 * A small destination "ticket" card used in the landing hero's stacked
 * Z-axis cascade visual. Purely decorative/illustrative — not tied to real
 * trip data — matching the reference design's hero-visual pattern.
 */
export function TicketCard({ city, dates, badge, className = '' }: TicketCardProps) {
  return (
    <div
      className={`absolute w-[280px] rounded-[1.4rem] border border-hairline bg-ink-700
                  p-5 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.55)] ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-gold-500/[0.14]">
          <MapPinLine size={16} weight="light" className="text-gold-400" />
        </div>
        <span className="rounded-full border border-gold-500/30 px-2.5 py-1 text-[9.5px] uppercase tracking-[0.15em] text-gold-400">
          {badge}
        </span>
      </div>
      <div className="mt-4 font-display text-xl text-mist-50">{city}</div>
      <div className="mt-1 text-[0.78rem] text-mist-300">{dates}</div>
    </div>
  )
}
