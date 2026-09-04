import type { WasteAIResult, ComplaintAIResult } from "@/types";

/**
 * AI Demo Mode fallback data.
 *
 * Used whenever GEMINI_API_KEY is missing, the AI request fails, or the
 * AI response doesn't validate. Keeps the app fully demoable without any
 * external dependency — the UI clearly labels results as demo mode.
 */

const WASTE_SAMPLES: WasteAIResult[] = [
  {
    wasteName: "Plastic Bottle",
    category: "Dry Waste",
    type: "Recyclable",
    recommendedBin: "Blue / Dry Waste Bin",
    disposalMethod: "Recycling",
    instructions: "Empty and rinse before disposal.",
    confidence: 0.93,
  },
  {
    wasteName: "Banana Peel",
    category: "Wet Waste",
    type: "Biodegradable",
    recommendedBin: "Green / Wet Waste Bin",
    disposalMethod: "Composting",
    instructions: "Compost at home or in a community pit.",
    confidence: 0.9,
  },
  {
    wasteName: "Used Battery",
    category: "Hazardous Waste",
    type: "Hazardous",
    recommendedBin: "Hazardous Waste Bin",
    disposalMethod: "Hazardous Treatment",
    instructions: "Do not mix with regular waste; take to a collection point.",
    confidence: 0.88,
  },
  {
    wasteName: "Food Wrapper",
    category: "Dry Waste",
    type: "Non-Recyclable",
    recommendedBin: "Black / Landfill Bin",
    disposalMethod: "Landfill",
    instructions: "Non-recyclable — dispose in general waste bin.",
    confidence: 0.81,
  },
];

const COMPLAINT_SAMPLES: ComplaintAIResult[] = [
  {
    problemType: "Garbage Accumulation",
    wasteType: "Mixed Waste",
    severity: "High",
    recommendedAction: "Immediate Collection",
    reason: "Large amount of waste accumulated in a public area.",
    confidence: 0.87,
  },
  {
    problemType: "Overflowing Bin",
    wasteType: "Dry Waste",
    severity: "Medium",
    recommendedAction: "Scheduled Collection",
    reason: "Bin appears full but not yet a health hazard.",
    confidence: 0.82,
  },
  {
    problemType: "Drainage Blockage",
    wasteType: "Mixed Waste",
    severity: "High",
    recommendedAction: "Drain Cleaning Required",
    reason: "Blocked drains risk water stagnation and disease spread.",
    confidence: 0.85,
  },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getDemoWasteResult(): WasteAIResult {
  return { ...pick(WASTE_SAMPLES), demoMode: true };
}

export function getDemoComplaintResult(description: string): ComplaintAIResult {
  const lower = description.toLowerCase();

  // Very light keyword heuristic so the demo still feels responsive to input,
  // even without a real model call.
  if (lower.includes("drain") || lower.includes("water")) {
    return { ...COMPLAINT_SAMPLES[2], demoMode: true };
  }
  if (lower.includes("bin") || lower.includes("overflow")) {
    return { ...COMPLAINT_SAMPLES[1], demoMode: true };
  }
  return { ...COMPLAINT_SAMPLES[0], demoMode: true };
}
