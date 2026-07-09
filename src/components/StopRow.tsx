import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import {
  DotsSixVertical,
  MapPinLine,
  ForkKnife,
  Bed,
  Car,
  WarningCircle,
  PencilSimple,
  Trash,
} from '@phosphor-icons/react'
import type { Stop, Currency } from '../lib/types'
import { formatMoney } from '../lib/currency'

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

const TYPE_COLOR: Record<Stop['type'], string> = {
  hotel: 'text-gold-400',
  restaurant: 'text-coral-500',
  attraction: 'text-teal-500',
  transport: 'text-[#8fb4e0]',
}

interface StopRowProps {
  stop: Stop
  currency: Currency
  onEdit: () => void
  onDelete: () => void
}

export function StopRow({ stop, currency, onEdit, onDelete }: StopRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stop.id,
  })

  const Icon = TYPE_ICON[stop.type]

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout={!isDragging}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      className={`group flex items-center gap-3 rounded-[1.1rem] border border-transparent px-[0.5rem] py-[0.9rem]
                  transition-colors duration-300 hover:border-hairline hover:bg-white/[0.03]
                  ${isDragging ? 'z-10 opacity-90 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.6)]' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center text-mist-400 hover:text-mist-200 active:cursor-grabbing"
      >
        <DotsSixVertical size={18} weight="bold" />
      </button>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline-strong bg-ink-900">
        <Icon size={17} weight="light" className={TYPE_COLOR[stop.type]} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[0.92rem] text-mist-50">{stop.name}</p>
          {stop.geocode_status === 'unresolved' && (
            <span title="Location not found on map — you can search and pin it manually later">
              <WarningCircle size={14} weight="light" className="shrink-0 text-coral-500" />
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[0.76rem] text-mist-400">
          {TYPE_LABEL[stop.type]}
          {stop.est_cost ? ` · ${formatMoney(stop.est_cost, currency)}` : ''}
        </p>
      </div>

      {stop.start_time && (
        <span className="tabular hidden shrink-0 text-[0.82rem] font-medium text-mist-300 sm:block">
          {stop.start_time}
        </span>
      )}

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <button
          onClick={onEdit}
          aria-label="Edit stop"
          className="flex h-8 w-8 items-center justify-center rounded-full text-mist-400 hover:bg-white/[0.06] hover:text-mist-100"
        >
          <PencilSimple size={15} weight="light" />
        </button>
        <button
          onClick={onDelete}
          aria-label="Delete stop"
          className="flex h-8 w-8 items-center justify-center rounded-full text-mist-400 hover:bg-coral-500/10 hover:text-coral-500"
        >
          <Trash size={15} weight="light" />
        </button>
      </div>
    </motion.div>
  )
}
