-- Loop Runner — database schema
-- Run this once in your Supabase project's SQL Editor.
-- Tables are namespaced (loop_runner_*) so they can share a project safely.

-- Game configuration (single row, id = 'default')
create table if not exists public.loop_runner_config (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Captured leads (one row per email, aggregated results)
create table if not exists public.loop_runner_leads (
  email text primary key,
  plays integer not null default 0,
  best_score integer not null default 0,
  best_badge text,
  unlocked_playbook boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists loop_runner_leads_updated_idx
  on public.loop_runner_leads (updated_at desc);

-- RLS on. The app talks to these tables only via the service-role key on the
-- server, which bypasses RLS. No public (anon) policies => data stays private.
alter table public.loop_runner_config enable row level security;
alter table public.loop_runner_leads enable row level security;

-- Public storage bucket for game assets (logo, character, billboards, badges).
insert into storage.buckets (id, name, public)
values ('game-assets', 'game-assets', true)
on conflict (id) do nothing;
