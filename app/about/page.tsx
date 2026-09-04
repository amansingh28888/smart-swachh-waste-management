import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/Card";
import { Users, ShieldCheck, Truck, Sparkles } from "lucide-react";

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-14">
        <h1 className="text-3xl font-bold text-slate-900">About SmartSwachh</h1>
        <p className="mt-2 text-slate-600">Segregate. Collect. Dispose. Clean.</p>

        <div className="mt-10 space-y-6">
          <Section title="The Problem">
            Indian cities generate enormous volumes of mixed, unsegregated waste every day.
            Citizens often don&apos;t know how to sort what they throw away, garbage complaints get
            lost between departments, and municipalities lack real-time visibility into which
            areas need attention most.
          </Section>

          <Section title="The Solution">
            SmartSwachh connects citizens, an AI classification system, municipal admins, and
            sanitation workers on one platform — from the moment a citizen photographs a piece of
            waste or a garbage pile, through AI analysis, admin verification and worker
            assignment, to final disposal and resolution.
          </Section>

          <div className="grid gap-4 sm:grid-cols-2">
            <RoleCard icon={Sparkles} title="How AI Helps">
              AI reads a photo and description to suggest the waste category, correct bin,
              disposal method, and — for complaints — a severity level and recommended action. It
              never has final authority: humans verify and can override every AI suggestion.
            </RoleCard>
            <RoleCard icon={Users} title="Citizen Role">
              Identify waste before throwing it away, or report a sanitation problem in the
              neighborhood with a photo and location, then track its status through to
              resolution.
            </RoleCard>
            <RoleCard icon={ShieldCheck} title="Admin Role">
              Municipal staff verify AI-flagged reports, adjust priority, assign the right worker,
              and monitor sanitation performance and disposal statistics across every ward.
            </RoleCard>
            <RoleCard icon={Truck} title="Worker Role">
              Sanitation workers see assigned tasks with location and problem details, then log
              before/after photos and the disposal method used to close out each task.
            </RoleCard>
          </div>
        </div>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h2 className="mb-2 text-lg font-semibold text-slate-900">{title}</h2>
      <p className="text-sm leading-relaxed text-slate-600">{children}</p>
    </Card>
  );
}

function RoleCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Users;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-1.5 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600">{children}</p>
    </Card>
  );
}
