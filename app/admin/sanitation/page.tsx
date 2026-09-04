import { MapPinned, Clock, PercentCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { requireRole } from "@/lib/utils/auth";
import { createClient } from "@/lib/supabase/server";
import type { WasteReport } from "@/types";

export default async function SanitationMonitoringPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("waste_reports").select("*");
  const reports = (data ?? []) as WasteReport[];

  // Group by area (parsed from "Ward X, City")
  const areaStats: Record<string, { total: number; resolved: number }> = {};
  reports.forEach((r) => {
    const area = r.location_text.split(",")[0]?.trim() ?? "Unknown";
    areaStats[area] ??= { total: 0, resolved: 0 };
    areaStats[area].total += 1;
    if (r.status === "completed") areaStats[area].resolved += 1;
  });

  const areaScores = Object.entries(areaStats)
    .map(([area, s]) => ({ area, score: s.total > 0 ? Math.round((s.resolved / s.total) * 100) : 0, total: s.total }))
    .sort((a, b) => b.score - a.score);

  // Most reported locations
  const locationCounts: Record<string, number> = {};
  reports.forEach((r) => {
    locationCounts[r.location_text] = (locationCounts[r.location_text] ?? 0) + 1;
  });
  const topLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Average resolution time (created_at -> updated_at for completed reports)
  const completed = reports.filter((r) => r.status === "completed");
  const avgResolutionHours =
    completed.length > 0
      ? Math.round(
          completed.reduce((sum, r) => sum + (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()), 0) /
            completed.length /
            (1000 * 60 * 60)
        )
      : 0;

  const cleaningRate = reports.length > 0 ? Math.round((completed.length / reports.length) * 100) : 0;

  function scoreTone(score: number) {
    if (score >= 80) return "text-brand-700 bg-brand-50";
    if (score >= 50) return "text-yellow-700 bg-yellow-50";
    return "text-red-700 bg-red-50";
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Sanitation Monitoring</h1>
        <p className="mb-6 text-slate-500">Area-level sanitation performance across the city.</p>

        <Card className="mb-6">
          <CardHeader><CardTitle>Area Sanitation Score</CardTitle></CardHeader>
          {areaScores.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Not enough data yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {areaScores.map((a) => (
                <div key={a.area} className={`rounded-xl p-4 ${scoreTone(a.score)}`}>
                  <p className="text-xs font-medium opacity-70">{a.area}</p>
                  <p className="text-2xl font-bold">{a.score}%</p>
                  <p className="text-[11px] opacity-60">{a.total} reports</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="grid gap-5 sm:grid-cols-3">
          <Card>
            <div className="mb-2 flex items-center gap-2 text-slate-500">
              <MapPinned className="h-4 w-4" /> <span className="text-xs font-medium">Most Reported Locations</span>
            </div>
            <ul className="space-y-1.5 text-sm text-slate-700">
              {topLocations.length === 0 ? (
                <li className="text-slate-400">No data yet.</li>
              ) : (
                topLocations.map(([loc, count]) => (
                  <li key={loc} className="flex justify-between">
                    <span>{loc}</span>
                    <span className="font-medium">{count}</span>
                  </li>
                ))
              )}
            </ul>
          </Card>

          <Card>
            <div className="mb-2 flex items-center gap-2 text-slate-500">
              <Clock className="h-4 w-4" /> <span className="text-xs font-medium">Avg. Resolution Time</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{avgResolutionHours}h</p>
          </Card>

          <Card>
            <div className="mb-2 flex items-center gap-2 text-slate-500">
              <PercentCircle className="h-4 w-4" /> <span className="text-xs font-medium">Cleaning Completion Rate</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{cleaningRate}%</p>
          </Card>
        </div>
      </main>
    </>
  );
}
