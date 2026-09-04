import Link from "next/link";
import { ClipboardList, Clock, Loader2, CheckCircle2, MapPin } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge, severityTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireRole } from "@/lib/utils/auth";
import { createClient } from "@/lib/supabase/server";
import type { Task, WasteReport, Worker } from "@/types";

export default async function WorkerDashboard() {
  const profile = await requireRole("worker");
  const supabase = await createClient();

  const { data: workerRow } = await supabase.from("workers").select("*").eq("profile_id", profile.id).single();
  const worker = workerRow as Worker | null;

  const { data } = worker
    ? await supabase
        .from("tasks")
        .select("*, report:waste_reports(*)")
        .eq("worker_id", worker.id)
        .order("assigned_at", { ascending: false })
    : { data: [] };

  const tasks = (data ?? []) as (Task & { report: WasteReport })[];

  const assigned = tasks.filter((t) => t.status === "assigned").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress" || t.status === "accepted").length;
  const completed = tasks.filter((t) => t.status === "completed").length;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
        <p className="mb-6 text-slate-500">
          {worker ? `Assigned area: ${worker.assigned_area}` : "No worker profile found for this account."}
        </p>

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={ClipboardList} label="Assigned Tasks" value={tasks.length} />
          <StatCard icon={Clock} label="Pending" value={assigned} />
          <StatCard icon={Loader2} label="In Progress" value={inProgress} />
          <StatCard icon={CheckCircle2} label="Completed" value={completed} />
        </div>

        {tasks.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No tasks assigned yet." description="New tasks will appear here as soon as admin assigns them to you." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tasks.map((t) => (
              <Link key={t.id} href={`/worker/tasks/${t.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{t.report?.problem_type ?? "Sanitation Task"}</h3>
                    <Badge tone={severityTone(t.priority)}>{t.priority}</Badge>
                  </div>
                  <p className="mb-2 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" /> {t.report?.location_text}
                  </p>
                  <p className="line-clamp-2 text-sm text-slate-600">{t.report?.description}</p>
                  <div className="mt-3">
                    <Badge tone={t.status === "completed" ? "green" : t.status === "assigned" ? "purple" : "blue"}>
                      {t.status.replace("_", " ")}
                    </Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof ClipboardList; label: string; value: number }) {
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
