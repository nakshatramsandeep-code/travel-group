import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { errorResponse } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ adminToken: string }> }
) {
  const { adminToken } = await params;

  const { data: trip, error } = await supabase
    .from("trips")
    .select("*")
    .eq("admin_token", adminToken)
    .single();

  if (error || !trip) {
    return errorResponse("Trip not found", 404);
  }

  const { data: submissions } = await supabase
    .from("submissions")
    .select("*")
    .eq("trip_id", trip.id);

  const { data: options } = await supabase
    .from("options")
    .select("*")
    .eq("trip_id", trip.id)
    .order("rank", { ascending: true });

  return NextResponse.json({
    trip,
    submissions: submissions ?? [],
    options: options ?? [],
  });
}
