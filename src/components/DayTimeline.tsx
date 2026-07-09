import { motion } from 'framer-motion'
import {
  MapPinLine,
  ForkKnife,
  Bed,
  Car,
  WarningCircle,
  PencilSimple,
  Trash,
  Plus,
  Clock,
  ArrowSquareOut,
} from '@phosphor-icons/react'
import type { Stop, Currency } from '../lib/types'
import { formatMoney } from '../lib/currency'
import { mapsSearchUrl } from '../lib/maps'

const TYPE_ICON: Record<Stop['type'], typeof MapPinLine> = {
  attraction: MapPinLine,
  restaurant: ForkKnife,
  hotel: Bed,
  transport: Car,
}

const TYPE_LABEL: Record<Stop['type'], string> = {
  attraction: 'Attraction',
  restaurant: 'Restaurant',
  hotel: 'Hotel',
  transport: 'Transport',
}

// Each type gets its own accent so the spine reads as a colour-coded journey
// rather than a single flat line. Values reference the theme's palette.
const TYPE_ACCENT: Record<Stop['type'], { text: string; ring: string; glow: string; dot: string }> = {
  hotel: { text: 'text-gold-400', ring: 'border-gold-500/40', glow: 'rgba(212,166,87,0.25)', dot: '#d4a657' },
  restaurant: { text: 'text-coral-500', ring: 'border-coral-500/40', glow: 'rgba(232,120,90,0.25)', dot: '#e8785a' },
  attraction: { text: 'text-teal-500', ring: 'border-teal-500/40', glow: 'rgba(127,163,126,0.25)', dot: '#7fa37e' },
  transport: { text: 'text-[#8fb4e0]', ring: 'border-[#8fb4e0]/40', glow: 'rgba(143,180,224,0.25)', dot: '#8fb4e0' },
}

function to12h(time: string | null): string | null {
  if (!time) return null
  const [hStr, mStr] = time.split(':')
  const h = Number(hStr)
  if (Number.isNaN(h)) return time
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${mStr ?? '00'} ${period}`
}

interface DayTimelineProps {
  stops: Stop[]
  currency: Currency
  destination: string
  onEditStop: (stop: Stop) => void
  onDeleteStop: (stopId: string) => void
  onAddStop: () => void
}

/**
 * Premium single-day timeline. Renders a glowing vertical spine threading
 * through colour-coded stop nodes, each a rich card with type, time and cost.
 * Replaces the old flat 1px line + plain rows. Drag-reorder now lives at the
 * day-card level (the horizontal boarding-pass view keeps interactions simple),
 * so this component is presentation + per-stop actions only.
 */
export function DayTimeline({ stops, currency, destination, onEditStop, onDeleteStop, onAddStop }: DayTimelineProps) {
  if (stops.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[1.4rem] border border-dashed border-hairline-strong py-10 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline-strong bg-ink-900 text-mist-500">
          <MapPinLine size={20} weight="light" />
        </div>
        <p className="text-sm text-mist-400">Nothing planned for this day yet.</p>
        <button
          onClick={onAddStop}
          className="flex items-center gap-1.5 rounded-full border border-hairline-strong bg-ink-600 px-4 py-2 text-[0.8rem] text-mist-100 transition-all duration-300 hover:border-gold-500 hover:text-gold-400"
        >
          <Plus size={13} weight="bold" /> Add the first stop
        </button>
      </div>
    )
  }

  return (
    <div className="relative pl-2">
      {/* The spine: a soft gradient rail sitting behind the node column. */}
      <div
        className="pointer-events-none absolute bottom-8 left-[26px] top-4 w-[2px] rounded-full"
        style={{
          background:
            'linear-gradient(180deg, rgba(212,166,87,0.05), rgba(212,166,87,0.45) 12%, rgba(127,163,126,0.4) 88%, rgba(127,163,126,0.05))',
        }}
        aria-hidden="true"
      />

      <div className="flex flex-col">
        {stops.map((stop, index) => {
          const Icon = TYPE_ICON[stop.type]
          const accent = TYPE_ACCENT[stop.type]
          const time = to12h(stop.start_time)

          return (
            <motion.div
              key={stop.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex gap-4 pb-2 last:pb-0"
            >
              {/* Node */}
              <div className="relative z-10 flex flex-col items-center pt-3">
                <div
                  className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border ${accent.ring} bg-ink-900`}
                  style={{ boxShadow: `0 0 0 4px var(--surface), 0 0 20px -2px ${accent.glow}` }}
                >
                  <Icon size={17} weight="light" className={accent.text} />
                </div>
              </div>

              {/* Content card */}
              <div className="min-w-0 flex-1 rounded-[1.15rem] border border-hairline bg-white/[0.015] px-4 py-3 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:border-hairline-strong group-hover:bg-white/[0.03]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {time && (
                      <span className="tabular mb-1 flex items-center gap-1 text-[0.72rem] font-medium text-mist-300">
                        <Clock size={11} weight="light" className="text-mist-400" />
                        {time}
                      </span>
                    )}
                    <div className="flex items-start gap-1.5">
                      <p className="text-[0.92rem] font-medium leading-snug text-mist-50 [overflow-wrap:anywhere]">
                        {stop.name.split(',')[0]}
                      </p>
                      {stop.geocode_status === 'unresolved' && (
                        <span title="Location not found on map — you can search and pin it manually later">
                          <WarningCircle size={13} weight="light" className="mt-0.5 shrink-0 text-coral-500" />
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[0.74rem]">
                      <span className={`rounded-full border px-2 py-0.5 ${accent.ring} ${accent.text}`}>
                        {TYPE_LABEL[stop.type]}
                      </span>
                      {stop.est_cost ? (
                        <span className="tabular text-mist-300">{formatMoney(stop.est_cost, currency)}</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Per-stop actions — always visible on touch, hover-revealed on desktop */}
                  <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100">
                    <a
                      href={mapsSearchUrl(stop.name, destination)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${stop.name.split(',')[0]} in Google Maps`}
                      title="Open in Google Maps"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-mist-400 hover:bg-gold-500/10 hover:text-gold-400"
                    >
                      <ArrowSquareOut size={15} weight="light" />
                    </a>
                    <button
                      onClick={() => onEditStop(stop)}
                      aria-label="Edit stop"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-mist-400 hover:bg-white/[0.06] hover:text-mist-100"
                    >
                      <PencilSimple size={15} weight="light" />
                    </button>
                    <button
                      onClick={() => onDeleteStop(stop.id)}
                      aria-label="Delete stop"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-mist-400 hover:bg-coral-500/10 hover:text-coral-500"
                    >
                      <Trash size={15} weight="light" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
