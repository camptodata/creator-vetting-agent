"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { StepCard } from "./step-card";
import { FinalReport } from "./final-report";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import type { SSEEvent, AgentName, WriterOutput } from "@/lib/agents/types";

const AGENT_ORDER: AgentName[] = ["coordinator", "scout", "analyst", "writer"];

type StepStatus = "pending" | "running" | "complete" | "error";

interface AgentState {
  status: StepStatus;
  event?: SSEEvent;
}

interface RunStreamProps {
  runId: string;
  handle: string;
}

export function RunStream({ runId, handle }: RunStreamProps) {
  const [agentStates, setAgentStates] = useState<Record<AgentName, AgentState>>(
    () => ({
      coordinator: { status: "pending" },
      scout: { status: "pending" },
      analyst: { status: "pending" },
      writer: { status: "pending" },
    })
  );
  const [pipelineStatus, setPipelineStatus] = useState<
    "running" | "complete" | "error"
  >("running");
  const [writerOutput, setWriterOutput] = useState<WriterOutput | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleEvent = useCallback((event: SSEEvent) => {
    const { type, agent, data } = event;

    if (type === "agent_start") {
      setAgentStates((prev) => ({
        ...prev,
        [agent]: { status: "running" },
      }));
    } else if (type === "agent_complete") {
      setAgentStates((prev) => ({
        ...prev,
        [agent]: { status: "complete", event },
      }));

      // Capture writer output for the final report
      if (agent === "writer" && data && "report" in data) {
        setWriterOutput(data as WriterOutput);
      }
    } else if (type === "agent_error") {
      setAgentStates((prev) => ({
        ...prev,
        [agent]: { status: "error", event },
      }));
    } else if (type === "pipeline_complete") {
      setPipelineStatus("complete");
    } else if (type === "pipeline_error") {
      setPipelineStatus("error");
    }
  }, []);

  useEffect(() => {
    const url = `/api/vet/${runId}/stream`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as SSEEvent;
        handleEvent(event);
      } catch {
        console.error("Failed to parse SSE event", e.data);
      }
    };

    es.onerror = () => {
      setPipelineStatus("error");
      es.close();
    };

    return () => {
      es.close();
    };
  }, [runId, handleEvent]);

  // Close SSE when pipeline completes or errors
  useEffect(() => {
    if (pipelineStatus !== "running" && eventSourceRef.current) {
      eventSourceRef.current.close();
    }
  }, [pipelineStatus]);

  return (
    <div className="space-y-6">
      {/* Pipeline header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Vetting: {handle}</h2>
          <p className="text-sm text-muted-foreground">
            4-agent pipeline running in sequence
          </p>
        </div>
        <PipelineStatusBadge status={pipelineStatus} />
      </div>

      {/* Agent steps */}
      <div className="space-y-3">
        {AGENT_ORDER.map((agent) => (
          <StepCard
            key={agent}
            agent={agent}
            status={agentStates[agent].status}
            event={agentStates[agent].event}
          />
        ))}
      </div>

      {/* Final report */}
      {writerOutput && <FinalReport writerOutput={writerOutput} />}
    </div>
  );
}

function PipelineStatusBadge({
  status,
}: {
  status: "running" | "complete" | "error";
}) {
  switch (status) {
    case "running":
      return (
        <Badge variant="secondary" className="gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          Running
        </Badge>
      );
    case "complete":
      return (
        <Badge variant="default" className="gap-1.5 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          Complete
        </Badge>
      );
    case "error":
      return (
        <Badge variant="destructive" className="gap-1.5">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
  }
}
