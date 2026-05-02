import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { OutreachStream } from "./_components/outreach-stream";
import { DraftsView } from "./_components/drafts-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import type { OutreachDrafts } from "@/lib/agents/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OutreachRunPage({ params }: PageProps) {
  const { id: runId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: run, error } = await supabase
    .from("runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", user.id)
    .single();

  if (error || !run || run.tool_type !== "outreach") {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
          <Link href="/tools/outreach">
            <ArrowLeft className="h-4 w-4 mr-2" />
            New outreach run
          </Link>
        </Button>
      </div>

      {run.status === "complete" && run.final_output ? (
        <CompletedRun run={run} />
      ) : run.status === "failed" ? (
        <FailedRun />
      ) : (
        <OutreachStream runId={runId} />
      )}
    </div>
  );
}

function CompletedRun({
  run,
}: {
  run: {
    final_output: unknown;
    completed_at: string | null;
  };
}) {
  const drafts = run.final_output as OutreachDrafts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Outreach Drafts</h2>
          <p className="text-sm text-muted-foreground">
            Completed{" "}
            {run.completed_at
              ? new Date(run.completed_at as string).toLocaleString()
              : ""}
          </p>
        </div>
        <Badge variant="default" className="gap-1.5 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          Complete
        </Badge>
      </div>

      <DraftsView drafts={drafts} isLoading={false} />
    </div>
  );
}

function FailedRun() {
  return (
    <div className="text-center py-16">
      <p className="text-muted-foreground mb-4">
        Failed to generate outreach drafts.
      </p>
      <Button asChild>
        <Link href="/tools/outreach">Try Again</Link>
      </Button>
    </div>
  );
}
