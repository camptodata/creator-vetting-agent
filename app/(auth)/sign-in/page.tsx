"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default async function SignInPage() {
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
        <CardContent>
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
