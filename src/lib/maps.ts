import type { Stop } from './types'

/**
 * Builds a Google Maps *search* URL for a single place. This is just a link —
 * it opens Google Maps (app or web) with the query pre-filled, using Google's
 * own place database, which is far more complete than our geocoder. No API
 * key, no cost. We append the destination so ambiguous names ("Mashabrum
 * Hotel") resolve to the right city.
 */
export function mapsSearchUrl(placeName: string, destination?: string): string {
  const parts = [placeName]
  // Only add the destination if the name doesn't already include it.
  if (destination) {
    const city = destination.split(',')[0].trim().toLowerCase()
    if (!placeName.toLowerCase().includes(city)) parts.push(destination)
  }
  const query = encodeURIComponent(parts.join(', '))
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}

/**
 * Builds a Google Maps *directions* URL that strings a day's stops together as
 * an ordered route (origin → waypoints → destination). Google plots the whole
 * day for real navigation. Falls back to a plain search when there's only one
 * stop. Skips empty names defensively.
 */
export function mapsDirectionsUrl(stops: Stop[], destination?: string): string | null {
  const named = stops.map((s) => s.name).filter((n) => n && n.trim().length > 0)
  if (named.length === 0) return null
  if (named.length === 1) return mapsSearchUrl(named[0], destination)

  const withCtx = (name: string) => {
    if (!destination) return name
    const city = destination.split(',')[0].trim().toLowerCase()
    return name.toLowerCase().includes(city) ? name : `${name}, ${destination}`
  }

  const origin = encodeURIComponent(withCtx(named[0]))
  const dest = encodeURIComponent(withCtx(named[named.length - 1]))
  const waypoints = named
    .slice(1, -1)
    .map((n) => encodeURIComponent(withCtx(n)))
    .join('|')

  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`
  if (waypoints) url += `&waypoints=${waypoints}`
  return url
}
