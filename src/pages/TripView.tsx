import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CalendarBlank,
  Wallet,
  ArrowLeft,
  Trash,
  MapTrifold,
  Coins,
  NotePencil,
  CheckSquare,
  ChatCircle,
  ArrowsClockwise,
  Info,
  Sparkle,
  PencilSimple,
  MapPin,
} from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'
import { geocodeLocation } from '../lib/geoapify'
import { healUnplacedStops } from '../lib/itineraryGenerator'
import { mapsDirectionsUrl } from '../lib/maps'
import { formatMoney } from '../lib/currency'
import {
  regenerateItinerary,
  regenerateSingleDay,
  ItineraryGenerationError,
} from '../lib/itineraryGenerator'
import { getDailyCount, incrementDailyCount, RATE_LIMITS } from '../lib/rateLimit'
import type { Trip, Day, Stop, Expense, Note, PackingItem, Comment } from '../lib/types'
import { GlassCard } from '../components/GlassCard'
import { StopEditor, type StopFormValues } from '../components/StopEditor'
import { DayMap } from '../components/DayMap'
import { BudgetTracker } from '../components/BudgetTracker'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { NotesPanel } from '../components/NotesPanel'
import { PackingList } from '../components/PackingList'
import { CommentsPanel } from '../components/CommentsPanel'
import { TripAssistantPanel } from '../components/TripAssistantPanel'
import { TripDetailsEditor, type TripDetailsFormValues } from '../components/TripDetailsEditor'
import { ShareButton } from '../components/ShareButton'
import { CoverPhoto } from '../components/CoverPhoto'
import { TripViewSkeleton } from '../components/TripViewSkeleton'
import { TripOverview } from '../components/TripOverview'
import { BoardingPassDay } from '../components/BoardingPassDay'
import { SquaresFour } from '@phosphor-icons/react'

type DayWithStops = Day & { stops: Stop[] }
type MainView = 'overview' | 'itinerary' | 'budget' | 'notes' | 'packing' | 'comments' | 'assistant'

const TABS: { key: MainView; label: string; icon: typeof MapTrifold }[] = [
  { key: 'overview', label: 'Overview', icon: SquaresFour },
  { key: 'itinerary', label: 'Itinerary', icon: MapTrifold },
  { key: 'budget', label: 'Budget', icon: Coins },
  { key: 'notes', label: 'Notes', icon: NotePencil },
  { key: 'packing', label: 'Packing', icon: CheckSquare },
  { key: 'comments', label: 'Comments', icon: ChatCircle },
  { key: 'assistant', label: 'Assistant', icon: Sparkle },
]

