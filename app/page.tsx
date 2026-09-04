import Link from "next/link";
import { Recycle, Camera, ClipboardList, Truck, Sparkles, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 py-20 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            <Sparkles className="h-3.5 w-3.5" /> AI-Powered Civic Tech
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Smart Waste Management for Cleaner Communities
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            AI-powered waste segregation, responsible disposal, and sanitation monitoring in one
            platform.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/citizen/report"
              className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-soft hover:bg-brand-700"
            >
              Report Waste
            </Link>
            <Link
              href="/citizen/identify"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Identify Waste
            </Link>
          </div>
        </section>

        {/* Flow */}
        <section className="border-y border-slate-200 bg-white py-12">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-4 px-6 text-center">
            {["Segregate", "Collect", "Dispose", "Clean"].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                    <Recycle className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{step}</span>
                </div>
                {i < arr.length - 1 && <span className="text-2xl text-slate-300">→</span>}
              </div>
            ))}
          </div>
        </section>

        {/* Feature cards */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={Camera}
              title="AI Waste Identification"
              description="Snap a photo and instantly learn the right bin, category, and disposal method for any item."
            />
            <FeatureCard
              icon={ClipboardList}
              title="One-Tap Reporting"
              description="Report garbage accumulation or sanitation issues with photo, location, and AI-assessed priority."
            />
            <FeatureCard
              icon={Truck}
              title="Worker Task Tracking"
              description="Municipal workers get assigned tasks with before/after proof and disposal-method logging."
            />
          </div>
        </section>

        {/* Trust note */}
        <section className="mx-auto max-w-3xl px-6 pb-20 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="h-4 w-4 text-brand-600" />
            AI-generated classification is a recommendation. Final action may be verified by
            municipal staff.
          </div>
        </section>
      </main>
    </>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Camera;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-1.5 text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  );
}
