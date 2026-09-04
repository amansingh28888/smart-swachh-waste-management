import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { analyzeWaste } from "@/lib/ai/analyzeWaste";

const BodySchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.string().default("image/jpeg"),
  imageUrl: z.string().url(), // already-uploaded public URL, for saving alongside the result
});

/**
 * POST /api/ai/analyze-waste
 * Body: { imageBase64: string, mimeType?: string, imageUrl: string }
 *
 * Runs AI waste classification and persists it to `waste_identifications`.
 * Auth required — RLS still enforces `citizen_id = auth.uid()` on insert.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const body = BodySchema.parse(json);

    const result = await analyzeWaste(body.imageBase64, body.mimeType);

    const { data, error } = await supabase
      .from("waste_identifications")
      .insert({
        citizen_id: user.id,
        image_url: body.imageUrl,
        waste_name: result.wasteName,
        category: result.category,
        waste_type: result.type,
        recommended_bin: result.recommendedBin,
        disposal_method: result.disposalMethod,
        ai_response: result,
      })
      .select()
      .single();

    if (error) {
      console.error("[api/analyze-waste] db error:", error.message);
      return NextResponse.json({ error: "Failed to save result" }, { status: 500 });
    }

    return NextResponse.json({ result, record: data });
  } catch (err) {
    console.error("[api/analyze-waste]", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