export function TripView() {
  const { tripId } = useParams()
  const navigate = useNavigate()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [days, setDays] = useState<DayWithStops[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [packingItems, setPackingItems] = useState<PackingItem[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  const [activeDayId, setActiveDayId] = useState<string | null>(null)
  const [mainView, setMainView] = useState<MainView>('overview')

  const [editorOpen, setEditorOpen] = useState(false)
  const [editorDayId, setEditorDayId] = useState<string | null>(null)
  const [editorStop, setEditorStop] = useState<Stop | null>(null)
  const [savingStop, setSavingStop] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [regenerateOpen, setRegenerateOpen] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [regeneratingDayId, setRegeneratingDayId] = useState<string | null>(null)
  const [regenerateError, setRegenerateError] = useState<string | null>(null)

  const [detailsEditorOpen, setDetailsEditorOpen] = useState(false)
  const [savingDetails, setSavingDetails] = useState(false)

  useEffect(() => {
    if (!tripId) return
    let active = true

    async function load() {
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single()

      if (tripError || !tripData) {
        if (active) setLoading(false)
        return
      }

      const [
        { data: dayData },
        { data: expenseData },
        { data: noteData },
        { data: packingData },
        { data: commentData },
      ] = await Promise.all([
        supabase
          .from('days')
          .select('*, stops(*)')
          .eq('trip_id', tripId)
          .order('day_number', { ascending: true }),
        supabase.from('expenses').select('*').eq('trip_id', tripId).order('date', { ascending: false }),
        supabase.from('notes').select('*').eq('trip_id', tripId),
        supabase.from('packing_items').select('*').eq('trip_id', tripId).order('label'),
        supabase.from('comments').select('*').eq('trip_id', tripId).order('created_at', { ascending: true }),
      ])

      if (!active) return

      const loadedDays = ((dayData ?? []) as DayWithStops[]).map((d) => ({
        ...d,
        stops: [...d.stops].sort((a, b) => a.order_index - b.order_index),
      }))

      setTrip(tripData as Trip)
      setDays(loadedDays)
      setExpenses((expenseData ?? []) as Expense[])
      setNotes((noteData ?? []) as Note[])
      setPackingItems((packingData ?? []) as PackingItem[])
      setComments((commentData ?? []) as Comment[])
      setActiveDayId(loadedDays[0]?.id ?? null)
      setLoading(false)

      // Silently heal any stops that never got coordinates (older trips, or
      // names the geocoder couldn't place on first pass). Runs in the
      // background; if it fixes anything, re-fetch stops so the map and the
      // "not on map" count update without the user doing anything.
      const unplaced = loadedDays.flatMap((d) =>
        d.stops.filter((s) => s.lat === null || s.lng === null),
      )
      if (unplaced.length > 0) {
        healUnplacedStops(
          (tripData as Trip).destination,
          unplaced.map((s) => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng })),
        ).then((fixed) => {
          if (fixed > 0 && active) reloadDaysAndTrip()
        })
      }
    }

    load()
    return () => {
      active = false
    }
    // reloadDaysAndTrip is a stable declaration; including it would needlessly
    // re-run the whole initial load. Intentionally keyed on tripId only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  function openAddStop(dayId: string) {
    setEditorDayId(dayId)
    setEditorStop(null)
    setEditorOpen(true)
  }

  function openEditStop(dayId: string, stop: Stop) {
    setEditorDayId(dayId)
    setEditorStop(stop)
    setEditorOpen(true)
  }

  async function handleSaveStop(values: StopFormValues) {
    if (!editorDayId) return
    setSavingStop(true)

    const estCost = values.est_cost ? Number(values.est_cost) : null

    if (editorStop) {
      const nameChanged = values.name.trim() !== editorStop.name
      let geoUpdate: Partial<Stop> = {}
      if (nameChanged) {
        const geo = await geocodeLocation(values.name.trim())
        geoUpdate = {
          lat: geo?.lat ?? null,
          lng: geo?.lng ?? null,
          geocode_status: geo && geo.confidence >= 0.4 ? 'resolved' : 'unresolved',
        }
      }

      const { data, error } = await supabase
        .from('stops')
        .update({
          name: values.name.trim(),
          type: values.type,
          start_time: values.start_time || null,
          est_cost: estCost,
          notes: values.notes || null,
          ...geoUpdate,
        })
        .eq('id', editorStop.id)
        .select()
        .single()

      setSavingStop(false)
      if (!error && data) {
        setDays((prev) =>
          prev.map((d) =>
            d.id === editorDayId
              ? { ...d, stops: d.stops.map((s) => (s.id === data.id ? (data as Stop) : s)) }
              : d
          )
        )
        setEditorOpen(false)
      }
      return
    }

    const day = days.find((d) => d.id === editorDayId)
    const orderIndex = day ? day.stops.length : 0
    const geo = await geocodeLocation(values.name.trim())

    const { data, error } = await supabase
      .from('stops')
      .insert({
        day_id: editorDayId,
        order_index: orderIndex,
        type: values.type,
        name: values.name.trim(),
        start_time: values.start_time || null,
        est_cost: estCost,
        notes: values.notes || null,
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
        geocode_status: geo && geo.confidence >= 0.4 ? 'resolved' : 'unresolved',
      })
      .select()
      .single()

    setSavingStop(false)
    if (!error && data) {
      setDays((prev) =>
        prev.map((d) => (d.id === editorDayId ? { ...d, stops: [...d.stops, data as Stop] } : d))
      )
      setEditorOpen(false)
    }
  }

  async function handleDeleteStop(dayId: string, stopId: string) {
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, stops: d.stops.filter((s) => s.id !== stopId) } : d))
    )
    await supabase.from('stops').delete().eq('id', stopId)
  }

  async function handleDeleteTrip() {
    if (!trip) return
    setDeleting(true)
    const { error } = await supabase.from('trips').delete().eq('id', trip.id)
    setDeleting(false)

    if (!error) {
      navigate('/dashboard')
      return
    }
    // If deletion fails, keep the dialog open so the user can see something went wrong and retry.
  }

  async function reloadDaysAndTrip() {
    if (!tripId) return
    const [{ data: tripData }, { data: dayData }] = await Promise.all([
      supabase.from('trips').select('*').eq('id', tripId).single(),
      supabase.from('days').select('*, stops(*)').eq('trip_id', tripId).order('day_number', { ascending: true }),
    ])

    if (tripData) setTrip(tripData as Trip)

    const loadedDays = ((dayData ?? []) as DayWithStops[]).map((d) => ({
      ...d,
      stops: [...d.stops].sort((a, b) => a.order_index - b.order_index),
    }))
    setDays(loadedDays)
    setActiveDayId(loadedDays[0]?.id ?? null)
  }

  async function handleRegenerateItinerary() {
    if (!trip) return

    if (getDailyCount('itinerary-gen', trip.user_id) >= RATE_LIMITS.itineraryGeneration) {
      setRegenerateError("You've reached today's limit for regenerating itineraries. Try again tomorrow.")
      return
    }

    setRegenerating(true)
    setRegenerateError(null)

    try {
      await regenerateItinerary(trip)
      incrementDailyCount('itinerary-gen', trip.user_id)
      await reloadDaysAndTrip()
      setRegenerateOpen(false)
    } catch (err) {
      setRegenerateError(
        err instanceof ItineraryGenerationError ? err.message : 'Could not regenerate the itinerary. Try again.'
      )
    } finally {
      setRegenerating(false)
    }
  }

  async function handleRegenerateDay(dayId: string) {
    if (!trip) return

    if (getDailyCount('day-regen', trip.user_id) >= RATE_LIMITS.dayRegeneration) {
      console.error("Daily limit for regenerating days reached.")
      return
    }

    setRegeneratingDayId(dayId)

    try {
      await regenerateSingleDay(trip, dayId)
      incrementDailyCount('day-regen', trip.user_id)
      await reloadDaysAndTrip()
    } catch (err) {
      // Surfaced inline via a transient error rather than a dialog, since
      // this is a smaller, per-day action — a full-screen error would feel
      // disproportionate to what the user asked for.
      console.error(err instanceof ItineraryGenerationError ? err.message : err)
    } finally {
      setRegeneratingDayId(null)
    }
  }

  async function handleSaveTripDetails(values: TripDetailsFormValues) {
    if (!trip) return
    setSavingDetails(true)

    const { error } = await supabase
      .from('trips')
      .update({
        destination: values.destination.trim(),
        start_date: values.start_date,
        end_date: values.end_date,
        budget: Number(values.budget),
        travel_style: values.travel_style,
      })
      .eq('id', trip.id)

    setSavingDetails(false)

    if (!error) {
      await reloadDaysAndTrip()
      setDetailsEditorOpen(false)
    }
    // If it fails, keep the modal open so the user can see something went wrong and retry.
  }

  const allStops = days.flatMap((d) => d.stops)
  const activeDay = days.find((d) => d.id === activeDayId) ?? days[0] ?? null

  if (loading) {
    return <TripViewSkeleton />
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-40 text-center">
        <p className="text-mist-100">Trip not found.</p>
        <Link to="/dashboard" className="mt-4 inline-block text-gold-300 hover:text-gold-200">
          Back to your trips
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-12 md:pt-16">
      <Link to="/dashboard" className="flex items-center gap-2 text-sm text-mist-400 hover:text-mist-100 transition-colors duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <ArrowLeft size={16} weight="light" />
        Your trips
      </Link>

      <div className="mt-4">
        <CoverPhoto
          imageUrl={trip.cover_image_url}
          photographerName={trip.cover_photographer_name}
          photographerUrl={trip.cover_photographer_url}
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span
                className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-mist-100 backdrop-blur-sm"
              >
                <MapTrifold size={11} weight="light" />
                {days.length} day{days.length === 1 ? '' : 's'} planned
              </span>
              <h1
                className="font-display text-[2.6rem] font-normal leading-[1.02] text-mist-50 md:text-[3.4rem]"
                style={{ textShadow: '0 2px 30px rgba(0,0,0,0.55)' }}
              >
                {trip.destination}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-mist-100">
                <span className="flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 backdrop-blur-sm">
                  <CalendarBlank size={15} weight="light" className="text-gold-300" />
                  <span className="tabular">
                    {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                    {new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 backdrop-blur-sm">
                  <Wallet size={15} weight="light" className="text-gold-300" />
                  <span className="tabular">{formatMoney(trip.budget, trip.currency)}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <ShareButton shareSlug={trip.share_slug} />
              <button
                onClick={() => setDetailsEditorOpen(true)}
                aria-label="Edit trip details"
                title="Edit trip details"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-white/20 bg-black/25 text-mist-100 backdrop-blur-sm transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-gold-500 hover:text-gold-400"
              >
                <PencilSimple size={15} weight="light" />
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                aria-label="Delete trip"
                title="Delete trip"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-white/20 bg-black/25 text-mist-100 backdrop-blur-sm transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-coral-500 hover:text-coral-500"
              >
                <Trash size={15} weight="light" />
              </button>
            </div>
          </div>
        </CoverPhoto>
      </div>

      {days.length > 0 && (
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          {/* Full-width section navigation — every area of the trip in one roomy row */}
          <nav className="flex w-full items-center gap-1 overflow-x-auto rounded-full border border-hairline-strong bg-ink-900/80 p-1 backdrop-blur-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:w-auto">
            {TABS.map(({ key, label, icon: Icon }) => {
              const isAssistant = key === 'assistant'
              const isActive = mainView === key
              return (
                <button
                  key={key}
                  onClick={() => setMainView(key)}
                  className={`relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[0.82rem] transition-colors duration-300 ${
                    isActive
                      ? 'text-mist-50'
                      : isAssistant
                        ? 'text-gold-300 hover:text-gold-200'
                        : 'text-mist-400 hover:text-mist-200'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="main-view-pill"
                      className="absolute inset-0 rounded-full bg-gradient-to-b from-ink-500 to-ink-600 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.5)]"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  {/* Assistant gets a persistent gold ring + glow so it reads as
                      the special, AI-powered tab even when not selected. */}
                  {isAssistant && !isActive && (
                    <span
                      className="absolute inset-0 rounded-full border border-gold-500/40"
                      style={{ background: 'rgba(212,166,87,0.08)', boxShadow: '0 0 16px -4px rgba(212,166,87,0.4)' }}
                    />
                  )}
                  <Icon
                    size={15}
                    weight={isAssistant ? 'fill' : 'light'}
                    className={`relative ${isAssistant && !isActive ? 'text-gold-400' : ''}`}
                  />
                  <span className="relative">{label}</span>
                </button>
              )
            })}
          </nav>

          <button
            onClick={() => setRegenerateOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-hairline-strong bg-ink-800 px-4 py-2 text-[0.8rem] text-mist-300 transition-all duration-400 hover:border-gold-500 hover:text-gold-400"
          >
            <ArrowsClockwise size={13} weight="light" />
            <span className="hidden sm:inline">Regenerate itinerary</span>
            <span className="sm:hidden">Regenerate</span>
          </button>
        </div>
      )}

      {trip.scope_note && (
        <div className="mt-4 flex items-start gap-2.5 rounded-[1.1rem] border border-gold-500/25 bg-gold-500/[0.06] px-4 py-3">
          <Info size={15} weight="light" className="mt-0.5 shrink-0 text-gold-400" />
          <p className="text-[0.82rem] text-mist-200">{trip.scope_note}</p>
        </div>
      )}

      {days.length === 0 ? (
        <div className="mt-10">
          <GlassCard innerClassName="p-10 text-center">
            <p className="text-mist-100">No itinerary yet.</p>
            <p className="mt-1 text-sm text-mist-400">
              This trip was saved, but the AI draft didn't come through. Try creating a new trip,
              or check that your Groq API key is set.
            </p>
          </GlassCard>
        </div>
      ) : (
        <div className="mt-8">
          <AnimatePresence mode="wait">
            {mainView === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <TripOverview
                  trip={trip}
                  days={days}
                  expenses={expenses}
                  packingItems={packingItems}
                  onViewItinerary={() => setMainView('itinerary')}
                  onViewPacking={() => setMainView('packing')}
                  onViewBudget={() => setMainView('budget')}
                />
              </motion.div>
            )}

            {mainView === 'itinerary' && (
              <motion.div
                key="itinerary"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-6"
              >
                {/* Boarding-pass rail: each day is a ticket, scrolled horizontally */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="eyebrow">
                      <span className="eyebrow-dot" /> Your journey
                    </span>
                    <span className="hidden text-[0.72rem] text-mist-500 sm:inline">
                      Scroll to browse your days →
                    </span>
                  </div>
                  <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 [scrollbar-width:thin]">
                    {days.map((day) => (
                      <BoardingPassDay
                        key={day.id}
                        day={day}
                        currency={trip.currency}
                        destination={trip.destination}
                        regenerating={regeneratingDayId === day.id}
                        onRegenerate={() => handleRegenerateDay(day.id)}
                        onAddStop={() => openAddStop(day.id)}
                        onEditStop={(stop) => openEditStop(day.id, stop)}
                        onDeleteStop={(stopId) => handleDeleteStop(day.id, stopId)}
                      />
                    ))}
                  </div>
                </div>

                {/* Map, anchored to the selected day */}
                <GlassCard innerClassName="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="eyebrow">
                      <MapTrifold size={11} weight="light" /> Route map
                    </span>
                    {/* Day selector for the map */}
                    <div className="flex gap-1 overflow-x-auto rounded-full border border-hairline bg-ink-900 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {days.map((day) => (
                        <button
                          key={day.id}
                          onClick={() => setActiveDayId(day.id)}
                          className={`relative shrink-0 rounded-full px-3 py-1.5 text-[0.74rem] transition-colors duration-300 ${
                            (activeDay?.id ?? days[0]?.id) === day.id
                              ? 'text-mist-50'
                              : 'text-mist-400 hover:text-mist-200'
                          }`}
                        >
                          {(activeDay?.id ?? days[0]?.id) === day.id && (
                            <motion.span
                              layoutId="map-day-pill"
                              className="absolute inset-0 rounded-full bg-ink-600"
                              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            />
                          )}
                          <span className="relative">Day {day.day_number}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-[380px] sm:h-[460px]">
                    <DayMap stops={activeDay?.stops ?? []} />
                  </div>

                  {/* One calm framing line for the whole map — sets the
                      expectation that this is an overview and Google is a tap
                      away, so we never need to repeat it per stop. */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                    <p className="flex items-center gap-1.5 text-[0.76rem] text-mist-400">
                      <MapPin size={13} weight="light" className="text-gold-400" />
                      Your journey at a glance — open any stop in Maps for exact directions.
                    </p>
                    {(() => {
                      const dayStops = activeDay?.stops ?? []
                      const unpinned = dayStops.filter((s) => s.geocode_status === 'unresolved')
                      if (unpinned.length === 0) return null
                      const dirUrl = mapsDirectionsUrl(unpinned, trip.destination)
                      if (!dirUrl) return null
                      return (
                        <a
                          href={dirUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[0.76rem] text-mist-300 underline decoration-hairline-strong underline-offset-[3px] transition-colors duration-300 hover:text-gold-400 hover:decoration-gold-500"
                        >
                          {unpinned.length} stop{unpinned.length === 1 ? '' : 's'} not shown here — open in Maps
                        </a>
                      )
                    })()}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {mainView === 'budget' && (
              <motion.div
                key="budget"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto max-w-3xl"
              >
                <GlassCard innerClassName="p-6 sm:p-8">
                  <BudgetTracker
                    tripId={trip.id}
                    budget={trip.budget}
                    currency={trip.currency}
                    stops={allStops}
                    expenses={expenses}
                    onExpenseAdded={(expense) => setExpenses((prev) => [expense, ...prev])}
                    onExpenseDeleted={(id) => setExpenses((prev) => prev.filter((e) => e.id !== id))}
                  />
                </GlassCard>
              </motion.div>
            )}

            {mainView === 'notes' && (
              <motion.div
                key="notes"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto max-w-3xl"
              >
                <GlassCard innerClassName="p-6 sm:p-8">
                  <NotesPanel
                    tripId={trip.id}
                    dayId={null}
                    notes={notes}
                    onNoteChanged={(note) =>
                      setNotes((prev) => {
                        const exists = prev.some((n) => n.id === note.id)
                        return exists ? prev.map((n) => (n.id === note.id ? note : n)) : [...prev, note]
                      })
                    }
                  />
                </GlassCard>
              </motion.div>
            )}

            {mainView === 'packing' && (
              <motion.div
                key="packing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto max-w-3xl"
              >
                <GlassCard innerClassName="p-6 sm:p-8">
                  <PackingList
                    tripId={trip.id}
                    items={packingItems}
                    onItemAdded={(item) => setPackingItems((prev) => [...prev, item])}
                    onItemToggled={(item) =>
                      setPackingItems((prev) => prev.map((i) => (i.id === item.id ? item : i)))
                    }
                    onItemDeleted={(id) => setPackingItems((prev) => prev.filter((i) => i.id !== id))}
                  />
                </GlassCard>
              </motion.div>
            )}

            {mainView === 'comments' && (
              <motion.div
                key="comments"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto max-w-3xl"
              >
                <GlassCard innerClassName="p-6 sm:p-8">
                  <CommentsPanel
                    tripId={trip.id}
                    comments={comments}
                    onCommentAdded={(comment) => setComments((prev) => [...prev, comment])}
                    onCommentDeleted={(id) => setComments((prev) => prev.filter((c) => c.id !== id))}
                  />
                </GlassCard>
              </motion.div>
            )}

            {mainView === 'assistant' && (
              <motion.div
                key="assistant"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto max-w-3xl"
              >
                <GlassCard innerClassName="p-5 sm:p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="eyebrow">
                      <Sparkle size={11} weight="light" /> Travel companion
                    </span>
                  </div>
                  <TripAssistantPanel trip={trip} days={days} onChangeApplied={reloadDaysAndTrip} />
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <StopEditor
        open={editorOpen}
        saving={savingStop}
        currency={trip.currency}
        initial={
          editorStop
            ? {
                name: editorStop.name,
                type: editorStop.type,
                start_time: editorStop.start_time ?? '',
                est_cost: editorStop.est_cost?.toString() ?? '',
                notes: editorStop.notes ?? '',
              }
            : undefined
        }
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveStop}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this trip?"
        description={`This permanently removes "${trip.destination}" and everything in it — itinerary, budget, notes. This can't be undone.`}
        confirmLabel="Delete trip"
        loading={deleting}
        onConfirm={handleDeleteTrip}
        onCancel={() => setDeleteOpen(false)}
      />

      <ConfirmDialog
        open={regenerateOpen}
        title="Regenerate the whole itinerary?"
        description={
          regenerateError ??
          'This replaces every day and stop with a brand new AI draft. Any manual edits you\'ve made will be lost. Notes, budget, and packing list are not affected.'
        }
        confirmLabel="Regenerate"
        loading={regenerating}
        onConfirm={handleRegenerateItinerary}
        onCancel={() => {
          setRegenerateOpen(false)
          setRegenerateError(null)
        }}
      />

      <TripDetailsEditor
        open={detailsEditorOpen}
        trip={trip}
        saving={savingDetails}
        onClose={() => setDetailsEditorOpen(false)}
        onSave={handleSaveTripDetails}
      />
    </div>
  )
}
