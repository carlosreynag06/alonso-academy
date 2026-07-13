import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { refreshSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const fixtureCookie = request.cookies.get("alonso_dev_fixture_session")?.value;
  const fixtureEnabled = process.env.NODE_ENV === "development" && process.env.ALONSO_ENABLE_DEV_FIXTURES?.trim().toLowerCase() === "true";
  const loopback = ["localhost", "127.0.0.1", "::1"].includes(request.nextUrl.hostname.toLowerCase());
  if (fixtureEnabled && loopback && fixtureCookie && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(fixtureCookie)) {
    return NextResponse.next();
  }
  return refreshSupabaseSession(request);
}

export const config = {
  matcher: ["/", "/login", "/parent/:path*", "/alonso/:path*", "/api/child/:path*", "/auth/:path*"],
};
