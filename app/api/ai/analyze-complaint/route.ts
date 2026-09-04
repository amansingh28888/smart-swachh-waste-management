import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyzeComplaint } from "@/lib/ai/analyzeComplaint";

const BodySchema = z.object({
  description: z.string().min(5, "Please describe the problem in a bit more detail."),
  imageBase64: z.string().optional(),
  mimeType: z.string().default("image/jpeg"),
  imageUrl: z.string().url().optional(),
  locationText: z.string().min(1),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  category: z.string().optional(),
});

/**
 * POST /api/ai/analyze-complaint
 *
 * Runs AI severity/priority analysis on a garbage report and persists the
 * full report (status = "pending") to `waste_reports`. Admin verification
 * happens separately from /admin/reports.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("[report] AUTH USER ID:", user?.id);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const body = BodySchema.parse(json);

    const result = await analyzeComplaint({
      description: body.description,
      imageBase64: body.imageBase64,
      mimeType: body.mimeType,
    });
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from("waste_reports")
      .insert({
        citizen_id: user.id,
        image_url: body.imageUrl ?? null,
        description: body.description,
        location_text: body.locationText,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        problem_type: result.problemType,
        waste_type: result.wasteType,
        category: body.category ?? "Sanitation",
        severity: result.severity,
        final_priority: result.severity,
        ai_analysis: result,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("[api/analyze-complaint] db error:", error.message);
      return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
    }

    // Notify admins of the new report (best-effort; failure here shouldn't
    // fail the citizen's submission).
    try {
      const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
      if (admins && admins.length > 0) {
        await supabase.from("notifications").insert(
          admins.map((a) => ({
            user_id: a.id,
            title: "New garbage report received",
            message: `A new ${result.severity.toLowerCase()}-priority report was submitted: ${result.problemType}.`,
            type: "report" as const,
          }))
        );
      }
    } catch (notifyErr) {
      console.warn("[api/analyze-complaint] notification failed:", notifyErr);
    }

    return NextResponse.json({ result, record: data });
  } catch (err) {
    console.error("[api/analyze-complaint]", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
