import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, MessageSquare, ArrowRight } from "lucide-react";

const TOOLS = [
  {
    href: "/tools/vet",
    icon: ShieldCheck,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
    title: "Creator Vetting",
    description:
      "Multi-agent pipeline: coordinator → scout (SerpAPI) → analyst → writer. Scores 5 brand-safety axes and produces a structured vetting report.",
    badge: "4-agent pipeline",
    badgeVariant: "secondary" as const,
  },
  {
    href: "/tools/outreach",
    icon: MessageSquare,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    title: "Outreach Drafter",
    description:
      "Paste a creator profile and brand context. Get three personalized DM drafts in different tones: Friendly, Direct, and Witty.",
    badge: "Structured LLM output",
    badgeVariant: "secondary" as const,
  },
];

export default function ToolsIndexPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-3">Tools</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          AI-native ops tools for creator marketing — each owning one task,
          sharing the same auth and persistence layer.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card key={tool.href} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className={`p-2 rounded-md ${tool.iconBg} w-fit mb-3`}>
                  <Icon className={`h-5 w-5 ${tool.iconColor}`} />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{tool.title}</CardTitle>
                  <Badge variant={tool.badgeVariant} className="text-xs shrink-0">
                    {tool.badge}
                  </Badge>
                </div>
                <CardDescription className="text-sm">{tool.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 mt-auto">
                <Button asChild variant="outline" size="sm" className="w-full gap-2">
                  <Link href={tool.href}>
                    Open tool
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
