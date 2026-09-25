/** Remembers which person a browser last identified as for a given trip, so
 * they don't have to re-pick their name every time they open the link. */

function key(shareToken: string): string {
  return `trip-planner:identity:${shareToken}`;
}

export function getStoredIdentity(shareToken: string): string {
  try {
    return localStorage.getItem(key(shareToken)) ?? "";
  } catch {
    return "";
  }
}

export function setStoredIdentity(shareToken: string, memberName: string) {
  try {
    localStorage.setItem(key(shareToken), memberName);
  } catch {
    // localStorage unavailable (private mode, blocked, etc.) — not critical
  }
}
