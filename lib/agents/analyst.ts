import { callWithZodTool } from "./anthropic-client";
import {
  AnalystOutputSchema,
  type AnalystOutput,
  type ScoutOutput,
} from "./types";

const SYSTEM_PROMPT = `You are a creator brand-safety analyst. Given a synthetic profile, score 5 axes: tone-consistency, controversial-topics-risk, audience-overlap-with-mainstream-brands, engagement-health, growth-velocity. Each axis: \`severity\` (green/yellow/red), \`reasoning\` (1-2 sentences), \`evidence\` (references the profile fields). End with an overall \`summary\` paragraph.`;

export async function runAnalyst(
  scoutOutput: ScoutOutput
): Promise<AnalystOutput> {
  return callWithZodTool(
    AnalystOutputSchema,
    "submit_brand_safety_scores",
    "Submit the brand-safety axis scores for this creator",
    SYSTEM_PROMPT,
    `Here is the synthetic creator profile to analyze:\n\n${JSON.stringify(scoutOutput, null, 2)}\n\nScore all 5 brand-safety axes and provide an overall summary.`
  );
}
