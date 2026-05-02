import { callWithZodTool } from "./anthropic-client";
import {
  WriterOutputSchema,
  type WriterOutput,
  type ScoutOutput,
  type AnalystOutput,
} from "./types";

const SYSTEM_PROMPT = `You are a creator vetting report writer. Given the scout's profile and the analyst's per-axis scores, produce a final brand-safety vetting report in markdown: executive summary (3 sentences), recommendation (proceed / proceed-with-caution / pass), per-axis findings (use the analyst's structure), suggested next steps for the campaign team. Always include a final disclaimer that this is a synthetic demo and a production version would integrate real platform APIs.`;

export async function runWriter(
  handle: string,
  scoutOutput: ScoutOutput,
  analystOutput: AnalystOutput
): Promise<WriterOutput> {
  return callWithZodTool(
    WriterOutputSchema,
    "submit_vetting_report",
    "Submit the final markdown vetting report and overall recommendation",
    SYSTEM_PROMPT,
    `Creator handle: ${handle}\n\nScout profile:\n${JSON.stringify(scoutOutput, null, 2)}\n\nBrand-safety analysis:\n${JSON.stringify(analystOutput, null, 2)}\n\nWrite the final vetting report in markdown.`
  );
}
