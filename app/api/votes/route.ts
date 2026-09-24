import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { errorResponse } from "@/lib/api-helpers";
import { z } from "zod";

const bodySchema = z.object({
  shareToken: z.string().min(1),
  memberName: z.string().min(1),
  optionId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.message, 422);
  }

  const { shareToken, memberName, optionId } = parsed.data;

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, status, member_names")
    .eq("share_token", shareToken)
    .single();

  if (tripError || !trip) {
    return errorResponse("Trip not found", 404);
  }

  if (!trip.member_names.includes(memberName)) {
    return errorResponse("This name is not part of the trip", 422);
  }

  if (trip.status === "locked") {
    return errorResponse("The decision is already locked", 403);
  }

  if (trip.status !== "options_generated") {
    return errorResponse("Options haven't been generated yet", 403);
  }

  const { data: option, error: optionError } = await supabase
    .from("options")
    .select("id")
    .eq("id", optionId)
    .eq("trip_id", trip.id)
    .single();

  if (optionError || !option) {
    return errorResponse("That option does not belong to this trip", 422);
  }

  const { data, error } = await supabase
    .from("votes")
    .upsert(
      { trip_id: trip.id, member_name: memberName, option_id: option.id },
      { onConflict: "trip_id,member_name" }
    )
    .select()
    .single();

  if (error || !data) {
    return errorResponse(error?.message ?? "Failed to save vote", 500);
  }

  return NextResponse.json({ vote: data });
}
