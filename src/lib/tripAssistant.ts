import type { Currency, Stop, Day } from './types'

const GROQ_MODEL = 'llama-3.3-70b-versatile'
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

export type AssistantActionType =
  | 'move_time'
  | 'change_cost'
  | 'add_stop'
  | 'remove_stop'
  | 'reorder_stop'
  | 'regenerate_day'
  | 'add_note'
  | 'add_packing_item'
  | 'answer'
  | 'recommend'
  | 'clarify'
  | 'decline'

/** A single place suggestion the assistant can surface in an `answer` or
 * `recommend` reply. `suggested_type`/`suggested_day_number` let the UI offer
 * a one-tap "Add to trip" that pre-fills an add_stop without another round trip. */
export interface AssistantSuggestion {
  name: string
  reason: string
  suggested_type?: Stop['type']
  suggested_day_number?: number
}

export interface AssistantAction {
  type: AssistantActionType
  summary: string
  stop_id?: string
  day_id?: string
  day_number?: number
  new_time?: string
  new_cost?: number
  new_stop_name?: string
  new_stop_type?: Stop['type']
  new_position?: number
  note_content?: string
  note_day_id?: string | null
  packing_item_label?: string
  /** For `answer`/`recommend`: the conversational reply shown to the user. */
  message?: string
  /** For `answer`/`recommend`: optional place cards the user can add in one tap. */
  suggestions?: AssistantSuggestion[]
  clarify_question?: string
  decline_reason?: string
}

export interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
}

class AssistantError extends Error {}

interface TripContext {
  destination: string
  currency: Currency
  days: (Day & { stops: Stop[] })[]
}

function buildSystemPrompt(context: TripContext): string {
  const dayLines = context.days
    .map((day) => {
      const stopLines = day.stops
        .map(
          (s) =>
            `    - id="${s.id}" [${s.type}] "${s.name}" at ${s.start_time ?? 'no time set'}, cost ${s.est_cost ?? 0} ${context.currency}`
        )
        .join('\n')
      return `  Day ${day.day_number} (id="${day.id}"):\n${stopLines || '    (no stops)'}`
    })
    .join('\n')

  return `You are VoyageFlow's AI Travel Companion — a warm, knowledgeable local guide and planning partner for the traveller's trip to ${context.destination}. Currency is ${context.currency}. Think of yourself as a well-travelled friend who knows this place: you give real, specific, useful guidance, and you help shape the plan. You are proactive — you notice gaps and offer ideas — but never pushy.

Current itinerary:
${dayLines}

YOUR STYLE
- Warm, concise, and genuinely helpful. Sound like a person, not a brochure. Use the traveller's own words back to them.
- Be SPECIFIC to ${context.destination}: name real neighbourhoods, dishes, timings, travel tips. Vague advice ("visit local markets") is a failure; concrete advice ("the Saturday market in X for dried apricots and rubies") is the goal.
- Everything you suggest is an IDEA to consider, not a directive. Naturally frame things as "you could…", "if you like…", "one option is…". Prices are always rough estimates — say so lightly when money comes up (e.g. "around Rs 1,500, though it varies").
- Never invent a place you're not reasonably sure exists. Better to speak generally than fabricate a specific name.
- When it helps, look at their actual itinerary above and react to it: notice a day with no dinner, a big gap between stops, an over-packed afternoon, a missing hotel — and gently offer to help.

WHAT YOU CAN DO — pick the ONE response type that best fits:

Conversational (no change to the trip):
- answer: The traveller asked something or is chatting. Reply in "message" (2–5 sentences, specific and warm). If you mention places they could add, ALSO put them in "suggestions" so they're one tap away. Good for "what's the food like?", "is 3 days enough?", "how do I get around?", "help me plan day 2".
- recommend: They want ideas/options. Give a short framing line in "message" and 2–5 real places in "suggestions", each with a one-line "reason", a "suggested_type", and "suggested_day_number" when it fits a specific day.

When the traveller asks you to PLAN or STRUCTURE something (e.g. "help me plan my days", "what should a good day 2 look like?"), use "answer": lay out your suggested shape in the "message" (a short morning→evening flow in prose), and put the concrete stops in "suggestions" so they can add them one by one. Make clear it's a starting idea they can adjust.

Itinerary edits (proposed as a card; applied only after the traveller taps Approve):
- move_time, change_cost, add_stop, remove_stop, reorder_stop, regenerate_day, add_note, add_packing_item.
- For edits, reference a REAL stop_id / day_id from the itinerary above — never invent one.

Fallbacks:
- clarify: ONLY when a request is clearly an edit but you can't tell which stop/day. Put a specific question in "clarify_question". Never use clarify for a normal question — answer it.
- decline: When it needs something outside your reach (change the budget total, delete the whole trip, change currency). Brief friendly "decline_reason" pointing to the right tab.

RULES
- Default to being helpful and conversational. A question is almost always "answer".
- "summary" is REQUIRED: a short 3–6 word gist.
- Keep prices realistic for ${context.destination} in ${context.currency}, and treat them as estimates.

Respond with ONLY valid JSON, no markdown fences, no prose outside the JSON. Examples:

Question →
{"type":"answer","summary":"Skardu food guide","message":"Skardu's food leans hearty and warming — think apricot-based dishes, momos, and fresh trout from the lakes. For a proper local meal you could try a Balti restaurant in the main bazaar; expect around Rs 800–1,500 a head, though it varies. Want me to add a good dinner spot to one of your days?","suggestions":[{"name":"Dewanekhas Restaurant, Skardu Bazaar","reason":"Local Balti dishes and fresh trout","suggested_type":"restaurant"}]}

Planning →
{"type":"answer","summary":"A shape for Day 2","message":"Here's one way Day 2 could flow, if you like: an easy morning at Shangrila (Lower Kachura Lake), lunch nearby, then the drive out to Deosai in the afternoon when the light's best. It's just a starting idea — you can shuffle any of it. Want me to add these?","suggestions":[{"name":"Shangrila Resort, Lower Kachura Lake","reason":"Calm morning by the lake","suggested_type":"attraction","suggested_day_number":2},{"name":"Deosai National Park","reason":"Golden-hour drive and views","suggested_type":"attraction","suggested_day_number":2}]}

Edit →
{"type":"move_time","summary":"Move dinner to 6:30 PM","stop_id":"the-real-stop-id","new_time":"18:30"}`
}

