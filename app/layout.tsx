import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartSwachh — Segregate. Collect. Dispose. Clean.",
  description:
    "AI-powered waste segregation, responsible disposal, and sanitation monitoring in one platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900">{children}</body>
    </html>
  );
}
