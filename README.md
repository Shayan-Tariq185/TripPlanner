# VoyageFlow

A travel itinerary builder — plan a trip destination, dates, budget, and style; get a day-by-day plan; edit, map, budget, and share it.

**All 5 phases are done, plus a full visual retheme, an Overview tab, and a requirements-doc-driven refinement pass (map tile quality, connected itinerary timeline, consistent motion, skeleton loaders, and targeted Framer Motion moments).** Auth, schema, trip creation, dashboard, and trip view are wired up. Trips are drafted by Groq (Llama 3.3 70B), every stop is geocoded via Geoapify, and stops can be dragged to reorder or added/edited/deleted by hand. Opening a trip lands on an **Overview** tab — a bento summary with a welcome card, budget donut, a days-left readiness gauge, a packing preview, a trip-wide map, and an itinerary preview — before switching to the full day-by-day **Itinerary** tab (map, budget tracker, notes, packing list, comments, sharing). Trips can also be deleted (with confirmation).

## Stack

- React + Vite + TypeScript
- Tailwind CSS v4
- Framer Motion (used selectively — see "Motion philosophy" below)
- Supabase (Postgres + Auth + Row Level Security)
- React Router
- Phosphor Icons
- Groq API (itinerary generation, Llama 3.3 70B)
- Leaflet + Stadia Maps or OpenStreetMap/CARTO fallback (map rendering) + Geoapify (geocoding & routing) — no card required for any of these

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create your Supabase project

If you don't have one yet: go to [supabase.com](https://supabase.com) → New project. Takes about a minute to provision.

### 3. Run the schema

In your Supabase project: **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, and run it. This creates all tables (`trips`, `days`, `stops`, `expenses`, `packing_items`, `notes`, `comments`) and their Row Level Security policies.

### 3b. Run the migrations

In the same SQL Editor, run these in order:
- `supabase/migrations/002_cover_photo_attribution.sql` — adds two columns (`cover_photographer_name`, `cover_photographer_url`) needed to credit Pexels photographers whenever a destination photo is shown.
- `supabase/migrations/003_trip_currency.sql` — adds a `currency` column to `trips`. New trips are always created in PKR going forward; existing trips are explicitly backfilled to `USD` so their existing dollar figures aren't silently relabeled as rupees.
- `supabase/migrations/004_scope_note.sql` — adds a `scope_note` column to `trips`, used when the AI judges a destination too narrow for the requested trip length and expands scope to the surrounding area (see "Trip realism" below).

### 4. Turn off email confirmation (recommended for local testing)

In your Supabase project: **Authentication → Providers → Email → turn off "Confirm email"**. Without this, sign-up requires clicking a confirmation link before the account can log in — fine for a live product, but adds friction while you're testing locally. Sign-up now logs the user straight into the dashboard.

### 5. Set your environment variables

Copy the example file:

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase project URL and anon key. Both are in your Supabase project under **Settings → API**.

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Also fill in, when you have them:

```
VITE_GROQ_API_KEY=your-groq-key           # from console.groq.com/keys
VITE_GEOAPIFY_KEY=your-geoapify-key       # from geoapify.com — Projects → API Keys
VITE_PEXELS_API_KEY=your-pexels-key       # from pexels.com/api
VITE_STADIA_API_KEY=your-stadia-key       # from client.stadiamaps.com — optional, see below
```

None of Groq, Geoapify, Pexels, or Stadia Maps requires a card to use their free tier.

