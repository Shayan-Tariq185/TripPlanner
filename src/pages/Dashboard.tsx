import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPinLine, Plus } from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import type { Trip } from '../lib/types'
import { TripCardTall } from '../components/TripCardTall'
import { MountReveal } from '../components/MountReveal'
import { DashboardSkeleton } from '../components/DashboardSkeleton'
import { OnboardingCard, hasSeenOnboarding } from '../components/OnboardingCard'
import { Button } from '../components/Button'

interface TripWithProgress extends Trip {
  daysPlanned: number
  totalDays: number
}

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState<TripWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(() => !hasSeenOnboarding())

  useEffect(() => {
    if (!user) return
    let active = true

    async function load() {
      const { data: tripRows, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (!active) return
      if (error || !tripRows) {
        console.error(error)
        setLoading(false)
        return
      }

      const withProgress = await Promise.all(
        (tripRows as Trip[]).map(async (trip) => {
          const { data: days } = await supabase
            .from('days')
            .select('id, stops(id)')
            .eq('trip_id', trip.id)

          const totalDays = days?.length ?? 0
          const daysPlanned = (days ?? []).filter(
            (d) => Array.isArray((d as { stops: unknown[] }).stops) && (d as { stops: unknown[] }).stops.length > 0
          ).length

          return { ...trip, daysPlanned, totalDays }
        })
      )

      if (!active) return
      setTrips(withProgress)
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [user])

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-12 md:pt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-dot" /> Your travel library
          </span>
          <h1 className="mt-5 font-display text-4xl font-normal text-mist-50 md:text-5xl">
            Your{' '}
            <em className="bg-gradient-to-br from-gold-300 via-gold-400 to-coral-500 bg-clip-text italic text-transparent">
              trips
            </em>
          </h1>
          <p className="mt-2 text-mist-300">Pick one up, or start somewhere new.</p>
        </div>
        <Button size="lg" withArrow onClick={() => navigate('/trips/new')}>
          New trip
        </Button>
      </div>

      <div className="mt-10">
        {loading ? (
          <DashboardSkeleton />
        ) : trips.length === 0 ? (
          <div className="flex flex-col gap-6">
            {showOnboarding && <OnboardingCard onDismiss={() => setShowOnboarding(false)} />}
            <MountReveal>
            <div className="relative flex flex-col items-center gap-4 overflow-hidden rounded-[1.8rem] border border-dashed border-hairline-strong py-20 text-center">
              <div
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{
                  background:
                    'radial-gradient(ellipse 400px 240px at 50% 30%, rgba(212,166,87,0.08), transparent 70%)',
                }}
              />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/10">
                <MapPinLine size={28} weight="light" className="text-gold-400" />
              </div>
              <div className="relative">
                <p className="font-display text-xl text-mist-50">No trips yet.</p>
                <p className="mt-1 text-sm text-mist-400">Your first itinerary is a couple of questions away.</p>
              </div>
              <Button className="relative mt-2" withArrow onClick={() => navigate('/trips/new')}>
                Build your first trip
              </Button>
            </div>
            </MountReveal>
          </div>
        ) : (
          <div>
            {trips.length > 2 && (
              <p className="mb-3 hidden text-[0.72rem] text-mist-500 sm:block">Swipe to browse your trips →</p>
            )}
            <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 [scrollbar-width:thin]">
              {trips.map((trip, index) => (
                <MountReveal key={trip.id} delayMs={index * 60} className="shrink-0">
                  <TripCardTall trip={trip} daysPlanned={trip.daysPlanned} totalDays={trip.totalDays} />
                </MountReveal>
              ))}

              <MountReveal delayMs={trips.length * 60} className="shrink-0">
                <button
                  onClick={() => navigate('/trips/new')}
                  className="flex h-[440px] w-[300px] shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-[1.8rem] border-[1.5px] border-dashed border-hairline-strong text-center transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-gold-500 sm:w-[320px]"
                >
                  <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-hairline-strong">
                    <Plus size={20} weight="light" className="text-mist-300" />
                  </span>
                  <span className="text-[0.92rem] text-mist-300">Start somewhere new</span>
                </button>
              </MountReveal>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
