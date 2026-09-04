import { z } from "zod";
import { WASTE_CLASSIFICATION_PROMPT } from "./prompts";
import { generateContent, extractJson, isAIAvailable } from "./gemini";
import { getDemoWasteResult } from "./demoData";
import type { WasteAIResult } from "@/types";

const WasteResultSchema = z.object({
  wasteName: z.string().min(1),
  category: z.enum(["Wet Waste", "Dry Waste", "Hazardous Waste", "Other"]),
  type: z.string().min(1),
  recommendedBin: z.string().min(1),
  disposalMethod: z.string().min(1),
  instructions: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

/**
 * Analyzes a waste image and returns a structured, validated classification.
 *
 * Falls back to AI Demo Mode (predefined sample data) whenever:
 *  - GEMINI_API_KEY is not configured
 *  - the AI call fails (network, rate limit, etc.)
 *  - the AI response doesn't parse/validate against WasteResultSchema
 *
 * The caller (API route) is responsible for persisting the result — this
 * function never touches the database, so it stays easy to unit test and
 * swap providers.
 */
export async function analyzeWaste(imageBase64: string, mimeType = "image/jpeg"): Promise<WasteAIResult> {
  if (!isAIAvailable()) {
    return getDemoWasteResult();
  }

  try {
    const raw = await generateContent({
      prompt: WASTE_CLASSIFICATION_PROMPT,
      imageBase64,
      imageMimeType: mimeType,
    });

    const parsed = JSON.parse(extractJson(raw));
    const validated = WasteResultSchema.parse(parsed);

    return validated;
  } catch (err) {
    console.error("[analyzeWaste] falling back to demo mode:", err);
    return getDemoWasteResult();
  }
}
