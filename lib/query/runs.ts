"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Run {
  id: string;
  user_id: string;
  tool_type: "vet" | "outreach";
  input: Record<string, string>;
  status: "running" | "complete" | "failed";
  final_output: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
}

export interface RunStep {
  id: string;
  run_id: string;
  agent: string;
  status: "running" | "complete" | "failed";
  output: Record<string, unknown> | null;
  reasoning: string | null;
  started_at: string;
  completed_at: string | null;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useRun(runId: string) {
  return useQuery({
    queryKey: ["run", runId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("runs")
        .select("*")
        .eq("id", runId)
        .single();
      if (error) throw error;
      return data as Run;
    },
    enabled: !!runId,
  });
}

export function useRunSteps(runId: string) {
  return useQuery({
    queryKey: ["run-steps", runId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("run_steps")
        .select("*")
        .eq("run_id", runId)
        .order("started_at", { ascending: true });
      if (error) throw error;
      return data as RunStep[];
    },
    enabled: !!runId,
  });
}

export function useRecentRuns() {
  return useQuery({
    queryKey: ["recent-runs"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("runs")
        .select("id, tool_type, input, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Pick<Run, "id" | "tool_type" | "input" | "status" | "created_at">[];
    },
  });
}

// ─── Create Run mutation ──────────────────────────────────────────────────────

type CreateRunPayload =
  | { tool_type: "vet"; input: { handle: string } }
  | { tool_type: "outreach"; input: { creatorProfile: string; brandContext: string } };

export function useCreateRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateRunPayload) => {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(error.message ?? "Failed to create run");
      }

      return response.json() as Promise<{ runId: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recent-runs"] });
    },
  });
}

// ─── Legacy compat — kept so old imports don't break during transition ────────

/** @deprecated Use useCreateRun instead */
export function useCreateVettingRun() {
  const { mutate: createRun, ...rest } = useCreateRun();
  return {
    mutate: (handle: string, opts?: Parameters<typeof createRun>[1]) =>
      createRun({ tool_type: "vet", input: { handle } }, opts),
    ...rest,
  };
}
