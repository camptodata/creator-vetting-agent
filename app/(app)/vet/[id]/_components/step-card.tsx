"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Loader2, CheckCircle, XCircle } from "lucide-react";
import type { SSEEvent, AgentName } from "@/lib/agents/types";

const AGENT_LABELS: Record<AgentName, { title: string; description: string }> = {
  coordinator: {
    title: "Coordinator",
    description: "Decomposing vetting task into a plan",
  },
  scout: {
    title: "Scout",
    description: "Generating synthetic creator profile",
  },
  analyst: {
    title: "Analyst",
    description: "Scoring 5 brand-safety axes",
  },
  writer: {
    title: "Writer",
    description: "Synthesizing final vetting report",
  },
};

type StepStatus = "pending" | "running" | "complete" | "error";

interface StepCardProps {
  agent: AgentName;
  status: StepStatus;
  event?: SSEEvent;
}

export function StepCard({ agent, status, event }: StepCardProps) {
  const [expanded, setExpanded] = useState(false);
  const label = AGENT_LABELS[agent];

  return (
    <Card
      className={`transition-all duration-300 ${
        status === "running" ? "border-primary/50" : ""
      } ${status === "error" ? "border-destructive/50" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon status={status} />
            <div>
              <CardTitle className="text-sm font-semibold">{label.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{label.description}</p>
            </div>
          </div>
          {status === "complete" && event?.data && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </CardHeader>

      {status === "running" && (
        <CardContent className="pb-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </CardContent>
      )}

      {status === "complete" && event?.reasoning && (
        <CardContent className="pb-4">
          <p className="text-xs text-muted-foreground italic">{event.reasoning}</p>

          {expanded && event.data && (
            <div className="mt-4">
              <AgentOutput agent={agent} data={event.data} />
            </div>
          )}
        </CardContent>
      )}

      {status === "error" && event?.data && "error" in event.data && (
        <CardContent className="pb-4">
          <p className="text-xs text-destructive">{event.data.error as string}</p>
        </CardContent>
      )}
    </Card>
  );
}

function StatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "pending":
      return (
        <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
      );
    case "running":
      return <Loader2 className="h-6 w-6 text-primary animate-spin flex-shrink-0" />;
    case "complete":
      return <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />;
    case "error":
      return <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />;
  }
}

function AgentOutput({
  agent,
  data,
}: {
  agent: AgentName;
  data: SSEEvent["data"];
}) {
  if (!data) return null;

  if (agent === "coordinator" && "steps" in data) {
    const plan = data as import("@/lib/agents/types").TaskPlan;
    return (
      <div className="space-y-3">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Objective
          </span>
          <p className="text-sm mt-1">{plan.objective}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Steps
          </span>
          <ul className="mt-1 space-y-1">
            {plan.steps.map((step, i) => (
              <li key={i} className="text-xs flex gap-2">
                <Badge variant="outline" className="text-xs px-1.5 py-0 capitalize">
                  {step.agent}
                </Badge>
                <span className="text-muted-foreground">{step.focus}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (agent === "scout" && "niche" in data) {
    const profile = data as import("@/lib/agents/types").ScoutOutput;
    return (
      <div className="grid grid-cols-2 gap-3 text-xs">
        {[
          ["Niche", profile.niche],
          ["Platform", profile.platform],
          ["Audience", `${profile.audienceSizeBand} (${profile.estimatedFollowers})`],
          ["Cadence", profile.contentCadence],
          ["Growth", profile.growthTrend],
          ["Demographics", profile.audienceDemographics],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="font-medium text-muted-foreground">{label}: </span>
            <span>{value}</span>
          </div>
        ))}
        <div className="col-span-2">
          <span className="font-medium text-muted-foreground">Sample Topics: </span>
          <span>{profile.samplePostTopics.join(", ")}</span>
        </div>
      </div>
    );
  }

  if (agent === "analyst" && "toneConsistency" in data) {
    const analysis = data as import("@/lib/agents/types").AnalystOutput;
    const axes = [
      { key: "toneConsistency", label: "Tone Consistency" },
      { key: "controversialTopicsRisk", label: "Controversial Topics" },
      { key: "audienceOverlapWithMainstreamBrands", label: "Audience Overlap" },
      { key: "engagementHealth", label: "Engagement Health" },
      { key: "growthVelocity", label: "Growth Velocity" },
    ] as const;

    return (
      <div className="space-y-2">
        {axes.map(({ key, label }) => {
          const axis = analysis[key];
          return (
            <div key={key} className="flex items-start gap-2 text-xs">
              <SeverityDot severity={axis.severity} />
              <div>
                <span className="font-medium">{label}: </span>
                <span className="text-muted-foreground">{axis.reasoning}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}

function SeverityDot({ severity }: { severity: "green" | "yellow" | "red" }) {
  const colors = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };
  return (
    <div className={`h-2.5 w-2.5 rounded-full mt-0.5 flex-shrink-0 ${colors[severity]}`} />
  );
}
