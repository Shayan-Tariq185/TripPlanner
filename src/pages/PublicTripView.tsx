import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CalendarBlank, WarningCircle, MapTrifold } from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'
import type { Trip, Day, Stop } from '../lib/types'
import { formatMoney } from '../lib/currency'
import { GlassCard } from '../components/GlassCard'
import { BrandMark } from '../components/BrandMark'
import { CoverPhoto } from '../components/CoverPhoto'
import { PublicTripViewSkeleton } from '../components/PublicTripViewSkeleton'
import { DayMap } from '../components/DayMap'

type DayWithStops = Day & { stops: Stop[] }

const STOP_TYPE_LABEL: Record<Stop['type'], string> = {
  hotel: 'Hotel',
  restaurant: 'Restaurant',
  attraction: 'Attraction',
  transport: 'Transport',
}

/**
 * Public, read-only view of a trip's itinerary — reachable via a share link,
 * no login required. Deliberately only ever fetches trips/days/stops, which
 * are the only tables with a public RLS SELECT policy. Budget, notes, and
 * packing list are owner-only and never queried here.
 */
export function PublicTripView() {
  const { shareSlug } = useParams()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [days, setDays] = useState<DayWithStops[]>([])
  const [activeDayId, setActiveDayId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!shareSlug) return
    let active = true

    async function load() {
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('share_slug', shareSlug)
        .single()

      if (tripError || !tripData) {
        if (active) setLoading(false)
        return
      }

      const { data: dayData } = await supabase
        .from('days')
        .select('*, stops(*)')
        .eq('trip_id', tripData.id)
        .order('day_number', { ascending: true })

      if (!active) return

      const loadedDays = ((dayData ?? []) as DayWithStops[]).map((d) => ({
        ...d,
        stops: [...d.stops].sort((a, b) => a.order_index - b.order_index),
      }))

      setTrip(tripData as Trip)
      setDays(loadedDays)
      setActiveDayId(loadedDays[0]?.id ?? null)
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [shareSlug])

  const activeDay = days.find((d) => d.id === activeDayId) ?? days[0] ?? null

  if (loading) {
    return <PublicTripViewSkeleton />
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-40 text-center">
        <p className="text-mist-100">This trip link doesn't lead anywhere.</p>
        <p className="mt-1 text-sm text-mist-400">It may have been deleted, or the link is incorrect.</p>
        <Link to="/" className="mt-4 inline-block text-gold-300 hover:text-gold-200">
          Go to VoyageFlow
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-10">
      <Link to="/" className="flex items-center gap-2 font-display text-lg text-mist-50">
        <BrandMark className="h-5 w-5 text-gold-500" />
        VoyageFlow
      </Link>

      <div className="mt-8">
        <CoverPhoto
          imageUrl={trip.cover_image_url}
          photographerName={trip.cover_photographer_name}
          photographerUrl={trip.cover_photographer_url}
        >
          <span className="eyebrow">
            <span className="eyebrow-dot" /> Shared itinerary
          </span>
          <h1 className="mt-4 font-display text-4xl font-normal text-mist-50">{trip.destination}</h1>
          <div className="mt-3 flex items-center gap-1.5 text-sm text-mist-200">
            <CalendarBlank size={16} weight="light" className="text-mist-300" />
            <span className="tabular">
              {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
              {new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </CoverPhoto>
      </div>

      {days.length === 0 ? (
        <div className="mt-10">
          <GlassCard innerClassName="p-10 text-center">
            <p className="text-mist-100">This trip doesn't have an itinerary yet.</p>
          </GlassCard>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_460px]">
          <div className="flex flex-col gap-6">
            {days.map((day) => {
              const unresolvedCount = day.stops.filter((s) => s.geocode_status === 'unresolved').length
              return (
                <GlassCard
                  key={day.id}
                  active={activeDayId === day.id}
                  className={activeDayId === day.id ? '' : 'opacity-80 hover:opacity-100'}
                  onClick={() => setActiveDayId(day.id)}
                >
                  <div className="p-[1.6rem]">
                    <h2 className="font-display text-[1.5rem] font-medium text-mist-50">Day {day.day_number}</h2>
                    {unresolvedCount > 0 && (
                      <p className="mt-1 flex items-center gap-1.5 text-[0.74rem] text-coral-500">
                        <WarningCircle size={13} weight="light" />
                        {unresolvedCount} stop{unresolvedCount > 1 ? 's' : ''} couldn't be placed on the map
                      </p>
                    )}

                    <div className="mt-[1.3rem] flex flex-col gap-1">
                      {day.stops.length === 0 ? (
                        <p className="py-6 text-center text-sm text-mist-400">No stops for this day.</p>
                      ) : (
                        day.stops.map((stop) => (
                          <div
                            key={stop.id}
                            className="flex items-center justify-between gap-3 rounded-[1.1rem] px-[0.5rem] py-[0.9rem] transition-colors duration-300 hover:bg-white/[0.03]"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[0.92rem] text-mist-50">{stop.name}</p>
                              <p className="mt-0.5 text-[0.76rem] text-mist-400">
                                {STOP_TYPE_LABEL[stop.type]}
                                {stop.est_cost ? ` · ${formatMoney(stop.est_cost, trip.currency)}` : ''}
                              </p>
                            </div>
                            {stop.start_time && (
                              <span className="tabular shrink-0 text-[0.82rem] font-medium text-mist-300">
                                {stop.start_time}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </GlassCard>
              )
            })}
          </div>

          <div className="xl:sticky xl:top-10 xl:self-start">
            <GlassCard innerClassName="p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="eyebrow">
                  <MapTrifold size={11} weight="light" /> Map
                </span>
                {activeDay && (
                  <span className="text-[0.74rem] text-mist-400">Day {activeDay.day_number}</span>
                )}
              </div>
              <div className="h-[420px] sm:h-[480px]">
                <DayMap stops={activeDay?.stops ?? []} />
              </div>
              <p className="mt-2.5 text-[0.72rem] text-mist-400">
                Tap a day on the left to see its stops and route here.
              </p>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  )
}
