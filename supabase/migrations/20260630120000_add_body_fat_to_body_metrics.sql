-- Add optional body fat tracking to daily check-ins.
-- Waist column already exists on body_metrics; this adds current body fat.

alter table public.body_metrics
  add column if not exists body_fat numeric;

comment on column public.body_metrics.body_fat is 'Body fat percentage from daily check-in';
