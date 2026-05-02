# Creator Vetting Agent

Multi-agent creator brand-safety vetting. Paste a handle, watch a coordinator/scout/analyst/writer pipeline produce a structured brand-safety report — built in an evening to demonstrate the kind of AI-native ops tooling I'd build at a creator marketing platform.

**Live:** https://creator-vetting-agent.vercel.app _(deploy in progress)_

---

## Why this

The 8x Social founding engineer JD mentions "AI-powered evaluation systems that score creator content." I wanted to show the smallest possible production-quality version of that: a multi-agent pipeline that decompose the task, generates a profile, scores brand-safety axes, and writes a structured report — all streamed live to the browser via SSE.

The architecture mirrors my [`research-agent`](https://github.com/camptodata/research-agent) repo intentionally — same orchestration pattern, different domain.

---

## Stack

- **Next.js 15** — App Router, TypeScript strict, Tailwind 4, shadcn/ui
- **Supabase** — Auth (magic link), Postgres, Row Level Security
- **Anthropic Claude** — 4-agent pipeline with Zod-typed structured tool output
- **TanStack Query v5** — server state, mutations
- **Vercel** — deployment + SSE streaming via Node runtime

---

## Architecture

```
  Browser (EventSource)
       │
       │  GET /api/vet/[id]/stream  (SSE, text/event-stream)
       │
       ▼
  Next.js Route Handler
       │
       │  async generator: yields { type, agent, data } events
       │
       ├─► Coordinator  ──────────────────────────────────────────►  TaskPlan
       │        │ (Zod-validated via Anthropic tools API)
       │
       ├─► Scout  ───────────────────────────────────────────────►  ScoutOutput
       │        │ (synthetic profile · disclaimer shown in UI)
       │
       ├─► Analyst  ─────────────────────────────────────────────►  AnalystOutput
       │        │ (5 axes: green / yellow / red)
       │
       └─► Writer  ──────────────────────────────────────────────►  WriterOutput
                │ (markdown report + recommendation)
                │
                ▼
          Supabase Postgres  (vetting_runs + vetting_steps, RLS)
```

Each agent calls Claude via `messages.create` with a `tools` parameter and `tool_choice: { type: "tool", name }` — forcing structured, Zod-validated output. The orchestrator is an `async function*` that yields SSE events as each agent completes.

---

## Run locally

```bash
git clone https://github.com/camptodata/creator-vetting-agent
cd creator-vetting-agent
pnpm install

# 1. Copy env template and fill in your values
cp .env.example .env.local

# 2. Paste the schema into your Supabase SQL editor:
#    supabase/migrations/0001_init.sql

# 3. Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe key (`sb_publishable_...`) |
| `SUPABASE_SECRET_KEY` | Server-only key (`sb_secret_...`) |
| `ANTHROPIC_API_KEY` | From console.anthropic.com |
| `NEXT_PUBLIC_SITE_URL` | Production URL (for auth redirects) |

---

## Synthetic mode disclaimer

This is a demo. The Scout agent generates a **plausible synthetic profile** from the creator handle alone — no real platform APIs are called, no scraping occurs. The UI makes this explicit with a visible disclaimer on every vetting result.

A production version would integrate:
- Instagram Graph API / TikTok Research API for real posts, follower counts, engagement
- Platform brand-safety classification scores (where available)
- Longitudinal growth signals (re-vet every N days, diff on flag changes)

---

## What I'd build next

- **Real platform API ingestion** — Instagram/TikTok APIs with OAuth, cached in Supabase, invalidated on re-vet
- **Audience-overlap via embeddings + pgvector** — embed audience demographics, vector-similarity against known brand audiences to score overlap
- **Longitudinal vetting** — scheduled re-vet runs, webhook alerts when a creator's score changes from green → yellow/red

---

## License

MIT — Copyright (c) 2026 Nick Hartmann
