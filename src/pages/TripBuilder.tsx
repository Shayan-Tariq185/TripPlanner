import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  MapPinLine,
  CalendarBlank,
  Wallet,
  Sparkle,
  ArrowLeft,
  CircleNotch,
} from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import type { TravelStyle } from '../lib/types'
import { generateAndSaveItinerary, ItineraryGenerationError } from '../lib/itineraryGenerator'
import { searchDestinationPhoto } from '../lib/pexels'
import { getDailyCount, incrementDailyCount, RATE_LIMITS } from '../lib/rateLimit'
import { GlassCard } from '../components/GlassCard'
import { BrandMark } from '../components/BrandMark'
import { TextField } from '../components/TextField'
import { Button } from '../components/Button'

const STEPS = ['Destination', 'Dates', 'Budget', 'Style'] as const

const STYLE_OPTIONS: { value: TravelStyle; label: string; desc: string }[] = [
  { value: 'relaxed', label: 'Relaxed', desc: 'Fewer stops, more room to breathe' },
  { value: 'packed', label: 'Packed', desc: 'See and do as much as possible' },
  { value: 'budget', label: 'Budget', desc: 'Cost-conscious choices throughout' },
  { value: 'luxury', label: 'Luxury', desc: 'Comfort and quality first' },
]

function makeSlug() {
  return Math.random().toString(36).slice(2, 10)
}

