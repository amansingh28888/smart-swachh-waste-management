import { ClipboardList, MapPin } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge, severityTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusTimeline } from "@/components/StatusTimeline";
import { requireRole } from "@/lib/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";
import type { WasteReport } from "@/types";

export default async function CitizenReportsPage() {
  const profile = await requireRole("citizen");
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("waste_reports")
    .select("*")
    .eq("citizen_id", profile.id)
    .order("created_at", { ascending: false });

  const allReports = (reports ?? []) as WasteReport[];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">My Reports</h1>
        <p className="mb-6 text-slate-500">Track every report you&apos;ve submitted from start to resolution.</p>

        {allReports.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No reports found."
            description="Report a garbage or sanitation problem to see it tracked here."
          />
        ) : (
          <div className="space-y-4">
            {allReports.map((r) => (
              <Card key={r.id}>
                <div className="flex flex-col gap-4 sm:flex-row">
                  {r.image_url && (
                    <img src={r.image_url} alt="" className="h-28 w-full rounded-xl object-cover sm:w-40" />
                  )}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold text-slate-900">{r.problem_type ?? "Sanitation Report"}</h3>
                      <div className="flex gap-1.5">
                        {r.severity && <Badge tone={severityTone(r.severity)}>{r.severity} priority</Badge>}
                      </div>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" /> {r.location_text} · {formatDate(r.created_at)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{r.description}</p>
                    <div className="mt-4">
                      <StatusTimeline status={r.status} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