**`VITE_STADIA_API_KEY` is optional.** Without it, the map falls back to CARTO's free dark tiles (same as earlier phases) — functional, but visually sparser. With it, the map uses Stadia's `alidade_smooth_dark` style, which renders noticeably more road and label detail. Sign up free at [client.stadiamaps.com](https://client.stadiamaps.com), create a property, and copy its API key.

### 6. Run it

```bash
npm run dev
```

Open the local URL it prints (usually `http://localhost:5173`).

## What works right now

- Landing page
- Sign up / sign in (email + password)
- Dashboard listing your trips
- Trip builder (destination → dates → budget → travel style), saves a real trip to Supabase
- **AI-drafted itineraries** — Groq (Llama 3.3 70B) generates a full day-by-day plan right after you create a trip
- **Geocoding** — every stop is resolved to real coordinates via Geoapify; stops that can't be resolved are flagged rather than silently misplaced
- **Drag-and-drop reordering** of stops within a day
- **Add / edit / delete stops** by hand, alongside the AI-generated ones
- **Interactive map per day** — Leaflet + OpenStreetMap (dark tiles), numbered markers matching stop order, route line connecting them
- **Budget tracker** — spend broken down by category (hotels/attractions/food/transport/other) from both AI-planned stop costs and manual expenses you add, with a progress bar against your total trip budget
- **Delete trip** — removes a trip and everything in it, behind a confirmation dialog
- **Notes** — a trip-level note plus a note per day, autosaving as you type
- **Packing list** — a checklist tied to the trip, add/check/remove items
- **Public share link** — a read-only link (no login required to view) showing the itinerary and map only — budget, notes, and packing list stay private to you
- **Destination photo** — a real photo of the destination (via Pexels) shows as a hero banner on the trip page and a thumbnail on dashboard cards, with photographer attribution. Falls back to the app's gradient header if no good match is found — never shows a broken or irrelevant image.
- **Comments** — logged-in users can leave comments on a trip, useful for coordinating a group trip

## Phase 5 — visual polish pass

- **Motion extended to the actual product** — dashboard trip cards, trip view day cards, trip builder step transitions, and side-panel tab switches all animate in now (previously only the landing page had entrance motion)
- **Bolder, more purposeful color** — the active day card gets a real gold glow rather than a thin ring; each travel style (relaxed/packed/budget/luxury) has its own accent color on dashboard trip cards; the budget progress bar is a thicker, glowing gradient instead of a plain sliver
- **Ambient background treatment** — a very low-opacity radial gradient wash sits behind every screen so the app doesn't read as flatly uniform dark-on-dark
- **Auth pages got the landing page's visual language** — the RouteLine motif and entrance motion now appear on sign in / sign up too, instead of a plain centered form
- **Mobile tab bar fix** — the trip view's 5 side-panel tabs (Map/Budget/Notes/Packing/Comments) now scroll horizontally with labels always visible, instead of shrinking to icon-only and feeling cramped
- **Lighter initial load** — Leaflet (map) and dnd-kit (drag-and-drop) are now code-split into their own chunks, only loaded once someone actually opens a trip, rather than bundled into every page load including the landing page and auth screens

## Notes on the AI generation

- If Groq generation fails for any reason (rate limit, network issue, malformed response), the trip itself is still saved — you'll just land on an empty itinerary and can try creating the trip again. Nothing is lost.
- Stops flagged with a small warning icon couldn't be confidently geocoded — they still show in the list, just without a map pin. This is expected for things like specific transit lines (e.g. "Tram M1") that are hard to resolve as a single mappable place.
- Geocoding runs sequentially with a short delay between requests to stay comfortably under Geoapify's free-tier rate limit.
- The map tiles use Stadia Maps' `alidade_smooth_dark` style if `VITE_STADIA_API_KEY` is set (richer road/label detail), falling back to CARTO's free dark basemap (no key required) if not.
- Routes between stops are real walking paths from Geoapify's Routing API (following actual streets), not straight lines. If routing can't resolve for a given day (rare — usually a temporary network hiccup), the map falls back to a straight line between stops rather than showing nothing.
- Budget tracker treats stop `est_cost` values as "planned" spend and manually-added expenses as additional spend on top — both count toward the same category totals.
- The public share link (`/share/:slug`) never requires login and never exposes budget, notes, or the packing list — only the itinerary (days, stops, map). This matches the Row Level Security policies set up in `schema.sql`, which only grant public `select` access on `trips`, `days`, and `stops`.
- Comments require being signed in to post or view — there's no public comment access, even on a shared trip link.

## Requirements-doc refinement pass

Following a full requirements review (see `voyageflow-requirements-v1.1.md`), this round covered the visual-only items from that plan:

- **Map tile quality** — swapped to Stadia Maps' dark style (with a CARTO fallback) for noticeably more road/label detail than the original free tiles allowed.
- **Connected itinerary timeline** — each day's stop list now has a subtle vertical line threading through the stop icons, so a day reads as a continuous flow rather than a stack of disconnected cards.
- **Consistent custom easing** — every page-level transition now uses the same cubic-bezier curve already defined in `index.css` and used by core components, rather than falling back to Tailwind's default easing on some pages.
- **Skeleton loading states** — Dashboard, TripView, and PublicTripView all show layout-matching skeleton placeholders while loading, instead of a generic centered spinner.
- **Targeted Framer Motion** — added deliberately in four specific places (wizard step transitions, dashboard trip card hover, the Overview/Itinerary view switch, and stop drag-and-drop settling), not as a blanket replacement of the existing CSS-based motion, which still handles most of the app well on its own.
- **PKR currency** — new trips are created in Pakistani Rupees by default (budget, stop costs, expenses, and the AI's own cost estimates), matching VoyageFlow's primary market. Existing trips stay in USD rather than being silently converted — every screen that displays money reads a trip's own `currency` field, so USD and PKR trips can coexist correctly side by side.
- **Weather** — the Overview tab shows a general 7-day forecast for the destination via Open-Meteo (free, no API key needed at all — the only integration in this project that doesn't require signing up for anything). Not matched to specific trip days on purpose, just general climate awareness. If the destination can't be resolved, the whole weather tile hides itself rather than showing a broken or empty box.
- **Trip realism** — when generating an itinerary, the AI now judges whether the destination as entered actually supports the requested trip length (e.g. 5 days for a single landmark). If it doesn't, the AI expands its planning scope to the surrounding area rather than padding with filler, and a short transparency note explaining the expansion shows on the trip page — never a silent override of what was typed.
- **Regenerate itinerary / regenerate a day** — a "Regenerate itinerary" button (with a confirmation dialog, since it replaces every day and stop) sits next to the Overview/Itinerary toggle. Each day card also has a smaller "regenerate this day" button for a cheaper, faster, more targeted retry when only one day feels off — no confirmation needed since it only touches that one day.
- **AI trip assistant** — a new "Assistant" tab lets you edit a trip conversationally: move a stop's time, change its cost, add or remove a stop, reorder within a day, regenerate a single day, add a note, or add a packing item. Every proposed change is shown as a reviewable card — nothing writes to the database until you click Approve. Requests outside this scope (budget total, currency, deleting the trip, multi-step batch changes) are declined with a suggestion to use the relevant tab directly. A client-side daily message cap (30/day per trip) protects the free-tier Groq quota from an actively-used chat session.
- **Edit trip details** — destination, dates, budget, and travel style can now be edited after a trip is created, via an edit button next to Delete. Changing the destination only renames the trip — a visible note explains that existing stops aren't automatically replanned, and points to "Regenerate itinerary" for a fresh draft.
- **Rate limiting** — a shared client-side daily cap (`src/lib/rateLimit.ts`) now covers itinerary generation, single-day regeneration, and assistant messages, protecting free-tier Groq/Geoapify/Pexels quota from accidental repeated triggering. Not a real security boundary (client-side only), but a meaningful safety net.
- **404 page** — any URL that doesn't match a real route now shows a designed "Off the map" page instead of a blank screen.
- **First-time onboarding** — a dismissible welcome card explaining what VoyageFlow does appears once, on an empty dashboard, above the existing "no trips yet" prompt. Dismissed permanently once closed.
- **Better empty states** — Comments and Packing List's empty states now match the visual weight used elsewhere (icon + message) instead of plain text.
- **Timeline alignment fix** — the connected line in the day-by-day itinerary now passes precisely through each stop's icon circle centre (previously offset by ~8px due to a miscalculation that didn't account for the row's own padding).
- **Fewer, better-composed cards on Overview** — Packing and Days & Activity are now one card with an internal divider instead of two separate bordered tiles, reducing visual noise without losing information.
- **Modal entrance animations** — StopEditor, TripDetailsEditor, and ConfirmDialog now fade and scale in via Framer Motion instead of snapping instantly into view, closing the last "instant transition" gap flagged in the UI audit.

### Motion philosophy

VoyageFlow uses CSS transitions for most motion (hover states, scroll reveals, tab switches) and Framer Motion only where CSS genuinely can't do the job well — shared-element transitions (`layoutId`), spring physics, and `AnimatePresence`-driven exits. This is a deliberate choice, not an oversight: adding motion everywhere tips a product from "feels premium" into "feels like it's fighting the user." Every animation should help someone understand what just happened (a card settling into its new position after a drag) rather than just look interesting. If any transition in the app ever feels like it's slowing you down rather than helping, that's worth flagging — it's a quick fix, and it's exactly the kind of feedback this approach depends on.
