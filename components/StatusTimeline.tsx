import { CheckCircle2, Circle } from "lucide-react";
import type { ReportStatus } from "@/types";
import { cn } from "@/lib/utils/cn";

const STEPS: { key: ReportStatus | "ai_analyzed"; label: string }[] = [
  { key: "pending", label: "Submitted" },
  { key: "ai_analyzed", label: "AI Analyzed" },
  { key: "verified", label: "Verified" },
  { key: "assigned", label: "Worker Assigned" },
  { key: "in_progress", label: "Cleaning In Progress" },
  { key: "completed", label: "Resolved" },
];

const ORDER: (ReportStatus | "ai_analyzed")[] = [
  "pending",
  "ai_analyzed",
  "verified",
  "assigned",
  "in_progress",
  "completed",
];

export function StatusTimeline({ status }: { status: ReportStatus }) {
  if (status === "rejected") {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <Circle className="h-4 w-4 fill-red-100" /> This report was reviewed and rejected by the
        municipality.
      </div>
    );
  }

  // "pending" reports have always already been through AI analysis by the
  // time they're saved, so visually mark that step done too.
  const currentIndex = ORDER.indexOf(status === "pending" ? "ai_analyzed" : status);

  return (
    <ol className="flex flex-wrap gap-x-1 gap-y-3">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        return (
          <li key={step.key} className="flex items-center">
            <div className="flex items-center gap-1.5">
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-brand-600" />
              ) : (
                <Circle className="h-4 w-4 text-slate-300" />
              )}
              <span className={cn("text-xs font-medium", done ? "text-slate-900" : "text-slate-400")}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="mx-2 h-px w-4 bg-slate-200 sm:w-8" />}
          </li>
        );
      })}
    </ol>
  );
}
