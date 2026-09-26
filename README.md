# Quest Planner

A group trip planner, reskinned as a Minecraft-inspired quest: one link to
collect everyone's preferences (budget, dates, biome/destination types, hard
no's), a rules engine that filters down to what actually works for the whole
group, and Gemini (the "Oracle") to pick the single best-fit destination with
per-person fit scores and a day-by-day itinerary. The quest giver (coordinator)
reviews party readiness, consults the Oracle, and seals the final decision.

The visual theme is an original pixel-art aesthetic inspired by Minecraft's
UI language (blocky bevelled panels, a stone/grass/dirt palette, a pixel
font) — it doesn't use any of Mojang's actual game assets, textures, or logo.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Postgres) for storage
- Gemini API for picking the destination
- Deployed on Vercel

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project, then run [`supabase/schema.sql`](supabase/schema.sql)
   in the Supabase SQL editor to create the tables. If your project already
   existed before recent changes, also run any new files under
   [`supabase/migrations/`](supabase/migrations) — currently
   [`002_add_itinerary.sql`](supabase/migrations/002_add_itinerary.sql),
   [`003_drop_votes.sql`](supabase/migrations/003_drop_votes.sql), and
   [`004_add_home_city.sql`](supabase/migrations/004_add_home_city.sql).

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

1. **Start a quest** (`/`) — the coordinator enters a quest name, recruits the
   party (names), and sets a deadline. This creates a trip and returns a
   private admin link (`/admin/[adminToken]`).
2. **Submit preferences** (`/t/[shareToken]`) — shared with the group. Each
   person picks their name from a dropdown, then submits their home city,
   budget range, available dates, biome preferences, and hard no's. Editable
   until the deadline.
3. **Admin status** (`/admin/[adminToken]`) — an XP bar and party roster show
   who's submitted. "Consult the Oracle" unlocks once everyone has submitted,
   or the deadline has passed.
4. **Consult the Oracle** — plain code (`lib/rules.ts`) first narrows things
   down: common available date windows, a budget ceiling set to the lowest
   person's max, and anything hitting a hard no removed. Those filtered
   constraints — plus everyone's home city and the longest common date
   window — are handed to Gemini (`lib/gemini.ts`), which picks exactly
   **one** destination that's realistically reachable within the trip's
   length from everyone's starting city, with a 0-10 fit score and one-line
   reason per person, a per-person budget (including travel cost), trade-offs
   (including any travel-time imbalance), and a day-by-day itinerary. The
   response is requested as strict JSON, validated with `zod`, and checked
   to make sure every member has both a cost and a fit score before saving —
   a bad, partial, or failed response surfaces as an error, never a
   fabricated or incomplete result. No images are generated or stored; the
   recommendation is text-only.
5. **Decision board** (`/t/[shareToken]/board`) — shows the single
   recommendation as a quest card with dates, approx budget, itinerary, and
   heart-based fit scores per person. There's no voting — since only one
   destination is recommended, the group simply reviews it.
6. **Seal the quest** — the coordinator locks in the destination from the
   admin page. The board then shows it as sealed and further writes
   (submissions, re-rolling) are rejected.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. In the Vercel project's Environment Variables, add `SUPABASE_URL`,
   `SUPABASE_ANON_KEY`, and `GEMINI_API_KEY`.
4. Deploy. No build configuration changes are needed.
