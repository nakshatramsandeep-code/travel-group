import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { errorResponse, isPastDeadline } from "@/lib/api-helpers";
import { buildFilteredConstraints } from "@/lib/rules";
import { generateTripOptions, GeminiGenerationError } from "@/lib/gemini";
import { Submission } from "@/lib/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ adminToken: string }> }
) {
  const { adminToken } = await params;

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("*")
    .eq("admin_token", adminToken)
    .single();

  if (tripError || !trip) {
    return errorResponse("Trip not found", 404);
  }

  if (trip.status === "locked") {
    return errorResponse("This trip's decision is already locked", 403);
  }

  const { data: submissions, error: subError } = await supabase
    .from("submissions")
    .select("*")
    .eq("trip_id", trip.id);

  if (subError) {
    return errorResponse(subError.message, 500);
  }

  const allSubmitted = (submissions?.length ?? 0) >= trip.group_size;
  const deadlinePassed = isPastDeadline(trip.deadline);

  if (!allSubmitted && !deadlinePassed) {
    return errorResponse(
      "Not everyone has submitted yet and the deadline hasn't passed",
      403
    );
  }

  if (!submissions || submissions.length === 0) {
    return errorResponse("No submissions to generate options from", 422);
  }

  const constraints = buildFilteredConstraints(submissions as Submission[]);

  let generated;
  try {
    generated = await generateTripOptions(
      constraints,
      submissions as Submission[]
    );
  } catch (err) {
    if (err instanceof GeminiGenerationError) {
      return errorResponse(err.message, 502);
    }
    throw err;
  }

  // Clear previously generated options (and their votes, via cascade) before saving fresh ones.
  await supabase.from("options").delete().eq("trip_id", trip.id);

  const rows = generated.options.map((opt, idx) => ({
    trip_id: trip.id,
    rank: idx + 1,
    destination: opt.destination,
    dates: opt.dates,
    est_cost_per_person: opt.estCostPerPerson,
    fit_scores: opt.fitScores,
    tradeoffs: opt.tradeoffs,
    itinerary: opt.itinerary,
  }));

  const { data: savedOptions, error: insertError } = await supabase
    .from("options")
    .insert(rows)
    .select();

  if (insertError) {
    return errorResponse(insertError.message, 500);
  }

  await supabase
    .from("trips")
    .update({ status: "options_generated" })
    .eq("id", trip.id);

  return NextResponse.json({ options: savedOptions });
}
