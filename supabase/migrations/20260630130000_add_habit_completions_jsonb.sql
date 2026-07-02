-- Dynamic habit completions for custom habit IDs (core habits still sync to legacy columns).
alter table public.habit_entries
  add column if not exists completions jsonb not null default '{}'::jsonb;

comment on column public.habit_entries.completions is 'Dynamic habit completion map keyed by habit id';
