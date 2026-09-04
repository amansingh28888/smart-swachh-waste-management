import { GoogleGenerativeAI } from "@google/generative-ai";

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY;

  if (!key) return null;

  if (!client) {
    client = new GoogleGenerativeAI(key);
  }

  return client;
}

export function isAIAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

interface GenerateOptions {
  prompt: string;
  imageBase64?: string;
  imageMimeType?: string;
}

export async function generateContent({
  prompt,
  imageBase64,
  imageMimeType = "image/jpeg",
}: GenerateOptions): Promise<string> {
  const genAI = getClient();

  if (!genAI) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
  });

  const parts: any[] = [
    {
      text: prompt,
    },
  ];

  if (imageBase64) {
    parts.push({
      inlineData: {
        data: imageBase64,
        mimeType: imageMimeType,
      },
    });
  }

  const result = await model.generateContent(parts);

  return result.response.text();
}

export function extractJson(raw: string): string {
  return raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}