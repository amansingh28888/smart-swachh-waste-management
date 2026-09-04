"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Search } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge, statusTone, severityTone } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { formatDate, statusLabel } from "@/lib/utils/format";
import type { WasteReport } from "@/types";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase.from("waste_reports").select("*").order("created_at", { ascending: false });
      setReports((data ?? []) as WasteReport[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = reports.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (priorityFilter !== "all" && r.severity !== priorityFilter) return false;
    if (search && !`${r.problem_type} ${r.location_text} ${r.description}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="mb-6 text-slate-500">Review, verify, and assign incoming sanitation reports.</p>

        <Card className="mb-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="relative sm:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </Select>
            <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="all">All priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </Select>
          </div>
        </Card>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No reports found." description="Try adjusting your filters." />
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Report</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">AI Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{r.problem_type ?? "Sanitation Report"}</td>
                    <td className="px-4 py-3 text-slate-600">{r.location_text}</td>
                    <td className="px-4 py-3 text-slate-600">{r.waste_type ?? "—"}</td>
                    <td className="px-4 py-3">{r.severity && <Badge tone={severityTone(r.severity)}>{r.severity}</Badge>}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge></td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/reports/${r.id}`} className="font-medium text-brand-700 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </main>
    </>
  );
}
