"use client";

import Link from "next/link";
import { ShieldCheck, MessageSquare, Loader2, CheckCircle, XCircle, LayoutGrid } from "lucide-react";

type RunSummary = {
  id: string;
  tool_type: "vet" | "outreach";
  input: Record<string, string>;
  status: "running" | "complete" | "failed";
  created_at: string;
};

const TOOL_ICONS = {
  vet: ShieldCheck,
  outreach: MessageSquare,
};

const TOOL_LABELS = {
  vet: "Vet",
  outreach: "Outreach",
};

function runLabel(run: RunSummary): string {
  if (run.tool_type === "vet") {
    return run.input.handle ?? "unknown";
  }
  // Truncate creator profile to ~25 chars
  const profile = run.input.creatorProfile ?? "";
  return profile.length > 25 ? profile.slice(0, 25) + "…" : profile;
}

function runHref(run: RunSummary): string {
  return `/tools/${run.tool_type}/${run.id}`;
}

function StatusDot({ status }: { status: "running" | "complete" | "failed" }) {
  switch (status) {
    case "running":
      return <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />;
    case "complete":
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    case "failed":
      return <XCircle className="h-3 w-3 text-destructive" />;
  }
}

interface RecentRunsSidebarProps {
  initialRuns: RunSummary[];
}

export function RecentRunsSidebar({ initialRuns }: RecentRunsSidebarProps) {
  return (
    <nav className="space-y-1">
      <div className="flex items-center gap-1.5 px-2 mb-3">
        <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Tools
        </span>
      </div>

      <Link
        href="/tools"
        className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors"
      >
        <LayoutGrid className="h-4 w-4 text-muted-foreground" />
        All tools
      </Link>

      <Link
        href="/tools/vet"
        className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors"
      >
        <ShieldCheck className="h-4 w-4 text-green-500" />
        Creator Vetting
      </Link>

      <Link
        href="/tools/outreach"
        className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors"
      >
        <MessageSquare className="h-4 w-4 text-blue-500" />
        Outreach Drafter
      </Link>

      {initialRuns.length > 0 && (
        <>
          <div className="flex items-center gap-1.5 px-2 mt-5 mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Recent runs
            </span>
          </div>

          {initialRuns.map((run) => {
            const Icon = TOOL_ICONS[run.tool_type];
            return (
              <Link
                key={run.id}
                href={runHref(run)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-muted transition-colors group"
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate text-muted-foreground group-hover:text-foreground transition-colors">
                  {runLabel(run)}
                </span>
                <StatusDot status={run.status} />
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );
}
