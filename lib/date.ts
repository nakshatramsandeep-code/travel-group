const LOCALE = "en-IN";

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} — ${formatDate(end)}`;
}

export interface DeadlineStatus {
  text: string;
  urgency: "normal" | "soon" | "passed";
}

/** Human-friendly countdown to a deadline, e.g. "3 days left" or "Deadline passed". */
export function describeDeadline(iso: string): DeadlineStatus {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) {
    return { text: "Deadline passed", urgency: "passed" };
  }

  const hours = diffMs / (1000 * 60 * 60);
  if (hours < 1) {
    const minutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
    return { text: `${minutes} min left`, urgency: "soon" };
  }
  if (hours < 24) {
    return { text: `${Math.round(hours)}h left`, urgency: "soon" };
  }
  const days = Math.round(hours / 24);
  return { text: `${days} day${days === 1 ? "" : "s"} left`, urgency: "normal" };
}
