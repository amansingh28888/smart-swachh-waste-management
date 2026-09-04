import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

type BadgeTone = "green" | "yellow" | "red" | "blue" | "slate" | "purple";

const tones: Record<BadgeTone, string> = {
  green: "bg-green-100 text-green-700",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  slate: "bg-slate-100 text-slate-700",
  purple: "bg-purple-100 text-purple-700",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "slate", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

export function statusTone(status: string): BadgeTone {
  switch (status) {
    case "pending":
      return "yellow";
    case "verified":
      return "blue";
    case "assigned":
      return "purple";
    case "in_progress":
      return "blue";
    case "completed":
      return "green";
    case "rejected":
      return "red";
    default:
      return "slate";
  }
}

export function severityTone(severity: string): BadgeTone {
  switch (severity) {
    case "High":
      return "red";
    case "Medium":
      return "yellow";
    case "Low":
      return "green";
    default:
      return "slate";
  }
}
