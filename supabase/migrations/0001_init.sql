-- Creator Vetting Agent — Initial Schema
-- Paste this into the Supabase SQL editor: https://app.supabase.com → SQL Editor

create table public.vetting_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  creator_handle text not null,
  status text not null default 'running' check (status in ('running','complete','failed')),
  final_report text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.vetting_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.vetting_runs on delete cascade,
  agent text not null check (agent in ('coordinator','scout','analyst','writer')),
  status text not null check (status in ('running','complete','failed')),
  output jsonb,
  reasoning text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index idx_vetting_steps_run on public.vetting_steps(run_id, started_at);

alter table public.vetting_runs enable row level security;
alter table public.vetting_steps enable row level security;

create policy "vetting_runs_owner" on public.vetting_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "vetting_steps_via_run" on public.vetting_steps
  for all using (
    exists (select 1 from public.vetting_runs where id = run_id and user_id = auth.uid())
  );
