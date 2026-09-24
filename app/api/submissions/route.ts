import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { errorResponse, isPastDeadline } from "@/lib/api-helpers";
import { z } from "zod";

const bodySchema = z.object({
  shareToken: z.string().min(1),
  memberName: z.string().min(1),
  budgetMin: z.number().int().nonnegative(),
  budgetMax: z.number().int().nonnegative(),
  dateRanges: z
    .array(z.object({ start: z.string().min(1), end: z.string().min(1) }))
    .min(1),
  destinationTypes: z.array(z.string()).min(1),
  hardNos: z.array(z.string()).default([]),
  hardNoNotes: z.string().max(500).default(""),
});

export async function GET(req: NextRequest) {
  const shareToken = req.nextUrl.searchParams.get("shareToken");
  const memberName = req.nextUrl.searchParams.get("memberName");
  if (!shareToken || !memberName) {
    return errorResponse("shareToken and memberName are required", 422);
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id")
    .eq("share_token", shareToken)
    .single();

  if (tripError || !trip) {
    return errorResponse("Trip not found", 404);
  }

  const { data: submission } = await supabase
    .from("submissions")
    .select("*")
    .eq("trip_id", trip.id)
    .eq("member_name", memberName)
    .maybeSingle();

  return NextResponse.json({ submission: submission ?? null });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.message, 422);
  }
  if (parsed.data.budgetMin > parsed.data.budgetMax) {
    return errorResponse("budgetMin must be <= budgetMax", 422);
  }

  const {
    shareToken,
    memberName,
    budgetMin,
    budgetMax,
    dateRanges,
    destinationTypes,
    hardNos,
    hardNoNotes,
  } = parsed.data;

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, deadline, status, member_names")
    .eq("share_token", shareToken)
    .single();

  if (tripError || !trip) {
    return errorResponse("Trip not found", 404);
  }

  if (!trip.member_names.includes(memberName)) {
    return errorResponse("This name is not part of the trip", 422);
  }

  if (trip.status === "locked") {
    return errorResponse("This trip's decision is already locked", 403);
  }

  if (isPastDeadline(trip.deadline)) {
    return errorResponse("The submission deadline has passed", 403);
  }

  const { data, error } = await supabase
    .from("submissions")
    .upsert(
      {
        trip_id: trip.id,
        member_name: memberName,
        budget_min: budgetMin,
        budget_max: budgetMax,
        date_ranges: dateRanges,
        destination_types: destinationTypes,
        hard_nos: hardNos,
        hard_no_notes: hardNoNotes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "trip_id,member_name" }
    )
    .select()
    .single();

  if (error || !data) {
    return errorResponse(error?.message ?? "Failed to save submission", 500);
  }

  return NextResponse.json({ submission: data });
}
