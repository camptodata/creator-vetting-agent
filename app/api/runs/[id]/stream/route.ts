import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { vetOrchestrator } from "@/lib/orchestrators/vet";
import { outreachOrchestrator } from "@/lib/orchestrators/outreach";
import type { OutreachInput, SSEEvent } from "@/lib/agents/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: runId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: run, error: runError } = await supabase
    .from("runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", user.id)
    .single();

  if (runError || !run) {
    return new Response("Run not found", { status: 404 });
  }

  // If run is already terminal, return a quick completion event
  if (run.status !== "running") {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const event = JSON.stringify({
          type: "pipeline_complete",
          agent: run.tool_type === "outreach" ? "drafter" : "writer",
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
  const toolType = run.tool_type as "vet" | "outreach";
  const runInput = run.input as Record<string, string>;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let generator: AsyncGenerator<SSEEvent>;

        if (toolType === "vet") {
          const handle = runInput.handle as string;
          generator = vetOrchestrator(runId, handle);
        } else {
          const outreachInput: OutreachInput = {
            creatorProfile: runInput.creatorProfile,
            brandContext: runInput.brandContext,
          };
          generator = outreachOrchestrator(runId, outreachInput);
        }

        for await (const event of generator) {
          const data = JSON.stringify(event);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));

          if (
            event.type === "pipeline_complete" ||
            event.type === "pipeline_error" ||
            event.type === "done"
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
