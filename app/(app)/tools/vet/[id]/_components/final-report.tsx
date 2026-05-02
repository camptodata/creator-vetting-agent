"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, AlertTriangle } from "lucide-react";
import type { WriterOutput } from "@/lib/agents/types";

interface FinalReportProps {
  writerOutput: WriterOutput;
}

const RECOMMENDATION_CONFIG: Record<
  WriterOutput["recommendation"],
  { label: string; variant: "default" | "secondary" | "destructive"; color: string }
> = {
  proceed: { label: "Proceed", variant: "default", color: "text-green-600" },
  "proceed-with-caution": {
    label: "Proceed with Caution",
    variant: "secondary",
    color: "text-yellow-600",
  },
  pass: { label: "Pass", variant: "destructive", color: "text-red-600" },
};

export function FinalReport({ writerOutput }: FinalReportProps) {
  const rec = RECOMMENDATION_CONFIG[writerOutput.recommendation];

  return (
    <Card className="mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Final Vetting Report
          </CardTitle>
          <Badge variant={rec.variant} className="text-sm px-3 py-1">
            {rec.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <MarkdownReport content={writerOutput.report} />
        <Separator className="my-4" />
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-yellow-500" />
          <p>
            <strong>Note:</strong> Profile data sourced from ScrapingDog web search
            where available. A production version would integrate Instagram/TikTok
            APIs, real engagement metrics, and longitudinal growth signals.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function MarkdownReport({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} className="text-xl font-bold mt-4 mb-2 first:mt-0">
              {line.slice(2)}
            </h1>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="text-base font-semibold mt-4 mb-2">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="text-sm font-semibold mt-3 mb-1">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <li key={i} className="text-sm text-muted-foreground ml-4 list-disc">
              <InlineMarkdown text={line.slice(2)} />
            </li>
          );
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="text-sm font-semibold mt-2">
              {line.slice(2, -2)}
            </p>
          );
        }
        if (line.trim() === "") {
          return <div key={i} className="h-2" />;
        }
        return (
          <p key={i} className="text-sm text-muted-foreground leading-relaxed">
            <InlineMarkdown text={line} />
          </p>
        );
      })}
    </div>
  );
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
