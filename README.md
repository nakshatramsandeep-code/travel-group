# Trip Planner

A group trip planner: one link to collect everyone's preferences (budget,
dates, destination types, hard no's), a rules engine that filters down to
what actually works for the whole group, and Gemini to rank the top 2-3
destination options with per-person fit scores. Riya (the coordinator) reviews
status, generates options, and locks the final decision.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Postgres) for storage
- Gemini API for ranking destination options
- Deployed on Vercel

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project, then run [`supabase/schema.sql`](supabase/schema.sql)
   in the Supabase SQL editor to create the tables. If your project already
   existed before the itinerary/photos feature was added, also run
   [`supabase/migrations/002_add_itinerary_images.sql`](supabase/migrations/002_add_itinerary_images.sql).

3. Copy `.env.example` to `.env.local` and fill in:

   ```
   SUPABASE_URL=            # Project Settings > API > Project URL
   SUPABASE_ANON_KEY=       # Project Settings > API > anon public key
   GEMINI_API_KEY=          # https://aistudio.google.com/apikey
   GEMINI_MODEL=            # optional, defaults to gemini-flash-latest
   ```

   If you see a Gemini `503 UNAVAILABLE` / "high demand" error, try setting
   `GEMINI_MODEL` to a different model (e.g. `gemini-2.5-flash`,
   `gemini-3.5-flash`) without touching code.

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## How it works

1. **Create trip** (`/`) — Riya enters a trip name, the group's names, and a
   deadline. This creates a trip and returns a private admin link
   (`/admin/[adminToken]`).
2. **Submit preferences** (`/t/[shareToken]`) — shared with the group. Each
   person picks their name from a dropdown, then submits budget range,
   available date windows, destination types, and hard no's. Editable until
   the deadline.
3. **Admin status** (`/admin/[adminToken]`) — shows who's submitted. The
   "Generate options" button unlocks once everyone has submitted, or the
   deadline has passed.
4. **Generate options** — plain code (`lib/rules.ts`) first narrows things
   down: common available date windows, a budget ceiling set to the lowest
   person's max, and anything hitting a hard no removed. Those filtered
   constraints are handed to Gemini (`lib/gemini.ts`), which returns 2-3
   ranked destinations with a 0-10 fit score and one-line reason per person,
   an estimated per-person cost, trade-offs, and a day-by-day itinerary. The
   response is requested as strict JSON and validated with `zod` before
   saving — a bad or failed response surfaces as an error, never a
   fabricated result. A few real photos per destination are then fetched
   from Wikipedia (`lib/images.ts`, no API key needed) and saved alongside
   the option.
5. **Decision board** (`/t/[shareToken]/board`) — shows the options as cards
   with photos, dates, a day-by-day itinerary, estimated cost per person,
   and a color-coded person × option fit-score grid. Anyone with the link
   can vote once per option set.
6. **Lock** — Riya confirms a final option from the admin page. The board then
   shows the locked decision and further writes (submissions, votes,
   regeneration) are rejected.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. In the Vercel project's Environment Variables, add `SUPABASE_URL`,
   `SUPABASE_ANON_KEY`, and `GEMINI_API_KEY`.
4. Deploy. No build configuration changes are needed.