function stripCodeFences(text: string): string {
  return text.replace(/```json\s*|```\s*/g, '').trim()
}

function isValidActionType(value: unknown): value is AssistantActionType {
  return (
    typeof value === 'string' &&
    [
      'move_time',
      'change_cost',
      'add_stop',
      'remove_stop',
      'reorder_stop',
      'regenerate_day',
      'add_note',
      'add_packing_item',
      'answer',
      'recommend',
      'clarify',
      'decline',
    ].includes(value)
  )
}

function parseSuggestions(value: unknown): AssistantSuggestion[] | undefined {
  if (!Array.isArray(value)) return undefined
  const cleaned = value
    .filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null && typeof (v as Record<string, unknown>).name === 'string')
    .map((v) => ({
      name: v.name as string,
      reason: typeof v.reason === 'string' ? v.reason : '',
      suggested_type: typeof v.suggested_type === 'string' ? (v.suggested_type as Stop['type']) : undefined,
      suggested_day_number: typeof v.suggested_day_number === 'number' ? v.suggested_day_number : undefined,
    }))
  return cleaned.length > 0 ? cleaned : undefined
}

function parseAction(parsed: unknown): AssistantAction {
  if (typeof parsed !== 'object' || parsed === null) {
    throw new AssistantError('Could not understand the response.')
  }
  const p = parsed as Record<string, unknown>

  if (!isValidActionType(p.type)) {
    throw new AssistantError('Response had an unrecognized action type.')
  }

  const message = typeof p.message === 'string' ? p.message : undefined
  const clarifyQuestion = typeof p.clarify_question === 'string' ? p.clarify_question : undefined
  const declineReason = typeof p.decline_reason === 'string' ? p.decline_reason : undefined

  // A summary is nice-to-have, not a hard requirement — for conversational
  // replies the message/question itself carries the meaning, so fall back to
  // that rather than failing the whole response when the model omits summary.
  const summary =
    typeof p.summary === 'string' && p.summary
      ? p.summary
      : message ?? clarifyQuestion ?? declineReason ?? 'Response'

  return {
    type: p.type,
    summary,
    message,
    suggestions: parseSuggestions(p.suggestions),
    stop_id: typeof p.stop_id === 'string' ? p.stop_id : undefined,
    day_id: typeof p.day_id === 'string' ? p.day_id : undefined,
    day_number: typeof p.day_number === 'number' ? p.day_number : undefined,
    new_time: typeof p.new_time === 'string' ? p.new_time : undefined,
    new_cost: typeof p.new_cost === 'number' ? p.new_cost : undefined,
    new_stop_name: typeof p.new_stop_name === 'string' ? p.new_stop_name : undefined,
    new_stop_type: typeof p.new_stop_type === 'string' ? (p.new_stop_type as Stop['type']) : undefined,
    new_position: typeof p.new_position === 'number' ? p.new_position : undefined,
    note_content: typeof p.note_content === 'string' ? p.note_content : undefined,
    note_day_id: typeof p.note_day_id === 'string' ? p.note_day_id : p.note_day_id === null ? null : undefined,
    packing_item_label: typeof p.packing_item_label === 'string' ? p.packing_item_label : undefined,
    clarify_question: typeof p.clarify_question === 'string' ? p.clarify_question : undefined,
    decline_reason: typeof p.decline_reason === 'string' ? p.decline_reason : undefined,
  }
}

/**
 * Sends a user message + trip context to Groq and gets back one structured
 * proposed action (or a clarify/decline). Never writes to the database —
 * callers are responsible for showing the proposal to the user and only
 * applying it on explicit approval.
 */
export async function askTripAssistant(
  userMessage: string,
  history: AssistantMessage[],
  context: TripContext
): Promise<AssistantAction> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) {
    throw new AssistantError('Groq API key is not configured.')
  }

  const messages = [
    { role: 'system' as const, content: buildSystemPrompt(context) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: userMessage },
  ]

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
        messages,
        temperature: 0.5,
        max_tokens: 900,
        response_format: { type: 'json_object' },
      }),
    })
  } catch {
    throw new AssistantError('Could not reach the assistant. Check your connection and try again.')
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new AssistantError('Too many requests right now — wait a moment and try again.')
    }
    throw new AssistantError('The assistant returned an error. Try again.')
  }

  const data = await response.json()
  const text: string | undefined = data?.choices?.[0]?.message?.content
  if (!text) {
    throw new AssistantError('The assistant returned an empty response.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(stripCodeFences(text))
  } catch {
    throw new AssistantError('Could not read the assistant\'s response. Try again.')
  }

  return parseAction(parsed)
}

export { AssistantError }
