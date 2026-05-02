"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { SignInMessages } from "./_components/sign-in-messages";

interface Props {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Creator Vetting Agent</CardTitle>
          <CardDescription>
            Enter your email to receive a magic link. No password required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error / success banners */}
          <SignInMessages error={params.error} message={params.message} />

          {/* Email magic-link form */}
          <form action={signIn}>
            <div className="space-y-4">
              <Input
                type="email"
                name="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full"
              />
              <Button type="submit" className="w-full">
                Send Magic Link
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Guest / anonymous sign-in */}
          <form action="/api/auth/anon" method="POST">
            <Button type="submit" variant="outline" className="w-full flex-col h-auto py-3">
              <span className="font-medium">Continue as guest</span>
              <span className="text-xs text-muted-foreground font-normal mt-0.5">
                No email needed — try the demo with full functionality
              </span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

async function signIn(formData: FormData) {
  "use server";

  const email = formData.get("email") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    redirect("/sign-in?error=Could+not+send+magic+link");
  }

  redirect("/sign-in?message=Check+your+email+for+the+magic+link");
}
