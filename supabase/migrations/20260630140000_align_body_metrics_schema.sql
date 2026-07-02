-- Align public.body_metrics with VG 2.0 frontend save/read payloads.
-- Safe to re-run: additive columns only (IF NOT EXISTS).
--
-- Sources audited:
--   app/admin/checkin/page.tsx  -> saveBodyMetrics()
--   lib/analytics.ts            -> saveBodyMetrics() insert/update
--   lib/bodyMetrics.ts          -> BodyMetricsRecord
--   lib/mission.ts, lib/coachData.ts, app/analytics -> select *

alter table public.body_metrics
  add column if not exists waist numeric,
  add column if not exists body_fat numeric,
  add column if not exists steps numeric,
  add column if not exists sleep_hours numeric,
  add column if not exists workout_done boolean not null default false,
  add column if not exists cheat_meal boolean not null default false,
  add column if not exists notes text,
  add column if not exists vg_score numeric;

comment on column public.body_metrics.waist is 'Waist measurement in inches from daily check-in';
comment on column public.body_metrics.body_fat is 'Body fat percentage from daily check-in';
comment on column public.body_metrics.steps is 'Daily step count';
comment on column public.body_metrics.sleep_hours is 'Hours of sleep logged for the day';
comment on column public.body_metrics.workout_done is 'Whether a workout was completed';
comment on column public.body_metrics.cheat_meal is 'Whether a cheat meal was logged';
comment on column public.body_metrics.notes is 'Optional notes for the day';
comment on column public.body_metrics.vg_score is 'Persisted VG score (computed client-side if null)';
