import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { RunStream } from "./_components/run-stream";
import { FinalReport } from "./_components/final-report";
import { StepCard } from "./_components/step-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import type { WriterOutput, AgentName } from "@/lib/agents/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RunPage({ params }: PageProps) {
  const { id: runId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: run, error } = await supabase
    .from("vetting_runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", user.id)
    .single();

  if (error || !run) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
          <Link href="/vet">
            <ArrowLeft className="h-4 w-4 mr-2" />
            New vetting run
          </Link>
        </Button>
      </div>

      {run.status === "complete" && run.final_report ? (
        <CompletedRun runId={runId} run={run} />
      ) : run.status === "failed" ? (
        <FailedRun handle={run.creator_handle as string} />
      ) : (
        <RunStream runId={runId} handle={run.creator_handle as string} />
      )}
    </div>
  );
}

async function CompletedRun({
  runId,
  run,
}: {
  runId: string;
  run: {
    creator_handle: string;
    final_report: string | null;
    completed_at: string | null;
  };
}) {
  const supabase = await createClient();

  const { data: steps } = await supabase
    .from("vetting_steps")
    .select("*")
    .eq("run_id", runId)
    .order("started_at", { ascending: true });

  const writerStep = steps?.find((s) => s.agent === "writer");
  let writerOutput: WriterOutput | null = null;

  if (writerStep?.output) {
    writerOutput = writerStep.output as WriterOutput;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Vetting: {run.creator_handle as string}
          </h2>
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

      <div className="space-y-3">
        {(steps ?? []).map((step) => (
          <StepCard
            key={step.id}
            agent={step.agent as AgentName}
            status="complete"
            event={
              step.output
                ? {
                    type: "agent_complete",
                    agent: step.agent as AgentName,
                    data: step.output as WriterOutput,
                    reasoning: step.reasoning ?? undefined,
                  }
                : undefined
            }
          />
        ))}
      </div>

      {writerOutput && <FinalReport writerOutput={writerOutput} />}
    </div>
  );
}

function FailedRun({ handle }: { handle: string }) {
  return (
    <div className="text-center py-16">
      <p className="text-muted-foreground mb-4">
        The vetting run for <strong>{handle}</strong> failed.
      </p>
      <Button asChild>
        <Link href="/vet">Try Again</Link>
      </Button>
    </div>
  );
}
