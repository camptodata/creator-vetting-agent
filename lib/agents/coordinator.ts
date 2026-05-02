import { callWithZodTool } from "./anthropic-client";
import { TaskPlanSchema, type TaskPlan } from "./types";

const SYSTEM_PROMPT = `You are the coordinator of a creator vetting team. Given a creator handle, decompose the brand-safety vetting task into a step-by-step plan: which subtasks run, what each agent investigates, what the final report should contain. Output a TaskPlan with: \`objective\` (one sentence), \`steps\` (array of \`{ agent, focus, expectedOutput }\`), \`successCriteria\` (array of strings).`;

export async function runCoordinator(handle: string): Promise<TaskPlan> {
  return callWithZodTool(
    TaskPlanSchema,
    "submit_task_plan",
    "Submit the structured vetting task plan for this creator",
    SYSTEM_PROMPT,
    `Creator handle to vet: ${handle}\n\nDecompose the brand-safety vetting task for this creator.`
  );
}
