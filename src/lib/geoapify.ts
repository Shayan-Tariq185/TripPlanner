const GEOAPIFY_GEOCODE_ENDPOINT = 'https://api.geoapify.com/v1/geocode/search'
const GEOAPIFY_ROUTING_ENDPOINT = 'https://api.geoapify.com/v1/routing'

export interface GeocodeResult {
  lat: number
  lng: number
  confidence: number
}

/**
 * Resolves a free-text location string to coordinates via Geoapify. Returns
 * null only when we truly can't place it. Callers should treat null as
 * "unresolved" rather than throwing — one bad geocode should never block the
 * rest of an itinerary from rendering.
 *
 * `context` (e.g. "Islamabad, Pakistan") is appended when the query doesn't
 * already contain it, which dramatically improves hit-rate: the model often
 * returns bare names like "Monal Restaurant" or "Faisal Mosque" that are
 * ambiguous worldwide but unambiguous once the city/country is attached.
 */
export async function geocodeLocation(query: string, context?: string): Promise<GeocodeResult | null> {
  const apiKey = import.meta.env.VITE_GEOAPIFY_KEY
  if (!apiKey) {
    console.warn('[geoapify] VITE_GEOAPIFY_KEY is not set — skipping geocoding.')
    return null
  }

  // Build an ordered list of query variants to try, most specific first.
  const trimmed = query.trim()
  const variants: string[] = []
  if (context && !trimmed.toLowerCase().includes(context.split(',')[0].trim().toLowerCase())) {
    variants.push(`${trimmed}, ${context}`)
  }
  variants.push(trimmed)
  // As a last resort, drop everything after the first comma (the bare name)
  // and re-attach context — handles over-specified names the geocoder chokes on.
  const bareName = trimmed.split(',')[0].trim()
  if (bareName !== trimmed) {
    variants.push(context ? `${bareName}, ${context}` : bareName)
  }

  for (const variant of variants) {
    const result = await runGeocode(variant, apiKey)
    if (result) return result
  }
  return null
}

async function runGeocode(text: string, apiKey: string): Promise<GeocodeResult | null> {
  const url = `${GEOAPIFY_GEOCODE_ENDPOINT}?text=${encodeURIComponent(text)}&limit=1&apiKey=${apiKey}`

  let response: Response
  try {
    response = await fetch(url)
  } catch {
    return null
  }

  if (!response.ok) return null

  const data = await response.json()
  const feature = data?.features?.[0]

  if (!feature) return null

  const [lng, lat] = feature.geometry?.coordinates ?? []
  const confidence = feature.properties?.rank?.confidence ?? 0

  if (typeof lat !== 'number' || typeof lng !== 'number') return null

  return { lat, lng, confidence }
}

/**
 * Geocodes a batch of location strings sequentially (Geoapify's free tier
 * has a rate limit; sequential requests with a small delay avoid tripping it
 * for a typical 3-8-stop-per-day itinerary). Pass `context` (the trip's
 * destination) so bare place names resolve reliably.
 */
export async function geocodeBatch(queries: string[], context?: string): Promise<(GeocodeResult | null)[]> {
  const results: (GeocodeResult | null)[] = []
  for (const query of queries) {
    results.push(await geocodeLocation(query, context))
    await new Promise((resolve) => setTimeout(resolve, 120))
  }
  return results
}

export type RouteMode = 'walk' | 'drive' | 'bicycle'

/**
 * Fetches a real routed path (following actual streets/paths) between an
 * ordered sequence of coordinates via Geoapify's Routing API. Returns an
 * array of [lat, lng] points tracing the route, or null if routing fails —
 * callers should fall back to a straight line between points on null rather
 * than breaking the map.
 */
export async function getRoute(
  points: { lat: number; lng: number }[],
  mode: RouteMode = 'walk'
): Promise<[number, number][] | null> {
  const apiKey = import.meta.env.VITE_GEOAPIFY_KEY
  if (!apiKey || points.length < 2) return null

  const waypoints = points.map((p) => `${p.lat},${p.lng}`).join('|')
  const url = `${GEOAPIFY_ROUTING_ENDPOINT}?waypoints=${encodeURIComponent(waypoints)}&mode=${mode}&apiKey=${apiKey}`

  let response: Response
  try {
    response = await fetch(url)
  } catch {
    return null
  }

  if (!response.ok) return null

  const data = await response.json()
  const feature = data?.features?.[0]
  const geometry = feature?.geometry

  if (!geometry) return null

  // Routing responses can be LineString (single coordinate array) or
  // MultiLineString (array of arrays, one per leg) — normalize both to a
  // flat list of [lat, lng] points in order.
  const rawCoords: [number, number][] =
    geometry.type === 'MultiLineString'
      ? geometry.coordinates.flat()
      : geometry.type === 'LineString'
        ? geometry.coordinates
        : []

  if (rawCoords.length === 0) return null

  // Geoapify returns [lng, lat] pairs (GeoJSON order) — flip to [lat, lng] for Leaflet.
  return rawCoords.map(([lng, lat]: [number, number]) => [lat, lng])
}
