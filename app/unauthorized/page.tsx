import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center">
      <ShieldAlert className="h-10 w-10 text-red-500" />
      <h1 className="text-xl font-bold text-slate-900">You don&apos;t have access to this page</h1>
      <p className="max-w-sm text-sm text-slate-500">
        This area is restricted to a different role. If you think this is a mistake, contact your
        municipality administrator.
      </p>
      <Link href="/" className="mt-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
        Back to home
      </Link>
    </main>
  );
}
