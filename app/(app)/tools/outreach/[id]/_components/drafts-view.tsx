"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check, MessageSquare } from "lucide-react";
import type { OutreachDrafts } from "@/lib/agents/types";

const TABS = [
  {
    key: "friendly" as const,
    label: "Friendly",
    description: "Warm, conversational, low-pressure",
    badgeColor: "bg-green-500/10 text-green-700 dark:text-green-400",
  },
  {
    key: "direct" as const,
    label: "Direct",
    description: "Clear, brisk, value-forward",
    badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  {
    key: "witty" as const,
    label: "Witty",
    description: "Playful, brand-personality-forward",
    badgeColor: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
];

interface DraftsViewProps {
  drafts: OutreachDrafts | null;
  isLoading: boolean;
}

export function DraftsView({ drafts, isLoading }: DraftsViewProps) {
  const [activeTab, setActiveTab] = useState<"friendly" | "direct" | "witty">("friendly");
  const [copied, setCopied] = useState(false);

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Outreach Drafts
        </CardTitle>

        {/* Tab bar */}
        <div className="flex gap-2 mt-3">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {TABS.filter((t) => t.key === activeTab).map((tab) => (
          <div key={tab.key}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tab.badgeColor}`}>
                {tab.description}
              </span>
              {drafts && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-7 text-xs"
                  onClick={() => copyToClipboard(drafts[tab.key])}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-green-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </div>

            {isLoading || !drafts ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <div className="bg-muted/40 rounded-md p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {drafts[tab.key]}
                </p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DraftsViewSkeleton() {
  return (
    <DraftsView drafts={null} isLoading={true} />
  );
}

interface DraftsBadgeRowProps {
  drafts: OutreachDrafts;
}

export function DraftsBadgeRow({ drafts: _ }: DraftsBadgeRowProps) {
  return (
    <div className="flex gap-2">
      {TABS.map((tab) => (
        <Badge key={tab.key} variant="secondary" className="text-xs">
          {tab.label}
        </Badge>
      ))}
    </div>
  );
}
