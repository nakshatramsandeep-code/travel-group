import { GoogleGenAI } from "@google/genai";
import { FilteredConstraints } from "./rules";
import { Submission } from "./types";
import { geminiResponseSchema, GeminiResponse } from "./validation";
import { zodErrorMessage } from "./api-helpers";

export class GeminiGenerationError extends Error {}

const RESPONSE_SCHEMA = {
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
              "Map of member name to estimated per-person cost in INR",
          },
          fitScores: {
            type: "object",
            description:
              "Map of member name to { score: 0-10, reason: string }",
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

function buildPrompt(
  constraints: FilteredConstraints,
  submissions: Submission[]
): string {
  const memberSummaries = submissions
    .map((s) => {
      return `- ${s.member_name}: budget INR ${s.budget_min}-${s.budget_max}, wants [${s.destination_types.join(
        ", "
      )}], hard no's: [${[...s.hard_nos, s.hard_no_notes].filter(Boolean).join("; ") || "none"}]`;
    })
    .join("\n");

  const windows = constraints.commonDateWindows
    .map((w) => `${w.start} to ${w.end}`)
    .join(" OR ");

  return `You are helping a group of ${submissions.length} friends pick a trip destination.

Group members and their individual preferences:
${memberSummaries}

Pre-filtered constraints (already computed with plain code, do not contradict them):
- Common available date windows: ${windows || "none found"}
- Group budget ceiling per person (INR): ${constraints.budgetCeiling}
- Destination types acceptable to everyone: ${constraints.allowedDestinationTypes.join(", ") || "none in common, use best judgement across individual preferences"}
- Things that are excluded for the whole group (someone's hard no): ${constraints.excludedHardNos.join(", ") || "none"}

Task: pick exactly ONE specific real destination (e.g. "Goa", "Munnar", "Rishikesh") — the single best fit for the whole group — that fits within the date windows and budget ceiling above, and respects every hard no. Do not suggest anything on the excluded list. Return only one option, not several.

For that option return:
- destination: the place name
- dates: a specific start/end date within one of the common windows
- estCostPerPerson: your estimated per-person cost in INR for EACH of these members: ${submissions.map((s) => s.member_name).join(", ")}
- fitScores: for EACH of these members, a score from 0 to 10 for how well this option fits their stated preferences, and a one-line reason
- tradeoffs: a short note on what the group is trading off with this option
- itinerary: a day-by-day plan, one entry per day from the chosen start date to the end date (inclusive), each with a day number, a short title (e.g. "Arrival & beach time"), and a 1-2 sentence description of what the group would do that day

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

  let rawText: string;
  try {
    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-flash-latest",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
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

  return validated.data;
}
