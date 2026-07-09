/**
 * Lightweight client-side daily rate limiting via localStorage. Not a real
 * security boundary (a user could clear localStorage or use another
 * browser) — it's a safety net against accidental repeated clicks or
 * over-enthusiastic testing burning through free-tier Groq/Geoapify/Pexels
 * quota, not protection against a determined bad actor. A proper per-user
 * server-side limit would need a backend function, out of scope for now.
 */

function dailyKey(namespace: string, id: string): string {
  const today = new Date().toISOString().slice(0, 10)
  return `voyageflow:ratelimit:${namespace}:${id}:${today}`
}

export function getDailyCount(namespace: string, id: string): number {
  return Number(localStorage.getItem(dailyKey(namespace, id)) ?? '0')
}

export function incrementDailyCount(namespace: string, id: string): number {
  const next = getDailyCount(namespace, id) + 1
  localStorage.setItem(dailyKey(namespace, id), String(next))
  return next
}

export const RATE_LIMITS = {
  /** Itinerary generation (initial create + full regenerate) — the most
   * expensive operation (Groq + a full batch of Geoapify geocoding calls). */
  itineraryGeneration: 8,
  /** Single-day regeneration — cheaper than a full itinerary, allow more. */
  dayRegeneration: 15,
  /** Assistant chat messages — matches the cap already enforced in
   * TripAssistantPanel; exported here so all AI-related limits live in one place. */
  assistantMessages: 30,
} as const
