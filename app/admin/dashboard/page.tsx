import { ClipboardList, AlertTriangle, Loader2, CheckCircle2, Users, Clock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { requireRole } from "@/lib/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { AreaBarChart } from "@/components/charts/AreaBarChart";
import { MonthlyLineChart } from "@/components/charts/MonthlyLineChart";
import type { WasteReport, Worker } from "@/types";

export default async function AdminDashboard() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: reportsData } = await supabase.from("waste_reports").select("*");
  const { data: workersData } = await supabase.from("workers").select("*");

  const reports = (reportsData ?? []) as WasteReport[];
  const workers = (workersData ?? []) as Worker[];

  const total = reports.length;
  const pending = reports.filter((r) => r.status === "pending").length;
  const highPriority = reports.filter((r) => r.severity === "High" && r.status !== "completed").length;
  const inProgress = reports.filter((r) => r.status === "assigned" || r.status === "in_progress").length;
  const resolved = reports.filter((r) => r.status === "completed").length;
  const activeWorkers = workers.filter((w) => w.availability !== "offline").length;

  // Category distribution
  const categoryCounts: Record<string, number> = {};
  reports.forEach((r) => {
    const key = r.waste_type ?? "Unspecified";
    categoryCounts[key] = (categoryCounts[key] ?? 0) + 1;
  });
  const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

  // Reports by area (parsed from "Ward X, City")
  const areaCounts: Record<string, number> = {};
  reports.forEach((r) => {
    const area = r.location_text.split(",").pop()?.trim() ?? "Unknown";
    areaCounts[area] = (areaCounts[area] ?? 0) + 1;
  });
  const areaData = Object.entries(areaCounts).map(([name, value]) => ({ name, value }));

  // Reports by status
  const statusCounts: Record<string, number> = {};
  reports.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
  });
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.replace("_", " "),
    value,
  }));

  // Monthly trend (last 6 months)
  const monthlyMap: Record<string, number> = {};
  reports.forEach((r) => {
    const d = new Date(r.created_at);
    const key = d.toLocaleString("en-IN", { month: "short" });
    monthlyMap[key] = (monthlyMap[key] ?? 0) + 1;
  });
  const monthlyData = Object.entries(monthlyMap).map(([month, reports]) => ({ month, reports }));

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mb-6 text-slate-500">City-wide sanitation overview.</p>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={ClipboardList} label="Total Reports" value={total} />
          <StatCard icon={Clock} label="Pending" value={pending} />
          <StatCard icon={AlertTriangle} label="High Priority" value={highPriority} tone="red" />
          <StatCard icon={Loader2} label="In Progress" value={inProgress} />
          <StatCard icon={CheckCircle2} label="Resolved" value={resolved} tone="green" />
          <StatCard icon={Users} label="Active Workers" value={activeWorkers} />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Waste Category Distribution</CardTitle></CardHeader>
            {categoryData.length > 0 ? <CategoryPieChart data={categoryData} /> : <NoData />}
          </Card>
          <Card>
            <CardHeader><CardTitle>Reports by Area</CardTitle></CardHeader>
            {areaData.length > 0 ? <AreaBarChart data={areaData} /> : <NoData />}
          </Card>
          <Card>
            <CardHeader><CardTitle>Reports by Status</CardTitle></CardHeader>
            {statusData.length > 0 ? <AreaBarChart data={statusData} /> : <NoData />}
          </Card>
          <Card>
            <CardHeader><CardTitle>Monthly Reports</CardTitle></CardHeader>
            {monthlyData.length > 0 ? <MonthlyLineChart data={monthlyData} /> : <NoData />}
          </Card>
        </div>

        <Card className="mt-5">
          <CardHeader><CardTitle>Sanitation Performance</CardTitle></CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${resolutionRate}%` }} />
            </div>
            <span className="text-sm font-semibold text-slate-900">{resolutionRate}% resolved</span>
          </div>
        </Card>
      </main>
    </>
  );
}

function NoData() {
  return <p className="py-12 text-center text-sm text-slate-400">Not enough data yet.</p>;
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "slate",
}: {
  icon: typeof ClipboardList;
  label: string;
  value: number;
  tone?: "slate" | "red" | "green";
}) {
  const toneClasses = {
    slate: "bg-slate-100 text-slate-600",
    red: "bg-red-100 text-red-600",
    green: "bg-green-100 text-green-600",
  }[tone];

  return (
    <Card className="flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </Card>
  );
}
