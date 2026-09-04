# SmartSwachh

**Segregate. Collect. Dispose. Clean.**

AI-powered Smart Waste & Sanitation Management System connecting Citizens, an AI
classification service, Municipal Admins, and Sanitation Workers on one platform.

---

## 1. Project Overview

Citizens can identify waste items or report garbage/sanitation problems using
photos and short descriptions. An AI service classifies the waste or assesses
the complaint's severity and recommends an action — but never has final
authority. Municipal admins verify AI output, can override priority, and
assign the report to a sanitation worker. Workers complete the on-ground
task, logging before/after photos and the disposal method used. The citizen
sees their report move through to resolution, and admins get real-time
analytics across the whole flow.

```
Citizen → AI Analysis → Admin → Worker → Collection/Cleaning → Disposal → Resolution → Analytics
```

## 2. Features

- Role-based auth (citizen / admin / worker) via Supabase Auth
- AI waste identification (photo → category, bin, disposal method, instructions, confidence)
- AI garbage-complaint analysis (photo + text → problem type, severity, recommended action)
- **AI Demo Mode**: the app works fully even with no `GEMINI_API_KEY` — falls back to
  realistic predefined classifications, clearly labeled in the UI
- Citizen dashboard, report tracking with a visual status timeline
- Admin dashboard with 4 charts (category pie, area bar, status bar, monthly line) + resolution rate
- Admin report review: verify / reject / override priority / assign worker
- Worker dashboard + task detail: start task → before/after photo upload → disposal method → complete
- Notifications (in-app bell, realtime via Supabase Realtime)
- Sanitation monitoring (area scores, top locations, avg. resolution time)
- Disposal tracking (method breakdown + recent records)
- Full Postgres schema + Row Level Security policies
- Image upload to Supabase Storage with type/size validation
- Empty states and loading states throughout
- Seed script producing realistic demo data (10 citizens, 5 workers, 30 reports, 20 identifications, 20 tasks)

## 3. Architecture

- **Framework:** Next.js 15 (App Router) + TypeScript, all rendering server-first
  where possible, client components only where interactivity is required
  (forms, uploads, live dashboards).
- **Auth & DB:** Supabase (Postgres + Auth + Storage). RLS is the only access
  control layer for data — there is no custom backend/API for reads.
- **AI:** an isolated `lib/ai/` module (`analyzeWaste.ts`, `analyzeComplaint.ts`)
  wraps Gemini (`lib/ai/gemini.ts`) behind a stable interface. Swapping providers
  means editing one file. Every AI response is validated with `zod` before
  it's ever saved; invalid or missing-key situations fall back to
  `lib/ai/demoData.ts` (AI Demo Mode) instead of crashing.
- **API routes:** only used where a request needs to run **server-side AI +
  a database write in one transaction-like step** (`/api/ai/analyze-waste`,
  `/api/ai/analyze-complaint`). Everything else (assigning workers, verifying
  reports, completing tasks) is a direct Supabase client call from the
  relevant page, protected by RLS.

## 4. Tech Stack

Next.js 15 · TypeScript · Tailwind CSS · Supabase (Postgres/Auth/Storage) ·
Recharts · Lucide React · Gemini API (`@google/generative-ai`) · Zod

## 5. Folder Structure

```
app/
  page.tsx                     Landing page
  about/                       About page
  login/ signup/ unauthorized/ Auth pages
  citizen/
    dashboard/ identify/ report/ reports/
  admin/
    dashboard/ reports/ reports/[id]/ workers/ sanitation/ disposal/
  worker/
    dashboard/ tasks/[id]/
  api/ai/
    analyze-waste/route.ts
    analyze-complaint/route.ts
components/
  ui/            Hand-rolled primitives (Button, Card, Badge, Input, ...)
  charts/        Recharts wrappers
  Navbar.tsx  NotificationBell.tsx  ImageUploader.tsx  StatusTimeline.tsx  SignOutButton.tsx
lib/
  supabase/      client.ts (browser) · server.ts (RSC) · middleware.ts (session refresh)
  ai/            prompts.ts · gemini.ts · analyzeWaste.ts · analyzeComplaint.ts · demoData.ts
  utils/         cn.ts · format.ts · auth.ts (requireProfile / requireRole)
types/           Shared TS types matching the DB schema
supabase/
  migrations/0001_init.sql   Full schema + RLS + storage buckets
scripts/seed.ts              Demo data seeder (uses the service-role key)
middleware.ts                Route protection by role
.env.example
```

