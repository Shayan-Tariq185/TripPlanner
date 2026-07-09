import type { TravelStyle, Currency } from './types'

// Groq's API is OpenAI-compatible — same request/response shape as chat completions.
// Llama 3.3 70B is a strong free-tier default for structured JSON generation.
const GROQ_MODEL = 'llama-3.3-70b-versatile'
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

export interface GeneratedStop {
  time: string
  type: 'hotel' | 'restaurant' | 'attraction' | 'transport'
  name: string
  est_cost: number
  notes: string
}

export interface GeneratedDay {
  day_number: number
  stops: GeneratedStop[]
}

export interface GeneratedItinerary {
  days: GeneratedDay[]
  /** Set only when the AI judged the requested trip length to be a poor fit
   * for the destination (e.g. 5 days for a single landmark) and expanded
   * scope to the surrounding area to fill the days meaningfully. Shown to
   * the user transparently rather than silently overriding what they typed. */
  scopeNote: string | null
}

const STYLE_GUIDANCE: Record<TravelStyle, string> = {
  relaxed: 'Keep the pace relaxed — 3 to 4 stops per day at most, with generous downtime and no early mornings.',
  packed: 'Pack the days full — 6 to 8 stops per day, minimizing downtime, starting early and ending late.',
  budget: 'Prioritize free or low-cost activities, budget-friendly food, and public transport. Call out approximate costs carefully.',
  luxury: 'Prioritize comfort and quality — well-reviewed restaurants, notable attractions, private or premium transport where relevant.',
}

const CURRENCY_GUIDANCE: Record<Currency, string> = {
  PKR: 'Give every cost estimate in Pakistani Rupees (PKR), using realistic real-world PKR prices — not a dollar figure relabeled. For reference, a modest local meal is roughly 400-1200 PKR, a mid-range hotel night is roughly 8,000-25,000 PKR, and a museum or attraction entry is typically 200-2,000 PKR. Scale up appropriately for luxury travel style, down for budget style.',
  USD: 'Give every cost estimate in US Dollars (USD), using realistic real-world prices for the destination.',
}

class GroqError extends Error {}

function buildPrompt(
  destination: string,
  numDays: number,
  budget: number,
  currency: Currency,
  style: TravelStyle
) {
  return `You are a travel itinerary planner. Generate a ${numDays}-day itinerary for a trip to ${destination}.

Total trip budget: ${budget} ${currency}.
${CURRENCY_GUIDANCE[currency]}
Travel style: ${style}. ${STYLE_GUIDANCE[style]}

For each day, provide 3-8 stops (fewer for relaxed, more for packed). Each stop must be one of these types: hotel, restaurant, attraction, transport.

For every "name" field, include enough location context to be geocoded unambiguously — format as "Specific Place Name, Neighborhood/District, ${destination}". For example: "Hagia Sophia, Sultanahmet, Istanbul" rather than just "Hagia Sophia".

Keep estimated costs realistic and roughly consistent with the total trip budget across all days.

Before planning, judge whether "${destination}" as given actually supports ${numDays} days of distinct activity. If the destination is a single landmark, building, or narrowly-scoped attraction (e.g. just "Faisal Mosque" or "Eiffel Tower") and ${numDays} is more than 1-2 days, expand your planning scope to the surrounding city or area so each day has genuinely different things to do — using the original destination as the anchor or highlight of day 1. If you do this, explain it in one short sentence in "scope_note". If the destination is already a reasonably-scoped city, region, or area for ${numDays} days, leave "scope_note" as null.

Respond with ONLY valid JSON, no markdown code fences, no prose, no explanation. Match this exact schema:

{
  "scope_note": null,
  "days": [
    {
      "day_number": 1,
      "stops": [
        {
          "time": "09:00",
          "type": "attraction",
          "name": "Specific Place, District, ${destination}",
          "est_cost": ${currency === 'PKR' ? 800 : 15},
          "notes": "Short practical tip, one sentence."
        }
      ]
    }
  ]
}`
}

function stripCodeFences(text: string): string {
  return text.replace(/```json\s*|```\s*/g, '').trim()
}

function isValidStop(value: unknown): value is GeneratedStop {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  return (
    typeof s.time === 'string' &&
    typeof s.name === 'string' &&
    typeof s.type === 'string' &&
    ['hotel', 'restaurant', 'attraction', 'transport'].includes(s.type) &&
    (typeof s.est_cost === 'number' || s.est_cost === undefined) &&
    (typeof s.notes === 'string' || s.notes === undefined)
  )
}

function validateItinerary(parsed: unknown): GeneratedItinerary {
  if (typeof parsed !== 'object' || parsed === null || !('days' in parsed)) {
    throw new GroqError('Response was missing a "days" array.')
  }
  const days = (parsed as { days: unknown }).days
  if (!Array.isArray(days) || days.length === 0) {
    throw new GroqError('Response contained no days.')
  }

  const validatedDays: GeneratedDay[] = days.map((day, i) => {
    if (typeof day !== 'object' || day === null) {
      throw new GroqError(`Day ${i + 1} was malformed.`)
    }
    const d = day as Record<string, unknown>
    const stops = Array.isArray(d.stops) ? d.stops.filter(isValidStop) : []
    return {
      day_number: typeof d.day_number === 'number' ? d.day_number : i + 1,
      stops: stops.map((s) => ({
        time: s.time,
        type: s.type,
        name: s.name,
        est_cost: typeof s.est_cost === 'number' ? s.est_cost : 0,
        notes: s.notes ?? '',
      })),
    }
  })

  const scopeNoteRaw = (parsed as Record<string, unknown>).scope_note

  return {
    days: validatedDays,
    scopeNote: typeof scopeNoteRaw === 'string' ? scopeNoteRaw : null,
  }
}

/**
 * Calls the Groq API (Llama 3.3 70B) to generate a structured itinerary.
 * Throws GroqError with a message safe to show the user if generation or
 * parsing fails — callers should catch this and let the user retry rather
 * than silently failing.
 */
export async function generateItinerary(
  destination: string,
  numDays: number,
  budget: number,
  currency: Currency,
  style: TravelStyle
): Promise<GeneratedItinerary> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) {
    throw new GroqError(
      'Groq API key is not configured. Add VITE_GROQ_API_KEY to your .env file.'
    )
  }

  const prompt = buildPrompt(destination, numDays, budget, currency, style)

  let response: Response
  try {
    response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    })
  } catch {
    throw new GroqError('Could not reach the itinerary service. Check your connection and try again.')
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new GroqError('Too many requests right now — wait a moment and try again.')
    }
    const errBody = await response.text().catch(() => '')
    throw new GroqError(`The itinerary service returned an error. ${errBody.slice(0, 200)}`)
  }

  const data = await response.json()
  const text: string | undefined = data?.choices?.[0]?.message?.content

  if (!text) {
    throw new GroqError('The itinerary service returned an empty response. Try again.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(stripCodeFences(text))
  } catch {
    throw new GroqError('Could not read the generated itinerary. Try again.')
  }

  return validateItinerary(parsed)
}

export { GroqError }
