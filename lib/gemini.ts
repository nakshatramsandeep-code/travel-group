import { GoogleGenAI } from "@google/genai";
import { FilteredConstraints } from "./rules";
import { Submission } from "./types";
import { geminiResponseSchema, GeminiResponse } from "./validation";
import { zodErrorMessage } from "./api-helpers";

export class GeminiGenerationError extends Error {}

/**
 * Built per-request with the actual member names as required schema
 * properties. Gemini's structured-output mode enforces the JSON schema
 * strictly — a bare `{ type: "object" }` with no declared properties is
 * trivially satisfied by `{}`, so prose instructions alone ("fill in every
 * member") aren't reliable. Naming each member as a required property
 * forces the model to emit a value for all of them.
 */
function buildResponseSchema(memberNames: string[]) {
  const costProperties = Object.fromEntries(
    memberNames.map((name) => [name, { type: "number", minimum: 0 }])
  );
  const fitProperties = Object.fromEntries(
    memberNames.map((name) => [
      name,
      {
        type: "object",
        properties: {
          score: { type: "number", minimum: 0, maximum: 10 },
          reason: { type: "string" },
        },
        required: ["score", "reason"],
      },
    ])
  );

  return {
    type: "object",
    properties: {
      options: {
        type: "array",
        minItems: 1,
        maxItems: 1,
        items: {
          type: "object",
          properties: {
            destination: { type: "string" },
            dates: {
              type: "object",
              properties: {
                start: { type: "string" },
                end: { type: "string" },
              },
              required: ["start", "end"],
            },
            estCostPerPerson: {
              type: "object",
              description:
                "Map of member name to estimated per-person cost in INR. Must have every member listed below, no exceptions.",
              properties: costProperties,
              required: memberNames,
            },
            fitScores: {
              type: "object",
              description:
                "Map of member name to { score: 0-10, reason: string }. Must have every member listed below, no exceptions.",
              properties: fitProperties,
              required: memberNames,
            },
            tradeoffs: { type: "string" },
            itinerary: {
              type: "array",
              description:
                "One entry per day of the trip, in order, covering the full date range",
              items: {
                type: "object",
                properties: {
                  day: { type: "integer" },
                  title: { type: "string" },
                  description: { type: "string" },
                },
                required: ["day", "title", "description"],
              },
            },
          },
          required: [
            "destination",
            "dates",
            "estCostPerPerson",
            "fitScores",
            "tradeoffs",
            "itinerary",
          ],
        },
      },
    },
    required: ["options"],
  };
}

function buildPrompt(
  constraints: FilteredConstraints,
  submissions: Submission[]
): string {
  const memberSummaries = submissions
    .map((s) => {
      return `- ${s.member_name} (from ${s.home_city || "unknown city"}): budget INR ${s.budget_min}-${s.budget_max}, wants [${s.destination_types.join(
        ", "
      )}], hard no's: [${[...s.hard_nos, s.hard_no_notes].filter(Boolean).join("; ") || "none"}]`;
    })
    .join("\n");

  const homeCities = Array.from(
    new Set(submissions.map((s) => s.home_city).filter(Boolean))
  );

  const windows = constraints.commonDateWindows
    .map((w) => `${w.start} to ${w.end}`)
    .join(" OR ");

  const longestWindowDays = constraints.commonDateWindows.reduce(
    (max, w) => {
      const days =
        Math.round(
          (new Date(w.end).getTime() - new Date(w.start).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;
      return Math.max(max, days);
    },
    0
  );

  return `You are helping a group of ${submissions.length} friends pick a trip destination.

Group members and their individual preferences:
${memberSummaries}

Pre-filtered constraints (already computed with plain code, do not contradict them):
- Common available date windows: ${windows || "none found"}
- Longest common window is about ${longestWindowDays || "an unknown number of"} day(s)
- Group budget ceiling per person (INR): ${constraints.budgetCeiling}
- Destination types acceptable to everyone: ${constraints.allowedDestinationTypes.join(", ") || "none in common, use best judgement across individual preferences"}
- Things that are excluded for the whole group (someone's hard no): ${constraints.excludedHardNos.join(", ") || "none"}

Travel distance and duration matter: the group is departing from ${homeCities.length > 0 ? homeCities.join(", ") : "unspecified cities"}. Factor in realistic travel time/distance from ALL of these cities to the destination, and weigh that against how many days are actually available (${longestWindowDays || "unknown"} day(s)). Do not recommend a destination that would require more travel time than the trip has days for (e.g. don't send a 1-2 day trip somewhere that needs a full day of travel each way). Prefer destinations that are reasonably reachable for everyone given the group's combined starting points, and mention any meaningful travel-time imbalance between members in the trade-offs.

Task: pick exactly ONE specific real destination (e.g. "Goa", "Munnar", "Rishikesh") — the single best fit for the whole group — that fits within the date windows and budget ceiling above, and respects every hard no. Do not suggest anything on the excluded list. Return only one option, not several.

For that option return:
- destination: the place name
- dates: a specific start/end date within one of the common windows
- estCostPerPerson: your estimated per-person cost in INR for EACH of these members, INCLUDING their travel cost to get there and back from their home city: ${submissions.map((s) => s.member_name).join(", ")}. This field must have an entry for every single one of these members — never leave it empty or partial.
- fitScores: for EACH of these members, a score from 0 to 10 for how well this option fits their stated preferences, and a one-line reason. This field must also have an entry for every single member — never leave it empty or partial.
- tradeoffs: a short note on what the group is trading off with this option, including any travel-time/distance imbalance across members
- itinerary: a day-by-day plan, one entry per day from the chosen start date to the end date (inclusive), each with a day number, a short title (e.g. "Arrival & beach time"), and a 1-2 sentence description of what the group would do that day. Account for travel time within the itinerary (e.g. day 1 may be mostly transit).

Return strict JSON only, matching the provided schema. Do not include any text outside the JSON.`;
}

export async function generateTripOptions(
  constraints: FilteredConstraints,
  submissions: Submission[]
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiGenerationError("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(constraints, submissions);
  const responseSchema = buildResponseSchema(
    submissions.map((s) => s.member_name)
  );

  let rawText: string;
  try {
    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-flash-latest",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });
    rawText = result.text ?? "";
  } catch (err) {
    throw new GeminiGenerationError(
      `Gemini API call failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new GeminiGenerationError(
      "Gemini returned a response that was not valid JSON"
    );
  }

  const validated = geminiResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new GeminiGenerationError(
      `Gemini response did not match the expected schema: ${zodErrorMessage(validated.error)}`
    );
  }

  const option = validated.data.options[0];
  const memberNames = submissions.map((s) => s.member_name);
  const missingCost = memberNames.filter(
    (name) => !(name in option.estCostPerPerson)
  );
  const missingFit = memberNames.filter(
    (name) => !(name in option.fitScores)
  );
  if (missingCost.length > 0 || missingFit.length > 0) {
    throw new GeminiGenerationError(
      `Gemini response was missing data for some members (cost: ${missingCost.join(", ") || "none"}; fit: ${missingFit.join(", ") || "none"})`
    );
  }

  return validated.data;
}
