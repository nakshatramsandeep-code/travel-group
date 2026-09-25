import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Turns a ZodError into a single human-readable line instead of the raw issues JSON. */
export function zodErrorMessage(error: ZodError): string {
  return error.issues.map((issue) => issue.message).join("; ");
}

export function isPastDeadline(deadline: string): boolean {
  return new Date() > new Date(deadline);
}
