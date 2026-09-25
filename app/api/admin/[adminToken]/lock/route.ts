import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { errorResponse, zodErrorMessage } from "@/lib/api-helpers";
import { lockSchema } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ adminToken: string }> }
) {
  const { adminToken } = await params;
  const body = await req.json().catch(() => null);
  const parsed = lockSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(zodErrorMessage(parsed.error), 422);
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, status")
    .eq("admin_token", adminToken)
    .single();

  if (tripError || !trip) {
    return errorResponse("Trip not found", 404);
  }

  if (trip.status === "locked") {
    return errorResponse("This trip's decision is already locked", 403);
  }

  const { data: option, error: optionError } = await supabase
    .from("options")
    .select("id")
    .eq("id", parsed.data.optionId)
    .eq("trip_id", trip.id)
    .single();

  if (optionError || !option) {
    return errorResponse("That option does not belong to this trip", 422);
  }

  const { error: updateError } = await supabase
    .from("trips")
    .update({
      status: "locked",
      locked_option_id: option.id,
      locked_at: new Date().toISOString(),
    })
    .eq("id", trip.id);

  if (updateError) {
    return errorResponse(updateError.message, 500);
  }

  return NextResponse.json({ ok: true });
}
