-- Creator Vetting & Outreach Platform — Schema v2
-- Paste this into the Supabase SQL editor: https://app.supabase.com → SQL Editor
-- This replaces the previous vetting_runs / vetting_steps schema.

-- Generic runs table (one row per tool execution)
create table public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  tool_type text not null check (tool_type in ('vet','outreach')),
  input jsonb not null,           -- tool-specific input shape
  status text not null default 'running' check (status in ('running','complete','failed')),
  final_output jsonb,             -- tool-specific final output (markdown report for vet, drafts array for outreach)
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Per-step events (used by vet's multi-agent pipeline; outreach uses just one row)
create table public.run_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs on delete cascade,
  agent text not null,            -- 'coordinator','scout','analyst','writer','drafter', etc.
  status text not null check (status in ('running','complete','failed')),
  output jsonb,
  reasoning text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index idx_runs_user_created on public.runs(user_id, created_at desc);
create index idx_run_steps_run on public.run_steps(run_id, started_at);

alter table public.runs enable row level security;
alter table public.run_steps enable row level security;

create policy "runs_owner" on public.runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "run_steps_via_run" on public.run_steps
  for all using (
    exists (select 1 from public.runs where id = run_id and user_id = auth.uid())
  );
