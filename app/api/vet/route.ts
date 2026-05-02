import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const CreateVetSchema = z.object({
  handle: z.string().min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handle } = CreateVetSchema.parse(body);

    const supabase = await createClient();

    // Ensure user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Normalize handle (strip leading @)
    const normalizedHandle = handle.startsWith("@") ? handle : `@${handle}`;

    // Create the vetting run
    const { data, error } = await supabase
      .from("vetting_runs")
      .insert({
        user_id: user.id,
        creator_handle: normalizedHandle,
        status: "running",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating vetting run:", error);
      return NextResponse.json(
        { message: "Failed to create vetting run" },
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
