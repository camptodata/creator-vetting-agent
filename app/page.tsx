import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Shield, Database, GitBranch } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Zap className="h-4 w-4 text-primary" />
            Creator Vetting Agent
          </div>
          <Button asChild size="sm">
            <Link href="/sign-in">Try the demo</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
        <Badge variant="secondary" className="mb-6">
          Built in an evening · Open source
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl mb-6">
          AI-powered creator brand-safety vetting
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mb-10">
          Paste a handle. Watch a coordinator, scout, analyst, and writer agent
          pipeline produce a structured brand-safety report — streamed live to
          your browser.
        </p>
        <Button size="lg" asChild>
          <Link href="/sign-in">
            <Zap className="h-4 w-4 mr-2" />
            Try the demo
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          Magic-link sign in. No password required.
        </p>
      </section>

      {/* Feature cards */}
      <section className="border-t bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-xl font-semibold text-center mb-10">
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="p-2 rounded-md bg-blue-500/10 w-fit mb-3">
                  <GitBranch className="h-5 w-5 text-blue-500" />
                </div>
                <CardTitle className="text-base">Multi-agent pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Coordinator decomposes the task. Scout generates a synthetic
                  profile. Analyst scores brand-safety axes. Writer synthesizes
                  the final report. Each agent uses Claude with Zod-typed
                  structured output.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="p-2 rounded-md bg-green-500/10 w-fit mb-3">
                  <Shield className="h-5 w-5 text-green-500" />
                </div>
                <CardTitle className="text-base">Brand-safety scoring</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  5 axes scored green/yellow/red: tone consistency, controversial
                  topics risk, audience overlap, engagement health, and growth
                  velocity. Each with structured reasoning and evidence.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="p-2 rounded-md bg-purple-500/10 w-fit mb-3">
                  <Database className="h-5 w-5 text-purple-500" />
                </div>
                <CardTitle className="text-base">Structured output</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Every agent response is validated against a Zod schema via the
                  Anthropic tools API. Results are persisted to Supabase Postgres
                  with RLS. Runs are replayable.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="border-t">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-xl font-semibold text-center mb-8">Architecture</h2>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <pre className="text-xs leading-relaxed p-6 overflow-x-auto font-mono text-muted-foreground bg-muted/40">
                {`  Browser (EventSource)
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
          Supabase Postgres  (vetting_runs + vetting_steps, RLS)`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>Creator Vetting Agent — MIT License</span>
          <span>Next.js 15 · Supabase · Anthropic · shadcn/ui</span>
        </div>
      </footer>
    </div>
  );
}
