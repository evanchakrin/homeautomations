# Family Calendar

A self-hosted family calendar inspired by Skylight Calendar Plus. Built on
Next.js 14 (App Router) + Supabase (Postgres, Auth, Storage). Designed to be
deployed to Vercel and run in your browser, on a phone, or on a wall-mounted
tablet via the `/wall` kiosk view.

## Features

- **Shared calendar** with month / week / day / schedule views
  - **Month view** — 6-week grid; up to 4 events per cell with a "+N more" overflow label; grid slides in from left or right as you navigate; click any date cell to open the new-event dialog pre-filled for that date
  - **Week / Day views** — 24-hour time grid with pixel-accurate event positioning; dedicated all-day row above the grid; click any hour slot to create an event pre-filled for that time
  - **Schedule view** — 30-day lookahead grouped by day
- **Animated month carousel** — Jan–Dec strip with a sliding pill that animates as you navigate; year step buttons on either side
- **Today indicator** — today's date shown with a filled circle in month view and accent color in week/day views
- **Member filter strip** — toggle individual family members to show/hide their events across all views
- **Per-member color coding** — events show whose they are at a glance
- **Multi-assign events** — one event, multiple family members
- **Recurrence** (daily, weekdays, weekly, monthly, yearly) via RRULE
- **Full event editor** — title, start/end date+time, all-day toggle, recurrence, location, notes, member assignment; create, edit, and delete from the same dialog
- **Chores** — task list with per-day completion grid (7-day view) and points leaderboard; each chore has a title, assigned member, point value, and recurrence (once, daily, weekdays, weekly, monthly); completions award points automatically via a database trigger
- **Meal planner** — 14-day rolling grid with breakfast, lunch, dinner, and snack slots; click any cell to edit inline; saving an empty cell deletes the entry
- **Lists** — multiple lists per household with kinds: to-do, grocery, notes; items can be checked off (shown in a strikethrough "Done" section with undo) or cleared in bulk; list names are editable in-place
- **Notes** — family pinboard with sticky-note cards; color-coded by author; pin notes to the top; edit and delete inline; **synced live across all devices** via Supabase Realtime with a connection-status badge (live / connecting / offline)
- **Lights** — discover and control Wiz LEDs over UDP; per-device on/off, brightness (10–100 %), scene, color temperature (2 200–6 500 K), and room grouping; master "All lights" controls apply to every device at once
- **Automations** — scene tiles (Wake Up / Movie Night / Bedtime / Away by default + user-creatable) that run a sequence of light commands; each action targets all lights or a specific device and can set scene, brightness, or color temperature; tiles show the last-run timestamp; running a scene on the remote (Vercel) instance records the timestamp without sending UDP commands
- **Photos** — upload images (up to 10 MB) to private Supabase Storage; grid display with per-photo delete; captions displayed on the wall slideshow
- **Wall display** (`/wall`) — kiosk view with a large live clock, 7-day week strip (up to 5 events per day), today's chores, this week's dinner meals, lists, sticky notes, and a rotating photo slideshow (12-second interval, shows captions); full page auto-refreshes every 5 min
- **Settings** — edit household name and timezone; manage family members (name, color, emoji); reset individual member point totals
- **Multi-tenant** with row-level security per household

## Quick start

### 1. Create a Supabase project

1. Go to <https://supabase.com> → **New project**.
2. Note your project URL, anon key, and service role key from
   *Project Settings → API*.
3. In *Authentication → URL Configuration*, set the **Site URL** to your
   Vercel domain (or `http://localhost:3000` for local) and add it to the
   redirect allow list.
4. Open the **SQL Editor** and run each migration in order:
   - [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) —
     core tables (households, members, events, chores, meals, lists, photos),
     RLS policies, storage bucket, and triggers.
   - [`supabase/migrations/0002_lights_automations_notes.sql`](supabase/migrations/0002_lights_automations_notes.sql) —
     `light_devices`, `automation_scenes`, and `notes` tables.

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

## Local + remote deployment (two instances, one Supabase)

The recommended topology runs **two copies of this app**, both pointing at the
same Supabase project:

| Instance | Where | Lights/automations | Everything else |
| --- | --- | --- | --- |
| **Remote** | Vercel | disabled (Vercel can't reach your LAN) | full access |
| **Local** | Mac mini, Pi, or NAS at home | **enabled** — actually drives the bulbs | full access |

Because both instances share the same Postgres + Storage + Auth, all calendar
data, chores, meals, lists, photos, **and notes** sync between them
automatically. Notes use Supabase Realtime, so a note posted on the kitchen
tablet appears on a phone within ~1 second.

Set up:

1. Deploy to Vercel as described above (no `LIGHTS_ENABLED`).
2. On a machine at home, clone the repo, then:
   ```bash
   cd calendar
   cp .env.example .env.local
   # fill in the same Supabase URL + anon key as Vercel
   echo "LIGHTS_ENABLED=1" >> .env.local
   echo "WIZ_BROADCAST=192.168.39.255" >> .env.local   # your LAN broadcast addr
   npm install && npm run build && npm start
   ```
3. Visit the local instance from a browser on the same network. Click
   *Discover* on the **Lights** page to find Wiz devices over UDP. Click any
   tile on **Automations** to run a scene.

The remote (Vercel) instance shows a banner on the lights/automations pages
explaining that control runs from the local instance — it can still **view**
saved devices and scenes, and tapping a scene there records a "last run"
timestamp without changing any bulbs.

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
│   │   │   ├── automations/
│   │   │   ├── calendar/
│   │   │   ├── chores/
│   │   │   ├── lights/
│   │   │   ├── lists/
│   │   │   ├── meals/
│   │   │   ├── notes/
│   │   │   ├── photos/
│   │   │   └── settings/
│   │   ├── auth/callback/ # Supabase magic link callback
│   │   ├── demo/          # no-login demo with static fixture data
│   │   ├── login/
│   │   ├── onboarding/
│   │   └── wall/          # public-after-login kiosk view
│   ├── components/        # UI components grouped by feature
│   ├── lib/
│   │   ├── supabase/      # browser/server/middleware Supabase clients
│   │   ├── auth.ts        # requireUser / requireHousehold helpers
│   │   ├── chores.ts      # chore-due-on-day rules
│   │   ├── colors.ts      # color palette + hex helpers
│   │   ├── data.ts        # server-side data fetchers
│   │   ├── dates.ts       # date helpers
│   │   ├── demo-data.ts   # static fixture data for /demo
│   │   ├── recurrence.ts  # RRULE expansion
│   │   └── wiz.ts         # WIZ_SCENES map + UDP helpers
│   └── middleware.ts      # session refresh + route gating
└── supabase/
    └── migrations/
        ├── 0001_init.sql
        └── 0002_lights_automations_notes.sql
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
