import { z } from "zod";

// ─── Coordinator ─────────────────────────────────────────────────────────────

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

// ─── Scout ────────────────────────────────────────────────────────────────────

export const ScoutOutputSchema = z.object({
  synthetic: z.literal(true),
  handle: z.string(),
  niche: z.string(),
  audienceSizeBand: z.enum(["micro", "mid", "macro"]),
  platform: z.string(),
  contentCadence: z.string(),
  samplePostTopics: z.array(z.string()).length(4),
  audienceDemographics: z.string(),
  growthTrend: z.enum(["declining", "flat", "moderate", "strong"]),
  estimatedFollowers: z.string(),
});

export type ScoutOutput = z.infer<typeof ScoutOutputSchema>;

// ─── Analyst ──────────────────────────────────────────────────────────────────

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

// ─── Writer ───────────────────────────────────────────────────────────────────

export const WriterOutputSchema = z.object({
  report: z.string(), // full markdown string
  recommendation: z.enum(["proceed", "proceed-with-caution", "pass"]),
});

export type WriterOutput = z.infer<typeof WriterOutputSchema>;

// ─── SSE Event Types ─────────────────────────────────────────────────────────

export type AgentName = "coordinator" | "scout" | "analyst" | "writer";

export interface SSEEvent {
  type: "agent_start" | "agent_complete" | "agent_error" | "pipeline_complete" | "pipeline_error";
  agent: AgentName;
  data?: TaskPlan | ScoutOutput | AnalystOutput | WriterOutput | { error: string };
  reasoning?: string;
  runId?: string;
}
