import { randomBytes } from "crypto";

export function generateToken(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}
