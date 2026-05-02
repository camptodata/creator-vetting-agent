"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { DraftsView } from "./drafts-view";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import type { SSEEvent, OutreachDrafts } from "@/lib/agents/types";

interface OutreachStreamProps {
  runId: string;
}

export function OutreachStream({ runId }: OutreachStreamProps) {
  const [status, setStatus] = useState<"running" | "complete" | "error">("running");
  const [drafts, setDrafts] = useState<OutreachDrafts | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleEvent = useCallback((event: SSEEvent) => {
    if (event.type === "drafts" && event.data) {
      const d = event.data as OutreachDrafts;
      if ("friendly" in d && "direct" in d && "witty" in d) {
        setDrafts(d);
      }
    } else if (event.type === "done" || event.type === "pipeline_complete") {
      setStatus("complete");
    } else if (event.type === "pipeline_error") {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const url = `/api/runs/${runId}/stream`;
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
      // Only flag as error if we haven't already completed.
      // The browser fires onerror when the server closes a clean SSE stream,
      // which would otherwise overwrite a just-set "complete" state.
      setStatus((prev) => (prev === "running" ? "error" : prev));
      es.close();
    };

    return () => {
      es.close();
    };
  }, [runId, handleEvent]);

  useEffect(() => {
    if (status !== "running" && eventSourceRef.current) {
      eventSourceRef.current.close();
    }
  }, [status]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Outreach Drafts</h2>
          <p className="text-sm text-muted-foreground">
            Generating 3 tone variants...
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {drafts ? (
        <DraftsView drafts={drafts} isLoading={false} />
      ) : status === "error" ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to generate drafts. Please try again.</p>
        </div>
      ) : (
        <DraftsView drafts={null} isLoading={true} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "running" | "complete" | "error" }) {
  switch (status) {
    case "running":
      return (
        <Badge variant="secondary" className="gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          Generating
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
