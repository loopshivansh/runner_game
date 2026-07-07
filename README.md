# Loop Runner 🏃

A mobile-first, brandable endless runner built for **Loop's** marketing team to
use as a distribution / lead-gen campaign. Players run for 60 seconds, collect
Loop products, dodge roadblocks, and unlock **Loop's Churn Playbook** — capturing
their email in the process. Everything (art, copy, colours, difficulty, links) is
customisable from a built-in marketing dashboard.

Built with Next.js 16 + a custom 2.5D canvas engine + Supabase.

## Routes

| Route | What it is |
| --- | --- |
| `/` | The game: splash → churn-playbook info → email capture → loading → swipe tutorial → 60s runner → win (gold badge + playbook) / hit (silver badge) |
| `/dashboard` | Password-gated marketing dashboard: customise brand/copy/gameplay/assets, view + export leads, live preview |

## How the game works

- **Controls:** swipe (mobile) or arrow keys / WASD (desktop). Up = jump over roadblocks, Down = slide under barriers, Left/Right = change lane.
- **Win (gold badge):** reach the *gold score* before time runs out → unlocks the playbook.
- **Hit / time-up below target (silver badge):** prompts a replay.
- The engine draws everything procedurally from config colours, so it re-themes instantly. Uploaded images (character, coins, obstacles, billboards, badges) override the built-in art.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values (optional — game runs on defaults without them)
npm run dev                  # http://localhost:3000
```

Without Supabase env vars the game still runs on `DEFAULT_CONFIG`; lead capture and
config saving become no-ops.

## Backend setup (Supabase)

1. In your Supabase project, open **SQL Editor** and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). This creates the `loop_runner_config` and `loop_runner_leads` tables and the public `game-assets` storage bucket.
2. Grab **Project URL** and **service_role key** from *Settings → API*.
3. Set env vars (locally in `.env.local`, in Vercel for production):

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key (config writes, leads, uploads) |
| `DASHBOARD_PASSWORD` | Password for `/dashboard` (default `loop-admin`) |

The app only ever touches Supabase from the server (API routes) with the service
role key, so no keys are exposed to the browser.

## Dashboard

Visit `/dashboard`, log in with `DASHBOARD_PASSWORD`, then:

- **Design** — brand name, logo, colours
- **Content** — every piece of copy (splash, playbook steps, email, win/lose)
- **Gameplay** — duration, gold score, points, speed/difficulty, links, lead-capture toggles
- **Assets** — upload character / coin / obstacles / billboards / badges
- **Leads** — table of captured emails with best score + badge, CSV export

Changes save to Supabase and go live immediately (the live preview refreshes on save).

## Deployment (Vercel)

The project is deployment-ready. Set the three env vars above in the Vercel
project settings and deploy. The repo lives at
[github.com/loopshivansh/runner_game](https://github.com/loopshivansh/runner_game).

## Architecture

```
src/
  app/
    page.tsx                 # game host
    dashboard/page.tsx       # dashboard host
    api/{config,lead,leads,auth,upload}/route.ts
  game/
    engine.ts                # 2.5D lane-runner engine (procedural rendering)
    audio.ts                 # WebAudio blips (zero audio assets)
  components/
    GameShell.tsx            # flow state machine + input + lead capture
    Dashboard.tsx            # marketing dashboard
    screens.tsx, scene.tsx, brand.tsx, ui.tsx
  lib/
    config.ts                # GameConfig schema + DEFAULT_CONFIG + merge
    supabase.ts, store.ts, auth.ts
```
