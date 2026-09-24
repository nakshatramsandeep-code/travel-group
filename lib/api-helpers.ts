import { NextResponse } from "next/server";

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function isPastDeadline(deadline: string): boolean {
  return new Date() > new Date(deadline);
}
