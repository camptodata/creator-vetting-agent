import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const CreateRunSchema = z.discriminatedUnion("tool_type", [
  z.object({
    tool_type: z.literal("vet"),
    input: z.object({ handle: z.string().min(1).max(100) }),
  }),
  z.object({
    tool_type: z.literal("outreach"),
    input: z.object({
      creatorProfile: z.string().min(20).max(2000),
      brandContext: z.string().min(20).max(2000),
    }),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateRunSchema.parse(body);

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Normalize vet handle
    const input =
      parsed.tool_type === "vet"
        ? {
            handle: parsed.input.handle.startsWith("@")
              ? parsed.input.handle
              : `@${parsed.input.handle}`,
          }
        : parsed.input;

    const { data, error } = await supabase
      .from("runs")
      .insert({
        user_id: user.id,
        tool_type: parsed.tool_type,
        input,
        status: "running",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating run:", error);
      return NextResponse.json(
        { message: "Failed to create run" },
        { status: 500 }
      );
    }

    return NextResponse.json({ runId: data.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request", errors: err.issues },
        { status: 400 }
      );
    }
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
