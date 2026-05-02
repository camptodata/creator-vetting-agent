"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VettingRun {
  id: string;
  user_id: string;
  creator_handle: string;
  status: "running" | "complete" | "failed";
  final_report: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface VettingStep {
  id: string;
  run_id: string;
  agent: "coordinator" | "scout" | "analyst" | "writer";
  status: "running" | "complete" | "failed";
  output: Record<string, unknown> | null;
  reasoning: string | null;
  started_at: string;
  completed_at: string | null;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useVettingRun(runId: string) {
  return useQuery({
    queryKey: ["vetting-run", runId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("vetting_runs")
        .select("*")
        .eq("id", runId)
        .single();
      if (error) throw error;
      return data as VettingRun;
    },
    enabled: !!runId,
  });
}

export function useVettingSteps(runId: string) {
  return useQuery({
    queryKey: ["vetting-steps", runId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("vetting_steps")
        .select("*")
        .eq("run_id", runId)
        .order("started_at", { ascending: true });
      if (error) throw error;
      return data as VettingStep[];
    },
    enabled: !!runId,
  });
}

export function useVettingRuns() {
  return useQuery({
    queryKey: ["vetting-runs"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("vetting_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as VettingRun[];
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateVettingRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (handle: string) => {
      const response = await fetch("/api/vet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(error.message ?? "Failed to create vetting run");
      }

      return response.json() as Promise<{ runId: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vetting-runs"] });
    },
  });
}
