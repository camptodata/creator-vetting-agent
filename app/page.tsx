import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, ShieldCheck, MessageSquare, Database, Globe } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Zap className="h-4 w-4 text-primary" />
            Creator Ops Platform
          </div>
          <Button asChild size="sm">
            <Link href="/sign-in">Try the demo</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
        <Badge variant="secondary" className="mb-6">
          Multi-tool platform · Built in an evening per tool
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl mb-6">
          AI-native creator ops platform
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mb-10">
          Two tools sharing the same auth, persistence, and streaming
          infrastructure — the pattern that makes internal AI tools scalable
          across a creator marketing team.
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

      {/* Tools */}
      <section className="border-t bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-xl font-semibold text-center mb-10">The two tools</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="p-2 rounded-md bg-green-500/10 w-fit mb-3">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                </div>
                <CardTitle className="text-base">/tools/vet — Creator Vetting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Multi-agent pipeline: Coordinator decomposes the task, Scout calls ScrapingDog
                  to fetch real web results, Analyst scores 5 brand-safety axes
                  (green/yellow/red), Writer produces the final markdown report. Live SSE
                  streams each step.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["Coordinator", "Scout + ScrapingDog", "Analyst", "Writer"].map((a) => (
                    <Badge key={a} variant="outline" className="text-xs">
                      {a}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="p-2 rounded-md bg-blue-500/10 w-fit mb-3">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                </div>
                <CardTitle className="text-base">/tools/outreach — Outreach Drafter</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Single structured LLM call producing 3 personalized DM drafts for a
                  creator + brand pair. Friendly, Direct, and Witty tones — each 80–150
                  words with a personal hook and clear next step.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["Friendly", "Direct", "Witty"].map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="border-t">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-xl font-semibold text-center mb-8">Architecture</h2>
          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            <Card>
              <CardHeader className="pb-3">
                <div className="p-2 rounded-md bg-purple-500/10 w-fit mb-3">
                  <Database className="h-5 w-5 text-purple-500" />
                </div>
                <CardTitle className="text-base">Generic runs table</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  One <code>runs</code> + <code>run_steps</code> schema serves both tools.
                  <code>tool_type</code> field dispatches to the right orchestrator.
                  RLS enforced, all data user-scoped.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="p-2 rounded-md bg-orange-500/10 w-fit mb-3">
                  <Globe className="h-5 w-5 text-orange-500" />
                </div>
                <CardTitle className="text-base">Real search data</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Scout calls ScrapingDog for live web results scoped to Instagram,
                  TikTok, and YouTube. Falls back to synthetic-profile mode if
                  <code>SCRAPINGDOG_API_KEY</code> is unset.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="p-2 rounded-md bg-blue-500/10 w-fit mb-3">
                  <Zap className="h-5 w-5 text-blue-500" />
                </div>
                <CardTitle className="text-base">SSE streaming</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Both tools stream events over Server-Sent Events. Each agent
                  step appears live in the UI as it completes. No polling — one
                  connection per run.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <pre className="text-xs leading-relaxed p-6 overflow-x-auto font-mono text-muted-foreground bg-muted/40">
                {`  Browser (EventSource)
       │
       │  GET /api/runs/[id]/stream  (SSE, dispatches by tool_type)
       │
       ▼
  Next.js Route Handler
       │
       ├─► tool_type="vet" ──► vetOrchestrator
       │       │
       │       ├─► Coordinator  (Claude tool-use → TaskPlan)
       │       ├─► Scout        (ScrapingDog → Claude → ScoutOutput)
       │       ├─► Analyst      (Claude tool-use → 5 brand-safety axes)
       │       └─► Writer       (Claude tool-use → markdown report)
       │
       └─► tool_type="outreach" ──► outreachOrchestrator
               │
               └─► Drafter  (Claude structured output → 3 DM drafts)

  All steps persist to: runs + run_steps (Supabase Postgres, RLS)`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>Creator Ops Platform — MIT License</span>
          <span>Next.js 16 · Supabase · Anthropic · ScrapingDog · shadcn/ui</span>
        </div>
      </footer>
    </div>
  );
}
