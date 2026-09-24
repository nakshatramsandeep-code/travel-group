import { z } from "zod";

export const dateRangeSchema = z
  .object({
    start: z.string().min(1),
    end: z.string().min(1),
  })
  .refine((r) => new Date(r.start) <= new Date(r.end), {
    message: "Range start must be before end",
  });

export const destinationTypeSchema = z.enum([
  "beach",
  "mountains",
  "city",
  "heritage",
  "adventure",
]);

export const createTripSchema = z.object({
  name: z.string().min(1).max(120),
  memberNames: z.array(z.string().min(1).max(60)).min(2).max(20),
  deadline: z.string().min(1),
});

export const submissionSchema = z.object({
  tripId: z.string().uuid(),
  memberName: z.string().min(1),
  budgetMin: z.number().int().nonnegative(),
  budgetMax: z.number().int().nonnegative(),
  dateRanges: z.array(dateRangeSchema).min(1),
  destinationTypes: z.array(destinationTypeSchema).min(1),
  hardNos: z.array(z.string()).default([]),
  hardNoNotes: z.string().max(500).default(""),
}).refine((s) => s.budgetMin <= s.budgetMax, {
  message: "budgetMin must be <= budgetMax",
  path: ["budgetMin"],
});

export const voteSchema = z.object({
  tripId: z.string().uuid(),
  memberName: z.string().min(1),
  optionId: z.string().uuid(),
});

export const lockSchema = z.object({
  optionId: z.string().uuid(),
});

// Shape we ask Gemini to return, and validate the response against.
export const fitScoreEntrySchema = z.object({
  score: z.number().min(0).max(10),
  reason: z.string().min(1),
});

export const geminiOptionSchema = z.object({
  destination: z.string().min(1),
  dates: z.object({
    start: z.string().min(1),
    end: z.string().min(1),
  }),
  estCostPerPerson: z.record(z.string(), z.number().nonnegative()),
  fitScores: z.record(z.string(), fitScoreEntrySchema),
  tradeoffs: z.string().min(1),
});

export const geminiResponseSchema = z.object({
  options: z.array(geminiOptionSchema).min(1).max(3),
});

export type GeminiResponse = z.infer<typeof geminiResponseSchema>;
