import { DateRange, DestinationType, Submission } from "./types";

export interface FilteredConstraints {
  commonDateWindows: DateRange[];
  budgetCeiling: number;
  overallBudgetMin: number;
  allowedDestinationTypes: DestinationType[];
  excludedHardNos: string[];
}

/** Intersect two date ranges, or null if they don't overlap. */
function intersectRange(a: DateRange, b: DateRange): DateRange | null {
  const start = new Date(a.start) > new Date(b.start) ? a.start : b.start;
  const end = new Date(a.end) < new Date(b.end) ? a.end : b.end;
  if (new Date(start) > new Date(end)) return null;
  return { start, end };
}

/**
 * Find date windows where every person has at least one available range
 * that overlaps. Intersects person-by-person, carrying forward all
 * surviving windows.
 */
export function findCommonDateWindows(
  submissions: Submission[]
): DateRange[] {
  if (submissions.length === 0) return [];

  let candidateWindows: DateRange[] = submissions[0].date_ranges;

  for (const submission of submissions.slice(1)) {
    const next: DateRange[] = [];
    for (const window of candidateWindows) {
      for (const range of submission.date_ranges) {
        const overlap = intersectRange(window, range);
        if (overlap) next.push(overlap);
      }
    }
    candidateWindows = next;
    if (candidateWindows.length === 0) break;
  }

  return candidateWindows;
}

/** Budget ceiling = the lowest person's max budget (so no one is priced out). */
export function computeBudgetCeiling(submissions: Submission[]): number {
  return Math.min(...submissions.map((s) => s.budget_max));
}

export function computeOverallBudgetMin(submissions: Submission[]): number {
  return Math.max(...submissions.map((s) => s.budget_min));
}

/** Destination types acceptable to every single person. */
export function findAllowedDestinationTypes(
  submissions: Submission[]
): DestinationType[] {
  if (submissions.length === 0) return [];
  const [first, ...rest] = submissions;
  return first.destination_types.filter((type) =>
    rest.every((s) => s.destination_types.includes(type))
  );
}

/** Union of every hard-no checkbox across the group (any one person's no is a group no). */
export function collectHardNos(submissions: Submission[]): string[] {
  const set = new Set<string>();
  for (const s of submissions) {
    for (const no of s.hard_nos) set.add(no);
  }
  return Array.from(set);
}

export function buildFilteredConstraints(
  submissions: Submission[]
): FilteredConstraints {
  return {
    commonDateWindows: findCommonDateWindows(submissions),
    budgetCeiling: computeBudgetCeiling(submissions),
    overallBudgetMin: computeOverallBudgetMin(submissions),
    allowedDestinationTypes: findAllowedDestinationTypes(submissions),
    excludedHardNos: collectHardNos(submissions),
  };
}
