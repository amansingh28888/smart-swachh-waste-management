"use client";

import Link from "next/link";
import { Recycle } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { SignOutButton } from "@/components/SignOutButton";

const NAV_LINKS: Record<string, { href: string; label: string }[]> = {
  citizen: [
    { href: "/citizen/dashboard", label: "Dashboard" },
    { href: "/citizen/identify", label: "Identify Waste" },
    { href: "/citizen/report", label: "Report Garbage" },
    { href: "/citizen/reports", label: "My Reports" },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/workers", label: "Workers" },
    { href: "/admin/sanitation", label: "Sanitation" },
    { href: "/admin/disposal", label: "Disposal" },
  ],
  worker: [{ href: "/worker/dashboard", label: "My Tasks" }],
};

export function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Recycle className="h-5 w-5" />
          </span>

          <span className="text-lg font-bold text-slate-900">
            SmartSwachh
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-600 hover:text-brand-700"
          >
            Log in
          </Link>

          <Link
            href="/signup"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}