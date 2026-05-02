"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateVettingRun } from "@/lib/query/runs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Zap, Users, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function VetPage() {
  const [handle, setHandle] = useState("");
  const router = useRouter();
  const { mutate: createRun, isPending } = useCreateVettingRun();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!handle.trim()) return;

    createRun(handle.trim(), {
      onSuccess: ({ runId }) => {
        router.push(`/vet/${runId}`);
      },
      onError: (err) => {
        toast.error(err.message ?? "Failed to start vetting run");
      },
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <Badge variant="secondary" className="mb-4">
          Synthetic Demo Mode
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          Vet a Creator
        </h1>
        <p className="text-muted-foreground text-lg">
          Paste a creator handle and our 4-agent pipeline will generate a
          brand-safety vetting report in seconds.
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" />
            Creator Handle
          </CardTitle>
          <CardDescription>
            Enter a creator handle (e.g. @fitnessbysarah, @techreviewguy)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@creatorhandle"
                className="flex-1"
                disabled={isPending}
              />
              <Button type="submit" disabled={isPending || !handle.trim()}>
                {isPending ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 animate-pulse" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Vet
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* What happens next */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-blue-500/10 mt-0.5">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Multi-agent pipeline</p>
              <p className="text-xs text-muted-foreground mt-1">
                4 specialized AI agents coordinate to vet your creator
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-green-500/10 mt-0.5">
              <ShieldCheck className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Brand-safety scoring</p>
              <p className="text-xs text-muted-foreground mt-1">
                5 axes scored green/yellow/red with reasoning
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-muted-foreground mt-8 px-4">
        This is a synthetic demo. The Scout agent generates a plausible profile from the
        handle alone — no real platform data is fetched. A production version would integrate
        Instagram/TikTok APIs, real engagement data, and longitudinal growth signals.
      </p>
    </div>
  );
}
