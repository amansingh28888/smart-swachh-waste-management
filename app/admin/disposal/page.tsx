import { Recycle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireRole } from "@/lib/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";
import type { Task, WasteReport, Worker, Profile } from "@/types";

const METHODS = ["Recycling", "Composting", "Landfill", "Hazardous Treatment", "Other"] as const;

export default async function DisposalTrackingPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data } = await supabase
    .from("tasks")
    .select("*, report:waste_reports(*), worker:workers(*, profile:profiles(*))")
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  const tasks = (data ?? []) as (Task & { report: WasteReport; worker: Worker & { profile: Profile } })[];

  const counts: Record<string, number> = {};
  tasks.forEach((t) => {
    if (t.disposal_method) counts[t.disposal_method] = (counts[t.disposal_method] ?? 0) + 1;
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Disposal Tracking</h1>
        <p className="mb-6 text-slate-500">How completed tasks were disposed of, city-wide.</p>

        <Card className="mb-6">
          <CardHeader><CardTitle>Disposal Method Breakdown</CardTitle></CardHeader>
          {total === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No completed tasks yet.</p>
          ) : (
            <div className="space-y-3">
              {METHODS.map((m) => {
                const pct = total > 0 ? Math.round(((counts[m] ?? 0) / total) * 100) : 0;
                return (
                  <div key={m}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium text-slate-700">{m}</span>
                      <span className="text-slate-500">{pct}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Disposal Records</CardTitle></CardHeader>
          {tasks.length === 0 ? (
            <EmptyState icon={Recycle} title="No disposal records yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="py-2 pr-4">Waste Type</th>
                    <th className="py-2 pr-4">Disposal Method</th>
                    <th className="py-2 pr-4">Worker</th>
                    <th className="py-2 pr-4">Location</th>
                    <th className="py-2 pr-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-4">{t.report?.waste_type ?? "—"}</td>
                      <td className="py-2 pr-4">{t.disposal_method}</td>
                      <td className="py-2 pr-4">{t.worker?.profile?.full_name ?? "—"}</td>
                      <td className="py-2 pr-4">{t.report?.location_text}</td>
                      <td className="py-2 pr-4 text-slate-500">{t.completed_at ? formatDate(t.completed_at) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
