"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      title="Sign out"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
