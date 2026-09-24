import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateToken } from "@/lib/tokens";
import { createTripSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createTripSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.message, 422);
  }

  const { name, memberNames, deadline } = parsed.data;

  const { data, error } = await supabase
    .from("trips")
    .insert({
      name,
      group_size: memberNames.length,
      deadline,
      member_names: memberNames,
      share_token: generateToken(),
      admin_token: generateToken(),
    })
    .select("share_token, admin_token")
    .single();

  if (error || !data) {
    return errorResponse(error?.message ?? "Failed to create trip", 500);
  }

  return NextResponse.json({
    shareToken: data.share_token,
    adminToken: data.admin_token,
  });
}
