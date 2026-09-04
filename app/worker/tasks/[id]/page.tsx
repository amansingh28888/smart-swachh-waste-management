"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapPin, ShieldCheck, PlayCircle, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, severityTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Skeleton } from "@/components/ui/Skeleton";
import { ImageUploader } from "@/components/ImageUploader";
import { createClient } from "@/lib/supabase/client";
import type { Task, WasteReport, DisposalMethod } from "@/types";

const DISPOSAL_OPTIONS: DisposalMethod[] = ["Recycling", "Composting", "Landfill", "Hazardous Treatment", "Other"];

export default function WorkerTaskDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [task, setTask] = useState<(Task & { report: WasteReport }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [disposal, setDisposal] = useState<DisposalMethod>("Recycling");
  const [notes, setNotes] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("tasks")
      .select("*, report:waste_reports(*)")
      .eq("id", params.id)
      .single();
    if (data) {
      setTask(data as any);
      setBeforeUrl(data.before_image_url);
      setAfterUrl(data.after_image_url);
      if (data.disposal_method) setDisposal(data.disposal_method);
      if (data.notes) setNotes(data.notes);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function startTask() {
    setBusy(true);
    await supabase
      .from("tasks")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", params.id);
    await supabase.from("waste_reports").update({ status: "in_progress" }).eq("id", task!.report_id);
    await load();
    setBusy(false);
  }

  async function completeTask() {
    if (!task) return;
    setBusy(true);

    await supabase
      .from("tasks")
      .update({
        status: "completed",
        before_image_url: beforeUrl,
        after_image_url: afterUrl,
        disposal_method: disposal,
        notes,
        completed_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    await supabase.from("waste_reports").update({ status: "completed" }).eq("id", task.report_id);

    await supabase.from("notifications").insert([
      {
        user_id: task.report.citizen_id,
        title: "Your report has been resolved",
        message: "✅ Your sanitation complaint has been resolved.",
        type: "report",
      },
    ]);
    const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
    if (admins && admins.length > 0) {
      await supabase.from("notifications").insert(
        admins.map((a) => ({
          user_id: a.id,
          title: "Task completed",
          message: `A ${task.priority.toLowerCase()}-priority task at ${task.report.location_text} was completed.`,
          type: "task" as const,
        }))
      );
    }

    await load();
    setBusy(false);
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Skeleton className="h-64" />
        </main>
      </>
    );
  }

  if (!task) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6">Task not found.</main>
      </>
    );
  }

  const report = task.report;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <button onClick={() => router.push("/worker/dashboard")} className="mb-4 text-sm text-slate-500 hover:underline">
          ← Back to my tasks
        </button>

        <Card className="mb-5">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-slate-900">{report.problem_type ?? "Sanitation Task"}</h1>
            <Badge tone={severityTone(task.priority)}>{task.priority} priority</Badge>
          </div>
          {report.image_url && <img src={report.image_url} alt="" className="mb-3 h-52 w-full rounded-xl object-cover" />}
          <p className="mb-2 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="h-4 w-4" /> {report.location_text}
          </p>
          <p className="text-sm text-slate-700">{report.description}</p>

          {report.ai_analysis && (
            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
              <p className="mb-1 text-xs font-medium text-slate-400">AI Recommendation</p>
              <p className="text-slate-700">{report.ai_analysis.recommendedAction}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                Recommendation only — verify conditions on site.
              </div>
            </div>
          )}
        </Card>

        {task.status === "assigned" && (
          <Button className="w-full" loading={busy} onClick={startTask}>
            <PlayCircle className="h-4 w-4" /> Start Task
          </Button>
        )}

        {(task.status === "in_progress" || task.status === "accepted") && (
          <div className="space-y-5">
            <Card>
              <CardHeader><CardTitle>Before Cleaning</CardTitle></CardHeader>
              <ImageUploader bucket="task-images" label="Upload a before photo" onUploaded={(url) => setBeforeUrl(url)} />
            </Card>

            <Card>
              <CardHeader><CardTitle>After Cleaning</CardTitle></CardHeader>
              <ImageUploader bucket="task-images" label="Upload an after photo" onUploaded={(url) => setAfterUrl(url)} />
            </Card>

            <Card className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Disposal Method</label>
                <Select value={disposal} onChange={(e) => setDisposal(e.target.value as DisposalMethod)}>
                  {DISPOSAL_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes (optional)</label>
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any relevant notes about this cleanup..." />
              </div>
            </Card>

            <Button className="w-full" loading={busy} disabled={!beforeUrl || !afterUrl} onClick={completeTask}>
              <CheckCircle2 className="h-4 w-4" /> Complete Task
            </Button>
            {(!beforeUrl || !afterUrl) && (
              <p className="text-center text-xs text-slate-400">Upload both before and after photos to complete this task.</p>
            )}
          </div>
        )}

        {task.status === "completed" && (
          <Card className="text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-brand-600" />
            <p className="font-semibold text-slate-900">Task completed</p>
            <p className="text-sm text-slate-500">Disposal method: {task.disposal_method}</p>
          </Card>
        )}
      </main>
    </>
  );
}
