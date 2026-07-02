-- =============================================================================
-- VG 2.0 — Full database schema alignment (idempotent / safe to re-run)
-- Audited against: lib/analytics.ts, lib/bodyMetrics.ts, lib/habit.ts,
--                  lib/journal.ts, lib/settings.ts, app/admin/checkin/page.tsx
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. body_metrics
-- ---------------------------------------------------------------------------
create table if not exists public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  weight numeric not null,
  waist numeric,
  body_fat numeric,
  steps numeric,
  sleep_hours numeric,
  workout_done boolean not null default false,
  cheat_meal boolean not null default false,
  notes text,
  vg_score numeric,
  created_at timestamptz not null default now()
);

alter table public.body_metrics
  add column if not exists waist numeric,
  add column if not exists body_fat numeric,
  add column if not exists steps numeric,
  add column if not exists sleep_hours numeric,
  add column if not exists workout_done boolean not null default false,
  add column if not exists cheat_meal boolean not null default false,
  add column if not exists notes text,
  add column if not exists vg_score numeric,
  add column if not exists created_at timestamptz not null default now();

create unique index if not exists body_metrics_date_key on public.body_metrics (date);

comment on column public.body_metrics.waist is 'Waist in inches';
comment on column public.body_metrics.body_fat is 'Body fat percentage';
comment on column public.body_metrics.steps is 'Daily step count';
comment on column public.body_metrics.sleep_hours is 'Hours of sleep';
comment on column public.body_metrics.vg_score is 'Persisted VG score (computed client-side if null)';

-- ---------------------------------------------------------------------------
-- 2. habit_entries
--    App writes: date, 11 legacy booleans, completions (jsonb), habit_score, notes
--    Note: column is "date" (not entry_date); score column is "habit_score"
-- ---------------------------------------------------------------------------
create table if not exists public.habit_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  gym_done boolean not null default false,
  steps_done boolean not null default false,
  protein_target_done boolean not null default false,
  water_target_done boolean not null default false,
  sleep_before_11_done boolean not null default false,
  reading_done boolean not null default false,
  english_practice_done boolean not null default false,
  automation_learning_done boolean not null default false,
  mma_done boolean not null default false,
  no_junk_food_done boolean not null default false,
  family_time_done boolean not null default false,
  completions jsonb not null default '{}'::jsonb,
  habit_score numeric not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.habit_entries
  add column if not exists gym_done boolean not null default false,
  add column if not exists steps_done boolean not null default false,
  add column if not exists protein_target_done boolean not null default false,
  add column if not exists water_target_done boolean not null default false,
  add column if not exists sleep_before_11_done boolean not null default false,
  add column if not exists reading_done boolean not null default false,
  add column if not exists english_practice_done boolean not null default false,
  add column if not exists automation_learning_done boolean not null default false,
  add column if not exists mma_done boolean not null default false,
  add column if not exists no_junk_food_done boolean not null default false,
  add column if not exists family_time_done boolean not null default false,
  add column if not exists completions jsonb not null default '{}'::jsonb,
  add column if not exists habit_score numeric not null default 0,
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now();

-- Backfill null completions before enforcing default semantics
update public.habit_entries
set completions = '{}'::jsonb
where completions is null;

alter table public.habit_entries
  alter column completions set default '{}'::jsonb;

create unique index if not exists habit_entries_date_key on public.habit_entries (date);

comment on column public.habit_entries.completions is 'Dynamic habit map keyed by habit id (jsonb)';
comment on column public.habit_entries.habit_score is 'Weighted habit score 0–100';

-- ---------------------------------------------------------------------------
-- 3. journal_entries
-- ---------------------------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  mood numeric,
  energy numeric,
  discipline numeric,
  wins text,
  failures text,
  reflection text,
  created_at timestamptz not null default now()
);

alter table public.journal_entries
  add column if not exists mood numeric,
  add column if not exists energy numeric,
  add column if not exists discipline numeric,
  add column if not exists wins text,
  add column if not exists failures text,
  add column if not exists reflection text,
  add column if not exists created_at timestamptz not null default now();

create unique index if not exists journal_entries_date_key on public.journal_entries (date);

-- ---------------------------------------------------------------------------
-- 4. app_settings
-- ---------------------------------------------------------------------------
create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_settings
  add column if not exists config jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

comment on column public.app_settings.config is 'Full VG 2.0 settings JSON (profile, goals, habits, scoring, ai, preferences)';

-- ---------------------------------------------------------------------------
-- Optional: keep updated_at fresh on app_settings updates
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row
  execute function public.set_updated_at();
