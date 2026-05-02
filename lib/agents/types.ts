import { z } from "zod";

// ─── Shared ───────────────────────────────────────────────────────────────────

export const SearchResultSchema = z.object({
  title: z.string(),
  link: z.string(),
  snippet: z.string(),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;

// ─── Vet namespace ────────────────────────────────────────────────────────────

export const PlanStepSchema = z.object({
  agent: z.enum(["scout", "analyst", "writer"]),
  focus: z.string(),
  expectedOutput: z.string(),
});

export const TaskPlanSchema = z.object({
  objective: z.string(),
  steps: z.array(PlanStepSchema),
  successCriteria: z.array(z.string()),
});

export type TaskPlan = z.infer<typeof TaskPlanSchema>;

export const ScoutOutputSchema = z.object({
  synthetic: z.boolean(),
  handle: z.string(),
  niche: z.string(),
  audienceSizeBand: z.enum(["micro", "mid", "macro"]),
  platform: z.string(),
  contentCadence: z.string(),
  samplePostTopics: z.array(z.string()).length(4),
  audienceDemographics: z.string(),
  growthTrend: z.enum(["declining", "flat", "moderate", "strong"]),
  estimatedFollowers: z.string(),
  searchResults: z.array(SearchResultSchema).optional(),
});

export type ScoutOutput = z.infer<typeof ScoutOutputSchema>;

export const AxisSeverity = z.enum(["green", "yellow", "red"]);

export const AxisScoreSchema = z.object({
  severity: AxisSeverity,
  reasoning: z.string(),
  evidence: z.string(),
});

export const AnalystOutputSchema = z.object({
  toneConsistency: AxisScoreSchema,
  controversialTopicsRisk: AxisScoreSchema,
  audienceOverlapWithMainstreamBrands: AxisScoreSchema,
  engagementHealth: AxisScoreSchema,
  growthVelocity: AxisScoreSchema,
  summary: z.string(),
});

export type AnalystOutput = z.infer<typeof AnalystOutputSchema>;

export const WriterOutputSchema = z.object({
  report: z.string(), // full markdown string
  recommendation: z.enum(["proceed", "proceed-with-caution", "pass"]),
});

export type WriterOutput = z.infer<typeof WriterOutputSchema>;

// Namespace export for vet schemas
export const vet = {
  TaskPlan: TaskPlanSchema,
  ScoutOutput: ScoutOutputSchema,
  AnalystOutput: AnalystOutputSchema,
  WriterOutput: WriterOutputSchema,
};

// ─── Outreach namespace ───────────────────────────────────────────────────────

export const OutreachInputSchema = z.object({
  creatorProfile: z.string().min(20).max(2000),
  brandContext: z.string().min(20).max(2000),
});

export type OutreachInput = z.infer<typeof OutreachInputSchema>;

export const OutreachDraftsSchema = z.object({
  friendly: z.string(),
  direct: z.string(),
  witty: z.string(),
});

export type OutreachDrafts = z.infer<typeof OutreachDraftsSchema>;

// Namespace export for outreach schemas
export const outreach = {
  Input: OutreachInputSchema,
  Drafts: OutreachDraftsSchema,
};

// ─── SSE Event Types ─────────────────────────────────────────────────────────

export type AgentName = "coordinator" | "scout" | "analyst" | "writer" | "drafter";

export interface SSEEvent {
  type: "agent_start" | "agent_complete" | "agent_error" | "pipeline_complete" | "pipeline_error" | "start" | "drafts" | "done";
  agent: AgentName;
  data?: TaskPlan | ScoutOutput | AnalystOutput | WriterOutput | OutreachDrafts | { error: string };
  reasoning?: string;
  runId?: string;
}
