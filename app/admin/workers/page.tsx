import { Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireRole } from "@/lib/utils/auth";
import { createClient } from "@/lib/supabase/server";
import type { Worker, Profile } from "@/types";

export default async function AdminWorkersPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data } = await supabase.from("workers").select("*, profile:profiles(*)");
  const workers = (data ?? []) as (Worker & { profile: Profile })[];

  const availabilityTone = { available: "green", busy: "yellow", offline: "slate" } as const;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Workers</h1>
        <p className="mb-6 text-slate-500">Sanitation staff available for task assignment.</p>

        {workers.length === 0 ? (
          <EmptyState icon={Users} title="No workers found." description="Seed demo workers or add them via Supabase." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workers.map((w) => (
              <Card key={w.id}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{w.profile?.full_name}</p>
                  <Badge tone={availabilityTone[w.availability]}>{w.availability}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">Employee code: {w.employee_code}</p>
                <p className="mt-1 text-xs text-slate-500">Area: {w.assigned_area}</p>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
