# Creator Vetting & Outreach Platform

A small internal-tools platform with two tools, built in your stack. Demonstrates the kind of AI-native ops platform I'd build at a creator marketing company.

## Live demo

[link — added after deploy]

## Why this exists

I saw the JD's bullets — "AI-powered evaluation systems", "creator matching", "campaign automation pipelines", "internal tools that make the team 10x more efficient". The pattern across all of them is: a platform of small AI-native tools, each owning one ops task, sharing the same auth / persistence / observability infrastructure. So I built that, in your stack, with two real tools to demonstrate the architecture.

## The two tools

### `/tools/vet` — Creator Vetting Agent

Multi-agent pipeline:
1. Coordinator decomposes the vetting task
2. Scout calls **ScrapingDog** to fetch real web results for the handle, summarizes via Claude
3. Analyst scores 5 brand-safety axes (green/yellow/red)
4. Writer composes the final report

Live SSE streams each step as it runs.

### `/tools/outreach` — Outreach Drafter

Streamed LLM call producing 3 personalized DM drafts (Friendly / Direct / Witty) for a creator + brand pair. Single agent, structured output.

## Stack

- **Frontend:** Next.js 16 App Router, Tailwind, shadcn/ui, TanStack Query
- **Auth:** Supabase Auth (magic link)
- **DB:** Supabase Postgres with RLS — generic `runs` + `run_steps` tables serve both tools
- **LLM:** Anthropic Claude with structured tool output (Zod schemas)
- **Search:** ScrapingDog Universal Search API (falls back to synthetic-profile mode if missing)
- **Streaming:** Server-Sent Events
- **Deploy:** Vercel

## Architecture

```
[ user ] ──▶ /tools (index)
              │
              ├─▶ /tools/vet ──▶ POST /api/runs ──▶ runs row ──▶ vetOrchestrator
              │                                                   │
              │                                                   ├─▶ Coordinator (Claude tool-use)
              │                                                   ├─▶ Scout (ScrapingDog → Claude)
              │                                                   ├─▶ Analyst (Claude tool-use)
              │                                                   └─▶ Writer (Claude tool-use)
              │                                                          │
              └─▶ /tools/outreach ──▶ POST /api/runs ──▶ runs row ──▶ outreachOrchestrator
                                                                          │
                                                                          └─▶ Drafter (Claude structured output)

Each step persists to run_steps. UI consumes /api/runs/[id]/stream as SSE.
```

## Run locally

```bash
pnpm install
cp .env.example .env.local  # fill in your keys
# Run the schema migration: paste supabase/migrations/0001_init.sql in your Supabase SQL editor
pnpm dev
```

Required env vars:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
- `ANTHROPIC_API_KEY`
- `SCRAPINGDOG_API_KEY` (optional — vetting falls back to synthetic profile if missing)

## What this is NOT

- Not a product. It's a portfolio piece sized to fit one evening per tool.
- Not connected to real platform APIs (Instagram, TikTok, etc.) — that's the next step. ScrapingDog is the cheap proxy for "real data".
- Not optimized for cost or scale — single LLM provider, no retries, no batching.

## What I'd build next (in priority order)

1. **Real platform APIs** — Instagram Graph + TikTok Business + YouTube Data — instead of relying on ScrapingDog for indirect signal
2. **More tools on the same shell** — campaign brief generator, performance anomaly spotter, reply triager — each ~3-4h on top of the existing infra
3. **pgvector audience overlap** — match creators by audience embedding rather than handle keyword search
4. **Longitudinal vetting** — re-vet creators every N days, alert on flag changes
5. **Cost telemetry** — per-run LLM/ScrapingDog cost tracking, surfaced in the runs sidebar (the platform pattern that justifies an internal tools shell)

## License

MIT