export function TripBuilder() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [budget, setBudget] = useState('')
  const [travelStyle, setTravelStyle] = useState<TravelStyle | null>(null)

  const canAdvance = [
    destination.trim().length > 1,
    startDate && endDate && startDate <= endDate,
    Number(budget) > 0,
    travelStyle !== null,
  ][step]

  async function handleCreate() {
    if (!user || !travelStyle) return

    if (getDailyCount('itinerary-gen', user.id) >= RATE_LIMITS.itineraryGeneration) {
      setError("You've reached today's limit for generating itineraries. Try again tomorrow.")
      return
    }

    setSaving(true)
    setError(null)

    const { data: trip, error: insertError } = await supabase
      .from('trips')
      .insert({
        user_id: user.id,
        destination: destination.trim(),
        start_date: startDate,
        end_date: endDate,
        budget: Number(budget),
        currency: 'PKR',
        travel_style: travelStyle,
        share_slug: makeSlug(),
      })
      .select()
      .single()

    setSaving(false)

    if (insertError || !trip) {
      setError(insertError?.message ?? 'Could not create the trip. Try again.')
      return
    }

    incrementDailyCount('itinerary-gen', user.id)

    setGenerating(true)
    try {
      const [, photo] = await Promise.all([
        generateAndSaveItinerary(trip).catch((err) => {
          // The trip itself saved fine — only the AI draft failed. Continue
          // to the trip anyway; TripView's empty state covers this.
          console.error(err instanceof ItineraryGenerationError ? err.message : err)
        }),
        searchDestinationPhoto(trip.destination),
      ])

      if (photo) {
        await supabase
          .from('trips')
          .update({
            cover_image_url: photo.url,
            cover_photographer_name: photo.photographerName,
            cover_photographer_url: photo.photographerUrl,
          })
          .eq('id', trip.id)
      }
    } finally {
      setGenerating(false)
      navigate(`/trips/${trip.id}`)
    }
  }

  if (generating) {
    return (
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: 'radial-gradient(ellipse 500px 400px at 50% 50%, rgba(232,179,85,0.08), transparent 65%)',
          }}
        />
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute h-16 w-16 animate-spin rounded-full border-2 border-white/10 border-t-gold-400" />
          <BrandMark className="h-6 w-6 text-gold-400" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-normal text-mist-50">Drafting your itinerary…</h2>
          <p className="mt-2 max-w-sm text-sm text-mist-400">
            Planning each day for {destination.trim()}, then placing every stop on the map.
            This takes a few moments.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-12 md:pt-16">
      {/* Step indicator */}
      <div className="mb-10 flex gap-2.5">
        {STEPS.map((label, i) => {
          const done = i < step
          const active = i === step
          return (
            <div key={label} className="flex-1">
              <div className="mb-3 h-[2px] overflow-hidden rounded-full bg-white/[0.14]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ width: done || active ? '100%' : '0%' }}
                />
              </div>
              <div className={`flex items-center gap-1.5 text-[0.68rem] sm:gap-2 sm:text-[0.78rem] ${active ? 'text-gold-400' : 'text-mist-400'}`}>
                <span
                  className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[0.62rem]
                              ${
                                active
                                  ? 'border-gold-500 bg-gold-500 text-[#1a1206]'
                                  : done
                                    ? 'border-gold-500 text-gold-500'
                                    : 'border-hairline-strong text-mist-400'
                              }`}
                >
                  {done ? '✓' : i + 1}
                </span>
                <span className="truncate">{label}</span>
              </div>
            </div>
          )
        })}
      </div>

      <GlassCard nested innerClassName="overflow-hidden p-8 md:p-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ x: direction === 1 ? 40 : -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction === 1 ? -40 : 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {step === 0 && (
              <StepPanel
                icon={MapPinLine}
                title="Where are you headed?"
                subtitle="Any city, region, or country."
              >
                <TextField
                  label="Destination"
                  placeholder="e.g. Istanbul, Turkey"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  autoFocus
                />
              </StepPanel>
            )}

            {step === 1 && (
              <StepPanel icon={CalendarBlank} title="When are you going?" subtitle="Pick your start and end dates.">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    label="Start date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <TextField
                    label="End date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || undefined}
                  />
                </div>
                {startDate && endDate && startDate > endDate && (
                  <p className="mt-2 text-sm text-coral-500">End date should be after the start date.</p>
                )}
              </StepPanel>
            )}

            {step === 2 && (
              <StepPanel icon={Wallet} title="What's your budget?" subtitle="Total for the whole trip, in PKR.">
                <TextField
                  label="Budget (PKR)"
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 150,000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  min={1}
                />
              </StepPanel>
            )}

            {step === 3 && (
              <StepPanel icon={Sparkle} title="How do you like to travel?" subtitle="This shapes the pace and picks.">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {STYLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTravelStyle(opt.value)}
                      className={`rounded-[1.2rem] border p-[1.1rem_1.2rem] text-left transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]
                                  ${
                                    travelStyle === opt.value
                                      ? 'border-gold-500 bg-gold-500/[0.08] shadow-[0_0_0_3px_rgba(212,166,87,0.1)]'
                                      : 'border-hairline-strong bg-ink-900/60 hover:bg-white/[0.04]'
                                  }`}
                    >
                      <p className="font-display text-[1.05rem] text-mist-50">{opt.label}</p>
                      <p className="mt-1 text-[0.78rem] text-mist-300">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </StepPanel>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <p className="mt-4 text-sm text-coral-500">{error}</p>}

        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setDirection(-1)
              if (step === 0) navigate('/dashboard')
              else setStep(step - 1)
            }}
            className="flex items-center gap-2 text-sm text-mist-400 hover:text-mist-100 transition-colors duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]"
          >
            <ArrowLeft size={16} weight="light" />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

          {step < STEPS.length - 1 ? (
            <Button
              disabled={!canAdvance}
              onClick={() => {
                setDirection(1)
                setStep(step + 1)
              }}
            >
              Continue
            </Button>
          ) : (
            <Button disabled={!canAdvance || saving} withArrow onClick={handleCreate}>
              {saving ? <CircleNotch size={18} className="animate-spin" /> : 'Generate itinerary'}
            </Button>
          )}
        </div>
      </GlassCard>
    </div>
  )
}

function StepPanel({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof MapPinLine
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold-500/25 bg-gold-500/10">
        <Icon size={24} weight="light" className="text-gold-400" />
      </div>
      <h2 className="mt-6 font-display text-[2.1rem] font-normal text-mist-50">{title}</h2>
      <p className="mt-1 text-[0.92rem] text-mist-300">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </div>
  )
}
