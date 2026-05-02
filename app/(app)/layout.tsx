import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Zap, LogOut } from "lucide-react";
import Link from "next/link";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Nav */}
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/vet" className="flex items-center gap-2 font-semibold text-sm">
            <Zap className="h-4 w-4 text-primary" />
            Creator Vetting Agent
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {user.email}
            </span>
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit" className="gap-2">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      {/* Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}

async function signOut() {
  "use server";
  const { createClient } = await import("@/lib/supabase/server");
  const { redirect } = await import("next/navigation");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
