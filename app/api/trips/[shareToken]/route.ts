import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { errorResponse } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;

  const { data: trip, error } = await supabase
    .from("trips")
    .select(
      "id, name, group_size, deadline, member_names, status, locked_option_id, locked_at"
    )
    .eq("share_token", shareToken)
    .single();

  if (error || !trip) {
    return errorResponse("Trip not found", 404);
  }

  const { data: submissions } = await supabase
    .from("submissions")
    .select("member_name, updated_at")
    .eq("trip_id", trip.id);

  const { data: options } = await supabase
    .from("options")
    .select("*")
    .eq("trip_id", trip.id)
    .order("rank", { ascending: true });

  return NextResponse.json({
    trip,
    submittedMembers: (submissions ?? []).map((s) => s.member_name),
    options: options ?? [],
  });
}
