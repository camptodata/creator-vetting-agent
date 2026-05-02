import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { origin } = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const baseUrl =
    isLocalEnv
      ? origin
      : forwardedHost
      ? `https://${forwardedHost}`
      : origin;

  // Build redirect response first so setAll can write cookies onto it
  const response = NextResponse.redirect(`${baseUrl}/tools`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.signInAnonymously();

  if (error) {
    if (error.code === "anonymous_provider_disabled") {
      return NextResponse.redirect(
        `${baseUrl}/sign-in?error=anon_disabled`,
      );
    }
    return NextResponse.redirect(
      `${baseUrl}/sign-in?error=${encodeURIComponent(error.message)}`,
    );
  }

  return response;
}
