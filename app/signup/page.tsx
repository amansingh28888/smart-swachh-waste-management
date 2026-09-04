"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Recycle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Public signup is intentionally citizen-only. Admin and worker accounts
    // are provisioned by the municipality (see scripts/seed.ts / README).
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: "citizen" },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/login`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-soft">
          <h1 className="mb-2 text-lg font-semibold text-slate-900">Check your email</h1>
          <p className="mb-4 text-sm text-slate-600">
            We sent a confirmation link to <strong>{email}</strong>. Confirm it, then log in.
          </p>
          <Button className="w-full" onClick={() => router.push("/login")}>
            Go to login
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Recycle className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-bold text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-500">Join SmartSwachh as a citizen</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Full name</label>
            <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Priya Verma" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Email</label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Password</label>
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            Sign up
          </Button>
          <p className="text-center text-xs text-slate-400">
            Looking for an Admin or Worker account? These are provisioned by the municipality —
            see the README for demo credentials.
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
