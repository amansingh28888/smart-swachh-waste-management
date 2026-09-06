import { z } from "zod";
import { COMPLAINT_ANALYSIS_PROMPT } from "./prompts";
import { generateContent, extractJson, isAIAvailable } from "./gemini";
import { getDemoComplaintResult } from "./demoData";
import type { ComplaintAIResult } from "@/types";

const ComplaintResultSchema = z.object({
  problemType: z.string().min(1),
  wasteType: z.string().min(1),
  severity: z.enum(["Low", "Medium", "High"]),
  recommendedAction: z.string().min(1),
  reason: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

interface AnalyzeComplaintInput {
  description: string;
  imageBase64?: string;
  mimeType?: string;
}

/**
 * Analyzes a citizen's sanitation complaint (description + optional photo)
 * and returns a structured, validated severity assessment.
 *
 * Same demo-mode fallback contract as analyzeWaste — never throws, never
 * crashes the request, always returns something displayable.
 */
export async function analyzeComplaint({
  description,
  imageBase64,
  mimeType = "image/jpeg",
}: AnalyzeComplaintInput): Promise<ComplaintAIResult> {
  if (!isAIAvailable()) {
    return getDemoComplaintResult(description);
  }

  try {
    const raw = await generateContent({
      prompt: `${COMPLAINT_ANALYSIS_PROMPT}\n\nCitizen's description: "${description}"`,
      imageBase64,
      imageMimeType: mimeType,
    });

    const parsed = JSON.parse(extractJson(raw));
    const validated = ComplaintResultSchema.parse(parsed);

    return validated;
  } catch (err) {
    console.error("[analyzeComplaint] falling back to demo mode:", err);
    return getDemoComplaintResult(description);
  }
}
