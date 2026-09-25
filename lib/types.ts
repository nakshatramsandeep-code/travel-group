export type DestinationType =
  | "beach"
  | "mountains"
  | "city"
  | "heritage"
  | "adventure";

export const DESTINATION_TYPES: { value: DestinationType; label: string }[] = [
  { value: "beach", label: "Beach" },
  { value: "mountains", label: "Mountains" },
  { value: "city", label: "City" },
  { value: "heritage", label: "Heritage" },
  { value: "adventure", label: "Adventure" },
];

export const HARD_NO_OPTIONS = [
  "No long road trips",
  "No treks",
  "No red-eye flights",
  "No camping",
  "No international travel",
  "No high-altitude destinations",
] as const;

export type TripStatus = "collecting" | "options_generated" | "locked";

export interface DateRange {
  start: string; // ISO date (yyyy-mm-dd)
  end: string; // ISO date (yyyy-mm-dd)
}

export interface Trip {
  id: string;
  name: string;
  group_size: number;
  deadline: string; // ISO timestamp
  member_names: string[];
  share_token: string;
  admin_token: string;
  status: TripStatus;
  locked_option_id: string | null;
  locked_at: string | null;
  created_at: string;
}

export interface Submission {
  id: string;
  trip_id: string;
  member_name: string;
  budget_min: number;
  budget_max: number;
  date_ranges: DateRange[];
  destination_types: DestinationType[];
  hard_nos: string[];
  hard_no_notes: string;
  submitted_at: string;
  updated_at: string;
}

export interface FitScoreEntry {
  score: number; // 0-10
  reason: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface TripOption {
  id: string;
  trip_id: string;
  rank: number;
  destination: string;
  dates: DateRange;
  est_cost_per_person: Record<string, number>;
  fit_scores: Record<string, FitScoreEntry>;
  tradeoffs: string;
  itinerary: ItineraryDay[];
  generated_at: string;
}
