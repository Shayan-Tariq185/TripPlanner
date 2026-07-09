import { supabase } from './supabase'
import { generateItinerary, GroqError, type GeneratedDay } from './groq'
import { geocodeBatch } from './geoapify'
import type { Trip, GeocodeStatus } from './types'

function dateRangeDays(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, diff + 1)
}

function addDays(dateStr: string, offset: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

export class ItineraryGenerationError extends Error {}

/**
 * Geocodes and writes a set of generated days + their stops to Supabase.
 * Shared by full-itinerary generation and single-day regeneration so both
 * paths geocode and insert stops identically rather than duplicating logic.
 */
async function writeDaysToSupabase(
  tripId: string,
  startDate: string,
  days: GeneratedDay[],
  destination: string,
): Promise<void> {
  const allStopNames = days.flatMap((day) => day.stops.map((s) => s.name))
  const geocodeResults = await geocodeBatch(allStopNames, destination)
  let geocodeCursor = 0

  for (const day of days) {
    const { data: dayRow, error: dayError } = await supabase
      .from('days')
      .insert({
        trip_id: tripId,
        day_number: day.day_number,
        date: addDays(startDate, day.day_number - 1),
      })
      .select()
      .single()

    if (dayError || !dayRow) {
      throw new ItineraryGenerationError('Could not save the itinerary. Try again.')
    }

    const stopRows = day.stops.map((stop, index) => {
      const geo = geocodeResults[geocodeCursor]
      geocodeCursor += 1

      // Single source of truth: a stop is 'resolved' iff we actually have
      // coordinates to plot. We no longer gate on a confidence score, which
      // previously marked stops 'unresolved' even though they had valid coords
      // and were being drawn on the map — the contradiction users noticed.
      const geocode_status: GeocodeStatus = geo ? 'resolved' : 'unresolved'

      return {
        day_id: dayRow.id,
        order_index: index,
        type: stop.type,
        name: stop.name,
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
        start_time: stop.time,
        est_cost: stop.est_cost,
        notes: stop.notes,
        geocode_status,
      }
    })

    if (stopRows.length > 0) {
      const { error: stopsError } = await supabase.from('stops').insert(stopRows)
      if (stopsError) {
        throw new ItineraryGenerationError('Could not save some stops. Try again.')
      }
    }
  }
}

/**
 * Generates a full itinerary for a brand new trip: calls Groq for the
 * day-by-day plan, geocodes every stop via Geoapify, writes days + stops to
 * Supabase, and saves the AI's scope_note (if any) onto the trip itself.
 * Designed to be called right after a trip row is created.
 */
export async function generateAndSaveItinerary(trip: Trip): Promise<void> {
  const numDays = dateRangeDays(trip.start_date, trip.end_date)

  let itinerary
  try {
    itinerary = await generateItinerary(trip.destination, numDays, trip.budget, trip.currency, trip.travel_style)
  } catch (err) {
    if (err instanceof GroqError) {
      throw new ItineraryGenerationError(err.message)
    }
    throw new ItineraryGenerationError('Could not generate the itinerary. Try again.')
  }

  if (itinerary.days.length === 0) {
    throw new ItineraryGenerationError('The itinerary came back empty. Try again.')
  }

  await writeDaysToSupabase(trip.id, trip.start_date, itinerary.days, trip.destination)

  if (itinerary.scopeNote) {
    await supabase.from('trips').update({ scope_note: itinerary.scopeNote }).eq('id', trip.id)
  }
}

/**
 * Regenerates the entire itinerary for an existing trip: deletes all current
 * days (stops cascade-delete with them, per schema.sql's foreign keys), then
 * generates and writes a fresh set. Used when a user isn't happy with the
 * AI's first draft and wants a genuinely new attempt rather than editing
 * stops by hand.
 */
export async function regenerateItinerary(trip: Trip): Promise<void> {
  const numDays = dateRangeDays(trip.start_date, trip.end_date)

  let itinerary
  try {
    itinerary = await generateItinerary(trip.destination, numDays, trip.budget, trip.currency, trip.travel_style)
  } catch (err) {
    if (err instanceof GroqError) {
      throw new ItineraryGenerationError(err.message)
    }
    throw new ItineraryGenerationError('Could not generate the itinerary. Try again.')
  }

  if (itinerary.days.length === 0) {
    throw new ItineraryGenerationError('The itinerary came back empty. Try again.')
  }

  const { error: deleteError } = await supabase.from('days').delete().eq('trip_id', trip.id)
  if (deleteError) {
    throw new ItineraryGenerationError('Could not clear the old itinerary. Try again.')
  }

  await writeDaysToSupabase(trip.id, trip.start_date, itinerary.days, trip.destination)

  await supabase.from('trips').update({ scope_note: itinerary.scopeNote ?? null }).eq('id', trip.id)
}

/**
 * Regenerates a single day of an existing trip's itinerary — a cheaper,
 * faster alternative to a full regenerate when only one day feels off.
 * Asks Groq for a full new itinerary (a 1-day request) using that day's
 * actual calendar date as context, then replaces just that one day's stops.
 */
export async function regenerateSingleDay(trip: Trip, dayId: string): Promise<void> {
  let itinerary
  try {
    itinerary = await generateItinerary(trip.destination, 1, trip.budget, trip.currency, trip.travel_style)
  } catch (err) {
    if (err instanceof GroqError) {
      throw new ItineraryGenerationError(err.message)
    }
    throw new ItineraryGenerationError('Could not generate a new plan for this day. Try again.')
  }

  const newDay = itinerary.days[0]
  if (!newDay || newDay.stops.length === 0) {
    throw new ItineraryGenerationError('The new plan came back empty. Try again.')
  }

  const { error: deleteError } = await supabase.from('stops').delete().eq('day_id', dayId)
  if (deleteError) {
    throw new ItineraryGenerationError('Could not clear the old stops for this day. Try again.')
  }

  const allStopNames = newDay.stops.map((s) => s.name)
  const geocodeResults = await geocodeBatch(allStopNames, trip.destination)

  const stopRows = newDay.stops.map((stop, index) => {
    const geo = geocodeResults[index]
    const geocode_status: GeocodeStatus = geo ? 'resolved' : 'unresolved'

    return {
      day_id: dayId,
      order_index: index,
      type: stop.type,
      name: stop.name,
      lat: geo?.lat ?? null,
      lng: geo?.lng ?? null,
      start_time: stop.time,
      est_cost: stop.est_cost,
      notes: stop.notes,
      geocode_status,
    }
  })

  const { error: stopsError } = await supabase.from('stops').insert(stopRows)
  if (stopsError) {
    throw new ItineraryGenerationError('Could not save the new stops. Try again.')
  }
}

/**
 * Silently attempts to place any stops that are missing coordinates, using the
 * trip's destination as geocoding context. Runs in the background when a trip
 * is opened so older trips (saved before geocoding was improved) heal
 * themselves without a migration or a user-facing button. Only touches stops
 * that currently have no lat/lng, and only writes the ones it successfully
 * resolves — it never downgrades an already-placed stop. Returns the number of
 * stops it managed to fix, so the caller can refresh if anything changed.
 */
export async function healUnplacedStops(
  destination: string,
  stops: { id: string; name: string; lat: number | null; lng: number | null }[],
): Promise<number> {
  const unplaced = stops.filter((s) => s.lat === null || s.lng === null)
  if (unplaced.length === 0) return 0

  const results = await geocodeBatch(
    unplaced.map((s) => s.name),
    destination,
  )

  let fixed = 0
  await Promise.all(
    unplaced.map(async (stop, i) => {
      const geo = results[i]
      if (!geo) return
      const { error } = await supabase
        .from('stops')
        .update({ lat: geo.lat, lng: geo.lng, geocode_status: 'resolved' })
        .eq('id', stop.id)
      if (!error) fixed += 1
    }),
  )

  return fixed
}
