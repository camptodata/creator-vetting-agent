import { scrapingdogSearch } from "@/lib/search/scrapingdog";
import { callWithZodTool } from "./anthropic-client";
import {
  ScoutOutputSchema,
  type ScoutOutput,
  type TaskPlan,
  type SearchResult,
} from "./types";

// ─── Synthetic-mode prompt ────────────────────────────────────────────────────

const SYNTHETIC_SYSTEM = `You are a creator profile scout. Given only a handle, infer a *plausible synthetic profile* — this is a DEMO, you cannot fetch real data. Be transparent: set \`synthetic: true\`. Generate: estimated niche, audience size band (micro/mid/macro), platform (best guess), content cadence (posts/week), 4 sample post topics, audience demographics guess, growth trend guess. Be conservative — when unsure, use neutral defaults. Do NOT include searchResults.`;

// ─── Real-search prompt ───────────────────────────────────────────────────────

const REAL_SEARCH_SYSTEM = `You are a creator profile scout. Given web search results for a creator handle, extract a structured profile: niche, audience size band (micro/mid/macro), platform(s), content cadence, 4 sample post topics, audience demographics, growth trend, estimated followers. Set \`synthetic: false\`. Cite which search result each datum came from where possible. If results are sparse or ambiguous, say so honestly in the relevant fields. Do NOT fabricate follower counts — use bands like "likely under 100k" if uncertain.`;

// ─── Schema variant for real search (no synthetic override) ──────────────────

const ScoutOutputSyntheticSchema = ScoutOutputSchema.extend({
  synthetic: ScoutOutputSchema.shape.synthetic,
});

// ─── Main scout function ──────────────────────────────────────────────────────

export async function runScout(
  handle: string,
  plan: TaskPlan
): Promise<ScoutOutput> {
  const scrapingdogApiKey = process.env.SCRAPINGDOG_API_KEY;

  if (!scrapingdogApiKey) {
    // Synthetic fallback — no key
    return runScoutSynthetic(handle, plan);
  }

  return runScoutReal(handle, plan, scrapingdogApiKey);
}

// ─── Synthetic path ───────────────────────────────────────────────────────────

async function runScoutSynthetic(
  handle: string,
  plan: TaskPlan
): Promise<ScoutOutput> {
  const result = await callWithZodTool(
    ScoutOutputSyntheticSchema,
    "submit_creator_profile",
    "Submit the synthetic creator profile you have inferred from the handle",
    SYNTHETIC_SYSTEM,
    `Creator handle: ${handle}\n\nVetting plan objective: ${plan.objective}\n\nScout focus: ${
      plan.steps.find((s) => s.agent === "scout")?.focus ??
      "Build a synthetic profile of this creator"
    }\n\nGenerate a plausible synthetic creator profile. Set synthetic: true.`
  );

  // Force synthetic: true in case model ignores it
  return { ...result, synthetic: true };
}

// ─── Real search path ─────────────────────────────────────────────────────────

async function runScoutReal(
  handle: string,
  plan: TaskPlan,
  apiKey: string
): Promise<ScoutOutput> {
  // Normalize handle — strip leading @ for search query
  const bare = handle.replace(/^@/, "");

  let searchResults: SearchResult[] = [];

  try {
    const results = await scrapingdogSearch(
      `${bare} site:instagram.com OR site:tiktok.com OR site:youtube.com OR site:twitter.com`,
      apiKey,
      { results: 10 }
    );

    searchResults = results.slice(0, 5);
  } catch (err) {
    // ScrapingDog call failed — fall back to synthetic rather than crash
    console.warn("[scout] ScrapingDog call failed, falling back to synthetic:", err);
    return runScoutSynthetic(handle, plan);
  }

  // If no results came back, fall back to synthetic
  if (searchResults.length === 0) {
    console.warn("[scout] ScrapingDog returned 0 results, falling back to synthetic");
    return runScoutSynthetic(handle, plan);
  }

  const searchSummary = searchResults
    .map((r, i) => `[${i + 1}] ${r.title}\n    ${r.link}\n    ${r.snippet}`)
    .join("\n\n");

  const result = await callWithZodTool(
    ScoutOutputSyntheticSchema,
    "submit_creator_profile",
    "Submit the creator profile extracted from web search results",
    REAL_SEARCH_SYSTEM,
    `Creator handle: ${handle}\n\nVetting plan objective: ${plan.objective}\n\nTop web search results:\n\n${searchSummary}\n\nExtract a structured creator profile. Set synthetic: false.`
  );

  return {
    ...result,
    synthetic: false,
    searchResults,
  };
}
