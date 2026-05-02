import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runPipeline } from "@/lib/agents/orchestrator";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: runId } = await params;
  const supabase = await createClient();

  // Verify user is authenticated and owns this run
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: run, error: runError } = await supabase
    .from("vetting_runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", user.id)
    .single();

  if (runError || !run) {
    return new Response("Run not found", { status: 404 });
  }

  // If the run is already complete or failed, return a quick stream with its steps
  if (run.status !== "running") {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const event = JSON.stringify({
          type: "pipeline_complete",
          agent: "writer",
          runId,
        });
        controller.enqueue(encoder.encode(`data: ${event}\n\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const encoder = new TextEncoder();
  const handle = run.creator_handle as string;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of runPipeline(runId, handle)) {
          const data = JSON.stringify(event);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));

          if (
            event.type === "pipeline_complete" ||
            event.type === "pipeline_error"
          ) {
            break;
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const errorEvent = JSON.stringify({
          type: "pipeline_error",
          agent: "coordinator",
          data: { error: message },
          runId,
        });
        controller.enqueue(encoder.encode(`data: ${errorEvent}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
