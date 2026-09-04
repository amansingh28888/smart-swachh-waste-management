import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ROLE_PREFIXES: Record<string, "citizen" | "admin" | "worker"> = {
  "/citizen": "citizen",
  "/admin": "admin",
  "/worker": "worker",
};

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  const matchedPrefix = Object.keys(ROLE_PREFIXES).find((p) => path.startsWith(p));

  if (matchedPrefix) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", path);
      return NextResponse.redirect(url);
    }

    const requiredRole = ROLE_PREFIXES[matchedPrefix];
    const role = (user.user_metadata?.role as string) ?? "citizen";

    // The metadata role is a fast hint set at signup; pages still re-verify
    // against the `profiles` table (the source of truth) before rendering
    // anything sensitive, since metadata can lag a manual role change.
    if (role !== requiredRole) {
      const url = request.nextUrl.clone();
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/citizen/:path*",
    "/admin/:path*",
    "/worker/:path*",
  ],
};
