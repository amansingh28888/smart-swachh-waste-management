import Link from "next/link";
import { Camera, ClipboardList, Clock, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge, statusTone, severityTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireRole } from "@/lib/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, statusLabel } from "@/lib/utils/format";
import type { WasteReport } from "@/types";

export default async function CitizenDashboard() {
  const profile = await requireRole("citizen");
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("waste_reports")
    .select("*")
    .eq("citizen_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const allReports = (reports ?? []) as WasteReport[];
  const total = allReports.length;
  const pending = allReports.filter((r) => r.status === "pending" || r.status === "verified").length;
  const inProgress = allReports.filter((r) => r.status === "assigned" || r.status === "in_progress").length;
  const resolved = allReports.filter((r) => r.status === "completed").length;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Hi {profile.full_name.split(" ")[0]} 👋</h1>
        <p className="text-slate-500">Here&apos;s what&apos;s happening with your reports.</p>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={ClipboardList} label="Total Reports" value={total} />
          <StatCard icon={Clock} label="Pending" value={pending} />
          <StatCard icon={Loader2} label="In Progress" value={inProgress} />
          <StatCard icon={CheckCircle2} label="Resolved" value={resolved} />
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Card className="flex flex-col justify-between">
            <div>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Camera className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Identify Waste</h3>
              <p className="mt-1 text-sm text-slate-600">
                Upload a waste photo and find the correct segregation and disposal method.
              </p>
            </div>
            <Link
              href="/citizen/identify"
              className="mt-4 inline-flex w-fit rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Analyze Waste
            </Link>
          </Card>

          <Card className="flex flex-col justify-between">
            <div>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <ClipboardList className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Report Garbage</h3>
              <p className="mt-1 text-sm text-slate-600">
                Report garbage accumulation or sanitation problems in your area.
              </p>
            </div>
            <Link
              href="/citizen/report"
              className="mt-4 inline-flex w-fit rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              Report Problem
            </Link>
          </Card>
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Reports</h2>
            <Link href="/citizen/reports" className="text-sm font-medium text-brand-700 hover:underline">
              View all
            </Link>
          </div>

          {allReports.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No reports found."
              description="Report a garbage or sanitation problem to see it tracked here."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allReports.map((r) => (
                <Card key={r.id}>
                  {r.image_url && (
                    <img src={r.image_url} alt="" className="mb-3 h-32 w-full rounded-xl object-cover" />
                  )}
                  <p className="text-sm font-semibold text-slate-900">{r.problem_type ?? "Sanitation Report"}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" /> {r.location_text}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.severity && <Badge tone={severityTone(r.severity)}>{r.severity} priority</Badge>}
                    <Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">{formatDate(r.created_at)}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Camera; label: string; value: number }) {
  return (
    <Card className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </Card>
  );
}