## 6. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the Project URL, `anon` public key, and
   `service_role` secret key.
3. In the SQL Editor, run `supabase/migrations/0001_init.sql` once. It creates
   all enums, tables, RLS policies, the `handle_new_user` trigger, and the
   three storage buckets (`waste-images`, `task-images`, `avatars`).

## 7. Database Setup

The migration is idempotent-ish (`create table if not exists`, `do $$ ... exception when duplicate_object`)
so re-running it is safe. Tables: `profiles`, `waste_reports`,
`waste_identifications`, `workers`, `tasks`, `notifications`. See the file
for exact columns and constraints.

## 8. Storage Setup

Buckets are created by the migration as **public** (so uploaded photos are
viewable without signed URLs, which keeps the demo simple). Only
authenticated users may `INSERT`. If you need private buckets for
production, flip `public` to `false` in the migration and switch
`getPublicUrl` calls in `components/ImageUploader.tsx` to
`createSignedUrl`.

## 9. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only — used by scripts/seed.ts, never imported by app code
GEMINI_API_KEY=                 # optional — omit to run in AI Demo Mode
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` are never referenced from
any `"use client"` file or exposed to the browser — only from
`scripts/seed.ts` and `lib/ai/gemini.ts` (a server-only module imported
solely by the `/api/ai/*` route handlers).

## 10. AI API Setup

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Set `GEMINI_API_KEY` in `.env.local`.
3. That's it — `lib/ai/gemini.ts` picks it up automatically. Leave it unset
   to run entirely in **AI Demo Mode** (no external calls, predefined
   realistic results, clearly labeled with an "AI Demo Mode" badge in the UI).

## 11. Demo Users

Run the seed script (see below) to create these via Supabase Auth:

| Role    | Email             | Password     |
|---------|-------------------|--------------|
| Citizen | citizen@demo.com  | Demo@12345   |
| Admin   | admin@demo.com    | Demo@12345   |
| Worker  | worker@demo.com   | Demo@12345   |

Plus 9 more citizens (`citizen1@demo.com` … `citizen9@demo.com`) and 5 more
workers (`worker1@demo.com` … `worker5@demo.com`), same password. **Change
or remove these before deploying anywhere public.**

## 12. Running Locally

```bash
npm install
cp .env.example .env.local   # fill in your Supabase values
# run supabase/migrations/0001_init.sql in the Supabase SQL editor
npm run seed                 # creates demo users + 30 reports + 20 identifications + 20 tasks
npm run dev
```

Visit `http://localhost:3000`, log in with a demo account (buttons on the
login page autofill the email for you), and walk through the hackathon
demo flow below.

## 13. Deployment Instructions

1. Push to GitHub.
2. Import into [Vercel](https://vercel.com/new).
3. Add the same environment variables from `.env.local` in the Vercel
   project settings (`SUPABASE_SERVICE_ROLE_KEY` is only needed if you run
   the seed script from a CI job — it is not required at runtime by the deployed app).
4. Add your Vercel domain to Supabase **Auth → URL Configuration →
   Redirect URLs** so signup confirmation emails work.
5. Deploy.

## 14. Known Limitations

- Storage buckets are public for demo simplicity — switch to private +
  signed URLs for a real production deployment.
- `workers.availability` isn't automatically flipped to `busy`/`available`
  on assignment/completion — an admin or a DB trigger would need to manage
  that for a real rollout.
- No automated tests are included given the hackathon scope.
- Geolocation ("Use my location") stores raw lat/lng only; there's no
  reverse-geocoding to a human-readable address.
- This codebase was authored without the ability to run `npm install` /
  `next build` in the environment it was written in — review the build
  output the first time you run it locally and file any TypeScript nits
  you hit.

## 15. Future Improvements

- Push notifications (web push / FCM) in addition to the in-app bell
- Heatmap view of reports on an actual map (Mapbox/Leaflet)
- Worker route optimization for multi-task days
- Citizen leaderboard / civic points for reporting and correct segregation
- Multi-language support (Hindi + regional languages)
- Automatic worker availability + area-based auto-assignment suggestions
