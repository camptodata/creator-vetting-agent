import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Zap, LogOut } from "lucide-react";
import Link from "next/link";
import { RecentRunsSidebar } from "./_components/recent-runs-sidebar";

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

  // Fetch last 10 runs server-side for initial render
  const { data: recentRuns } = await supabase
    .from("runs")
    .select("id, tool_type, input, status, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Nav */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/tools" className="flex items-center gap-2 font-semibold text-sm">
            <Zap className="h-4 w-4 text-primary" />
            Creator Ops Platform
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

      {/* Layout: sidebar + content */}
      <div className="flex-1 flex max-w-6xl mx-auto w-full px-4 py-6 gap-6">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 hidden md:block">
          <RecentRunsSidebar initialRuns={recentRuns ?? []} />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
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
