"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapPin, User, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, statusTone, severityTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, statusLabel } from "@/lib/utils/format";
import type { WasteReport, Worker, Profile, Severity } from "@/types";

export default function AdminReportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [report, setReport] = useState<WasteReport | null>(null);
  const [citizen, setCitizen] = useState<Profile | null>(null);
  const [workers, setWorkers] = useState<(Worker & { profile: Profile })[]>([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [priority, setPriority] = useState<Severity>("Medium");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  async function load() {
    setLoading(true);
    const { data: r } = await supabase.from("waste_reports").select("*").eq("id", params.id).single();
    if (r) {
      setReport(r as WasteReport);
      setPriority((r.final_priority ?? r.severity ?? "Medium") as Severity);
      const { data: c } = await supabase.from("profiles").select("*").eq("id", r.citizen_id).single();
      setCitizen(c as Profile);
    }
    const { data: w } = await supabase
      .from("workers")
      .select("*, profile:profiles(*)")
      .eq("availability", "available");
    setWorkers((w ?? []) as any);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function verify() {
    setBusy(true);
    await supabase.from("waste_reports").update({ status: "verified" }).eq("id", params.id);
    await load();
    setBusy(false);
  }

  async function reject() {
    setBusy(true);
    await supabase.from("waste_reports").update({ status: "rejected" }).eq("id", params.id);
    await load();
    setBusy(false);
  }

  async function changePriority(newPriority: Severity) {
    setPriority(newPriority);
    await supabase.from("waste_reports").update({ final_priority: newPriority }).eq("id", params.id);
  }

  async function assignWorker() {
    if (!selectedWorker || !report) return;
    setBusy(true);

    await supabase.from("tasks").insert({
      report_id: report.id,
      worker_id: selectedWorker,
      task_type: "Collection",
      priority,
    });
    await supabase.from("waste_reports").update({ status: "assigned" }).eq("id", report.id);

    const worker = workers.find((w) => w.id === selectedWorker);
    if (worker) {
      await supabase.from("notifications").insert({
        user_id: worker.profile_id,
        title: "New task assigned",
        message: `You've been assigned a ${priority.toLowerCase()}-priority task: ${report.problem_type ?? "Sanitation Report"} at ${report.location_text}.`,
        type: "task",
      });
      await supabase.from("notifications").insert({
        user_id: report.citizen_id,
        title: "Your report has been assigned",
        message: "Your report has been assigned to a sanitation worker.",
        type: "report",
      });
    }

    await load();
    setShowAssign(false);
    setBusy(false);
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <Skeleton className="h-64" />
        </main>
      </>
    );
  }

  if (!report) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-10 text-center sm:px-6">Report not found.</main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <button onClick={() => router.push("/admin/reports")} className="mb-4 text-sm text-slate-500 hover:underline">
          ← Back to reports
        </button>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{report.problem_type ?? "Sanitation Report"}</CardTitle>
                <Badge tone={statusTone(report.status)}>{statusLabel(report.status)}</Badge>
              </CardHeader>
              {report.image_url && (
                <img src={report.image_url} alt="" className="mb-4 h-56 w-full rounded-xl object-cover" />
              )}
              <p className="mb-3 flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin className="h-4 w-4" /> {report.location_text}
              </p>
              <p className="text-sm text-slate-700">{report.description}</p>
              <p className="mt-3 text-xs text-slate-400">Submitted {formatDateTime(report.created_at)}</p>
            </Card>

            {citizen && (
              <Card>
                <CardHeader><CardTitle>Citizen Information</CardTitle></CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{citizen.full_name}</p>
                    <p className="text-xs text-slate-500">{citizen.email}</p>
                  </div>
                </div>
              </Card>
            )}

            {report.ai_analysis && (
              <Card>
                <CardHeader><CardTitle>AI Analysis</CardTitle></CardHeader>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-400">Waste Type</dt>
                    <dd className="font-medium text-slate-900">{report.ai_analysis.wasteType}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">AI Severity</dt>
                    <dd><Badge tone={severityTone(report.ai_analysis.severity)}>{report.ai_analysis.severity}</Badge></dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-400">Recommended Action</dt>
                    <dd className="font-medium text-slate-900">{report.ai_analysis.recommendedAction}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-400">Reason</dt>
                    <dd className="text-slate-600">{report.ai_analysis.reason}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-brand-600" />
                  AI-generated classification is a recommendation. Final action may be verified by
                  municipal staff.
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader><CardTitle>Final Priority</CardTitle></CardHeader>
              <Select value={priority} onChange={(e) => changePriority(e.target.value as Severity)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </Select>
              <p className="mt-2 text-xs text-slate-400">
                Overriding stores both the AI priority and your final priority for auditability.
              </p>
            </Card>

            <Card className="space-y-2">
              <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
              {report.status === "pending" && (
                <Button className="w-full" loading={busy} onClick={verify}>
                  <CheckCircle2 className="h-4 w-4" /> Verify
                </Button>
              )}
              {report.status !== "rejected" && report.status !== "completed" && (
                <Button className="w-full" variant="danger" loading={busy} onClick={reject}>
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
              )}
              {["pending", "verified"].includes(report.status) && (
                <Button className="w-full" variant="outline" onClick={() => setShowAssign((s) => !s)}>
                  Assign Worker
                </Button>
              )}

              {showAssign && (
                <div className="mt-2 space-y-2 rounded-xl border border-slate-200 p-3">
                  <Select value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)}>
                    <option value="">Select an available worker...</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.profile?.full_name} — {w.assigned_area}
                      </option>
                    ))}
                  </Select>
                  <Button className="w-full" size="sm" loading={busy} disabled={!selectedWorker} onClick={assignWorker}>
                    Confirm Assignment
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
