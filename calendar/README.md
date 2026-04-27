# Family Calendar

A self-hosted family calendar inspired by Skylight Calendar Plus. Built on
Next.js 14 (App Router) + Supabase (Postgres, Auth, Storage). Designed to be
deployed to Vercel and run in your browser, on a phone, or on a wall-mounted
tablet via the `/wall` kiosk view.

## Features

- **Shared calendar** with month / week / day / schedule views
- **Per-member color coding** — events show whose they are at a glance
- **Multi-assign events** — one event, multiple kids
- **Recurrence** (daily, weekdays, weekly, monthly, yearly) via RRULE
- **Chores** with per-day completion grid and points leaderboard
- **Meal planner** — two-week rolling breakfast/lunch/dinner board
- **Lists** — to-do, grocery, notes; multiple lists, hide-completed
- **Photos** — uploaded to private Supabase Storage; slideshow on the wall display
- **Wall display** (`/wall`) — kiosk view with clock, week strip, today's chores,
  meal plan, lists, and a photo slideshow; auto-refreshes every 5 min
- **Multi-tenant** with row-level security per household

## Quick start

### 1. Create a Supabase project

1. Go to <https://supabase.com> → **New project**.
2. Note your project URL, anon key, and service role key from
   *Project Settings → API*.
3. In *Authentication → URL Configuration*, set the **Site URL** to your
   Vercel domain (or `http://localhost:3000` for local) and add it to the
   redirect allow list.
4. Open the **SQL Editor** and paste in
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   Click **Run**. This creates all tables, RLS policies, the `photos` storage
   bucket, and the `families` triggers.

### 2. Configure environment

```bash
cd calendar
cp .env.example .env.local
```

Fill in:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # optional, reserved for future admin tasks
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>, sign in with a magic link to your email, and
go through onboarding to name your family and add members.

### 4. Deploy to Vercel

1. Push this repo to GitHub.
2. On Vercel, **Import** the repo. Set the **Root Directory** to `calendar/`.
3. Add the same env vars (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `NEXT_PUBLIC_SITE_URL`).
4. Deploy. Update Supabase **Auth → URL Configuration** to include the Vercel
   URL.

## Wall display

Navigate to `/wall` after signing in. Put it in fullscreen on a tablet. The
page auto-refreshes data every five minutes; the photo slideshow rotates
every twelve seconds. To prevent the tablet from logging out, use a long-lived
browser session — Supabase magic-link sessions persist across reloads.

## Inviting other family members

Each adult signs in with their own email. The first person to create a
household becomes the owner. To add others to the same household, run this in
the Supabase SQL editor (replace the IDs):

```sql
insert into household_users (household_id, user_id, role)
values ('<household-uuid>', '<user-uuid>', 'member');
```

A real invite-by-email flow can be added later using the service role key.

## Project layout

```
calendar/
├── src/
│   ├── app/
│   │   ├── (app)/         # authenticated app shell + pages
│   │   │   ├── calendar/
│   │   │   ├── chores/
│   │   │   ├── meals/
│   │   │   ├── lists/
│   │   │   ├── photos/
│   │   │   └── settings/
│   │   ├── auth/callback/ # Supabase magic link callback
│   │   ├── login/
│   │   ├── onboarding/
│   │   └── wall/          # public-after-login kiosk view
│   ├── components/        # UI components grouped by feature
│   ├── lib/
│   │   ├── supabase/      # browser/server/middleware Supabase clients
│   │   ├── auth.ts        # requireUser / requireHousehold helpers
│   │   ├── data.ts        # server-side data fetchers
│   │   ├── dates.ts       # date helpers
│   │   ├── recurrence.ts  # RRULE expansion
│   │   ├── colors.ts      # color palette + hex helpers
│   │   └── chores.ts      # chore-due-on-day rules
│   └── middleware.ts      # session refresh + route gating
└── supabase/
    └── migrations/0001_init.sql
```

## Stack

- Next.js 14 App Router + React Server Components + Server Actions
- TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth + Storage)
- `@supabase/ssr` for cookie-based session handling
- `date-fns` for dates, `rrule` for recurrence, `zod` for input validation

## What's intentionally not included

- Google / iCloud / Outlook calendar import (planned: an `/api/ics` route
  that pulls ICS feeds on a cron and upserts events)
- Magic-link invite by email (manual SQL for now)
- Recipe library / meal-from-photo
- Push notifications
