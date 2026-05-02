import { callWithZodTool } from "./anthropic-client";
import { ScoutOutputSchema, type ScoutOutput, type TaskPlan } from "./types";

const SYSTEM_PROMPT = `You are a creator profile scout. Given only a handle, infer a *plausible synthetic profile* — this is a DEMO, you cannot fetch real data. Be transparent: tag the output as \`synthetic: true\`. Generate: estimated niche, audience size band (micro/mid/macro), platform (best guess), content cadence (posts/week), 4 sample post topics, audience demographics guess, growth trend guess. Be conservative — when unsure, use neutral defaults.`;

export async function runScout(
  handle: string,
  plan: TaskPlan
): Promise<ScoutOutput> {
  return callWithZodTool(
    ScoutOutputSchema,
    "submit_creator_profile",
    "Submit the synthetic creator profile you have inferred from the handle",
    SYSTEM_PROMPT,
    `Creator handle: ${handle}\n\nVetting plan objective: ${plan.objective}\n\nScout focus: ${
      plan.steps.find((s) => s.agent === "scout")?.focus ?? "Build a synthetic profile of this creator"
    }\n\nGenerate a plausible synthetic creator profile.`
  );
}
