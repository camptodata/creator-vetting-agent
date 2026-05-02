import { createClient } from "@/lib/supabase/server";
import { runCoordinator } from "./coordinator";
import { runScout } from "./scout";
import { runAnalyst } from "./analyst";
import { runWriter } from "./writer";
import type {
  SSEEvent,
  AgentName,
  TaskPlan,
  ScoutOutput,
  AnalystOutput,
  WriterOutput,
} from "./types";

async function persistStepStart(
  runId: string,
  agent: AgentName
): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vetting_steps")
    .insert({
      run_id: runId,
      agent,
      status: "running",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to insert step: ${error.message}`);
  return data.id as string;
}

async function persistStepComplete(
  stepId: string,
  output: TaskPlan | ScoutOutput | AnalystOutput | WriterOutput,
  reasoning?: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vetting_steps")
    .update({
      status: "complete",
      output,
      reasoning: reasoning ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", stepId);

  if (error) throw new Error(`Failed to update step: ${error.message}`);
}

async function persistStepError(stepId: string, message: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("vetting_steps")
    .update({
      status: "failed",
      output: { error: message },
      completed_at: new Date().toISOString(),
    })
    .eq("id", stepId);
}

async function persistRunComplete(
  runId: string,
  finalReport: string
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("vetting_runs")
    .update({
      status: "complete",
      final_report: finalReport,
      completed_at: new Date().toISOString(),
    })
    .eq("id", runId);
}

async function persistRunError(runId: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("vetting_runs")
    .update({ status: "failed" })
    .eq("id", runId);
}

/**
 * Async generator that runs the 4-agent pipeline and yields SSE events.
 */
export async function* runPipeline(
  runId: string,
  handle: string
): AsyncGenerator<SSEEvent> {
  // ── Step 1: Coordinator ───────────────────────────────────────────────────
  yield { type: "agent_start", agent: "coordinator", runId };

  let coordinatorStepId: string;
  let plan: TaskPlan;

  try {
    coordinatorStepId = await persistStepStart(runId, "coordinator");
    plan = await runCoordinator(handle);
    await persistStepComplete(coordinatorStepId, plan, `Decomposed task for: ${handle}`);

    yield {
      type: "agent_complete",
      agent: "coordinator",
      data: plan,
      reasoning: `Decomposed brand-safety vetting into ${plan.steps.length} subtasks.`,
      runId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (coordinatorStepId!) await persistStepError(coordinatorStepId!, message);
    await persistRunError(runId);
    yield { type: "agent_error", agent: "coordinator", data: { error: message }, runId };
    yield { type: "pipeline_error", agent: "coordinator", data: { error: message }, runId };
    return;
  }

  // ── Step 2: Scout ─────────────────────────────────────────────────────────
  yield { type: "agent_start", agent: "scout", runId };

  let scoutStepId: string;
  let scoutOutput: ScoutOutput;

  try {
    scoutStepId = await persistStepStart(runId, "scout");
    scoutOutput = await runScout(handle, plan);
    await persistStepComplete(scoutStepId, scoutOutput, `Generated synthetic profile for: ${handle}`);

    yield {
      type: "agent_complete",
      agent: "scout",
      data: scoutOutput,
      reasoning: `Inferred a ${scoutOutput.audienceSizeBand} creator in the ${scoutOutput.niche} niche.`,
      runId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (scoutStepId!) await persistStepError(scoutStepId!, message);
    await persistRunError(runId);
    yield { type: "agent_error", agent: "scout", data: { error: message }, runId };
    yield { type: "pipeline_error", agent: "scout", data: { error: message }, runId };
    return;
  }

  // ── Step 3: Analyst ───────────────────────────────────────────────────────
  yield { type: "agent_start", agent: "analyst", runId };

  let analystStepId: string;
  let analystOutput: AnalystOutput;

  try {
    analystStepId = await persistStepStart(runId, "analyst");
    analystOutput = await runAnalyst(scoutOutput);
    await persistStepComplete(analystStepId, analystOutput, `Scored 5 brand-safety axes.`);

    yield {
      type: "agent_complete",
      agent: "analyst",
      data: analystOutput,
      reasoning: analystOutput.summary,
      runId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (analystStepId!) await persistStepError(analystStepId!, message);
    await persistRunError(runId);
    yield { type: "agent_error", agent: "analyst", data: { error: message }, runId };
    yield { type: "pipeline_error", agent: "analyst", data: { error: message }, runId };
    return;
  }

  // ── Step 4: Writer ────────────────────────────────────────────────────────
  yield { type: "agent_start", agent: "writer", runId };

  let writerStepId: string;
  let writerOutput: WriterOutput;

  try {
    writerStepId = await persistStepStart(runId, "writer");
    writerOutput = await runWriter(handle, scoutOutput, analystOutput);
    await persistStepComplete(writerStepId, writerOutput, `Generated final report with recommendation: ${writerOutput.recommendation}.`);
    await persistRunComplete(runId, writerOutput.report);

    yield {
      type: "agent_complete",
      agent: "writer",
      data: writerOutput,
      reasoning: `Recommendation: ${writerOutput.recommendation}`,
      runId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (writerStepId!) await persistStepError(writerStepId!, message);
    await persistRunError(runId);
    yield { type: "agent_error", agent: "writer", data: { error: message }, runId };
    yield { type: "pipeline_error", agent: "writer", data: { error: message }, runId };
    return;
  }

  yield { type: "pipeline_complete", agent: "writer", runId };
}
