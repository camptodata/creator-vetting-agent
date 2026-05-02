import { createClient } from "@/lib/supabase/server";
import { callWithZodTool } from "@/lib/agents/anthropic-client";
import { OutreachDraftsSchema, type OutreachInput, type OutreachDrafts } from "@/lib/agents/types";
import type { SSEEvent } from "@/lib/agents/types";

const SYSTEM_PROMPT = `You are an experienced creator-marketing outreach copywriter. Given a creator profile and brand context, write three different outreach DM drafts:
- "friendly": warm, conversational, low-pressure
- "direct": clear, brisk, value-forward
- "witty": playful, brand-personality-forward, attention-grabbing

Each draft should be 80-150 words. Reference the creator's content style without being sycophantic. Open with a personal-feeling hook (NOT "Hi [name]!"), name the brand, name a specific reason this creator fits, end with a clear next step.`;

/**
 * Async generator that runs the outreach drafter and yields SSE events.
 */
export async function* outreachOrchestrator(
  runId: string,
  input: OutreachInput
): AsyncGenerator<SSEEvent> {
  yield { type: "start", agent: "drafter", runId };

  const supabase = await createClient();

  // Insert a run_step for the drafter
  let stepId: string | null = null;
  try {
    const { data, error } = await supabase
      .from("run_steps")
      .insert({ run_id: runId, agent: "drafter", status: "running" })
      .select("id")
      .single();
    if (!error && data) stepId = data.id as string;
  } catch {
    // Non-fatal — proceed without step tracking
  }

  let drafts: OutreachDrafts;

  try {
    const userMessage = `Creator profile:\n${input.creatorProfile}\n\nBrand context:\n${input.brandContext}\n\nWrite the three outreach DM drafts.`;

    drafts = await callWithZodTool(
      OutreachDraftsSchema,
      "submit_outreach_drafts",
      "Submit three outreach DM drafts: friendly, direct, witty",
      SYSTEM_PROMPT,
      userMessage
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (stepId) {
      await supabase
        .from("run_steps")
        .update({ status: "failed", output: { error: message }, completed_at: new Date().toISOString() })
        .eq("id", stepId);
    }

    await supabase
      .from("runs")
      .update({ status: "failed" })
      .eq("id", runId);

    yield { type: "pipeline_error", agent: "drafter", data: { error: message }, runId };
    return;
  }

  // Persist step complete
  if (stepId) {
    await supabase
      .from("run_steps")
      .update({
        status: "complete",
        output: drafts,
        reasoning: "Generated 3 outreach DM drafts (friendly, direct, witty).",
        completed_at: new Date().toISOString(),
      })
      .eq("id", stepId);
  }

  // Persist run complete
  await supabase
    .from("runs")
    .update({
      status: "complete",
      final_output: drafts,
      completed_at: new Date().toISOString(),
    })
    .eq("id", runId);

  yield { type: "drafts", agent: "drafter", data: drafts, runId };
  yield { type: "done", agent: "drafter", runId };
}
