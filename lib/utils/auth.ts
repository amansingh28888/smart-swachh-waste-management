import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";
import { redirect } from "next/navigation";

/**
 * Fetches the current authenticated user's profile row (source of truth for
 * role — not just the auth metadata, which middleware uses only as a fast
 * first pass). Redirects to /login if unauthenticated.
 */
export async function requireProfile(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (!profile) redirect("/login");

  return profile as Profile;
}

export async function requireRole(role: "citizen" | "admin" | "worker"): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== role) redirect("/unauthorized");
  return profile;
}
