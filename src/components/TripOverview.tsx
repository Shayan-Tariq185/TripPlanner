import { useState } from 'react'
import { CalendarBlank, MapPinLine, ListChecks, CloudSun } from '@phosphor-icons/react'
import type { Trip, Day, Stop, Expense, PackingItem } from '../lib/types'
import { GlassCard } from './GlassCard'
import { MountReveal } from './MountReveal'
import { BudgetDonut } from './BudgetDonut'
import { ReadinessGauge } from './ReadinessGauge'
import { WeatherForecast } from './WeatherForecast'
import { DayMap } from './DayMap'

const QUOTES = [
  'The mountains are calling and I must go. — John Muir',
  'Travel is the only thing you buy that makes you richer.',
  'Not all those who wander are lost. — J.R.R. Tolkien',
  'To travel is to live. — Hans Christian Andersen',
  'Take only memories, leave only footprints.',
]

function quoteFor(destination: string): string {
  const index = destination.length % QUOTES.length
  return QUOTES[index]
}

interface TripOverviewProps {
  trip: Trip
  days: (Day & { stops: Stop[] })[]
  expenses: Expense[]
  packingItems: PackingItem[]
  onViewItinerary: () => void
  onViewPacking: () => void
  onViewBudget: () => void
}

export function TripOverview({
  trip,
  days,
  expenses,
  packingItems,
  onViewItinerary,
  onViewPacking,
  onViewBudget,
}: TripOverviewProps) {
  const allStops = days.flatMap((d) => d.stops)
  const stopCosts = allStops.reduce((sum, s) => sum + (s.est_cost ?? 0), 0)
  const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalSpent = stopCosts + expenseTotal

  const packedCount = packingItems.filter((i) => i.is_checked).length
  const [weatherAvailable, setWeatherAvailable] = useState(true)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <MountReveal className="md:col-span-2">
        <GlassCard
          nested
          className="h-full"
          innerClassName="relative flex h-full flex-col justify-end overflow-hidden p-7"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 500px 300px at 20% 0%, rgba(212,166,87,0.14), transparent 60%)',
            }}
          />
          <div className="relative">
            <span className="eyebrow">
              <span className="eyebrow-dot" /> Your trip
            </span>
            <h2 className="mt-4 font-display text-[1.9rem] font-normal text-mist-50">
              Welcome to your {trip.destination.split(',')[0]} adventure
            </h2>
            <p className="mt-2 max-w-md text-[0.85rem] italic text-mist-300">
              "{quoteFor(trip.destination)}"
            </p>
          </div>
        </GlassCard>
      </MountReveal>

      <MountReveal delayMs={50}>
        <GlassCard className="h-full" innerClassName="flex h-full flex-col items-center justify-center p-6" active>
          <span className="eyebrow mb-1">
            <span className="eyebrow-dot" /> Readiness
          </span>
          <ReadinessGauge startDate={trip.start_date} endDate={trip.end_date} />
        </GlassCard>
      </MountReveal>

      {weatherAvailable && (
        <MountReveal delayMs={75} className="md:col-span-3">
          <GlassCard innerClassName="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-500/30 bg-gold-500/[0.08]">
                  <CloudSun size={18} weight="fill" className="text-gold-400" />
                </span>
                <div>
                  <h3 className="font-display text-[1.15rem] leading-tight text-mist-50">
                    Weather in {trip.destination.split(',')[0]}
                  </h3>
                  <p className="text-[0.7rem] text-mist-400">General 7-day outlook — a feel for the climate, not your exact dates</p>
                </div>
              </div>
            </div>
            <WeatherForecast destination={trip.destination} onUnavailable={() => setWeatherAvailable(false)} />
          </GlassCard>
        </MountReveal>
      )}

      <MountReveal delayMs={100} className="md:col-span-2">
        <button onClick={onViewBudget} className="block w-full text-left">
          <GlassCard className="h-full transition-transform duration-500 hover:-translate-y-1" innerClassName="p-6">
            <span className="eyebrow mb-4">
              <span className="eyebrow-dot" /> Budget
            </span>
            <BudgetDonut spent={totalSpent} budget={trip.budget} currency={trip.currency} />
          </GlassCard>
        </button>
      </MountReveal>

      <MountReveal delayMs={150} className="md:col-span-2 md:row-span-2">
        <GlassCard className="h-full" innerClassName="flex h-full flex-col divide-y divide-white/[0.08] p-0">
          <button onClick={onViewPacking} className="flex flex-1 flex-col p-6 text-left transition-colors duration-300 hover:bg-white/[0.02]">
            <span className="eyebrow mb-3">
              <ListChecks size={11} weight="light" /> Packing
            </span>
            {packingItems.length === 0 ? (
              <p className="text-sm text-mist-400">No items yet.</p>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  {packingItems.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-[0.82rem]">
                      <span
                        className={`h-[14px] w-[14px] shrink-0 rounded-[4px] border ${
                          item.is_checked ? 'border-gold-500 bg-gold-500' : 'border-white/20'
                        }`}
                      />
                      <span className={item.is_checked ? 'text-mist-500 line-through' : 'text-mist-200'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-auto pt-3 text-[0.72rem] text-mist-400">
                  {packedCount} of {packingItems.length} packed
                </p>
              </>
            )}
          </button>

          <button onClick={onViewItinerary} className="flex flex-1 flex-col p-6 text-left transition-colors duration-300 hover:bg-white/[0.02]">
            <span className="eyebrow mb-3">
              <CalendarBlank size={11} weight="light" /> Days &amp; activity
            </span>
            {days.length === 0 ? (
              <p className="text-sm text-mist-400">No itinerary yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {days.slice(0, 3).map((day) => (
                  <div key={day.id} className="border-b border-hairline pb-2.5 last:border-0 last:pb-0">
                    <p className="text-[0.82rem] font-medium text-mist-100">Day {day.day_number}</p>
                    <p className="truncate text-[0.76rem] text-mist-400">
                      {day.stops[0]?.name ?? 'Nothing planned yet'}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-auto pt-3 text-[0.72rem] text-gold-400">View full itinerary →</p>
          </button>
        </GlassCard>
      </MountReveal>

      <MountReveal delayMs={200} className="md:col-span-2 md:row-span-2">
        <GlassCard className="h-full" innerClassName="flex h-full flex-col p-5">
          <span className="eyebrow mb-3">
            <MapPinLine size={11} weight="light" /> Destinations
          </span>
          <div className="min-h-[280px] flex-1">
            <DayMap stops={allStops} showRoute={false} emptyLabel="No stops placed on the map yet." />
          </div>
        </GlassCard>
      </MountReveal>
    </div>
  )
}
