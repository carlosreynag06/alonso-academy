import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getParentAllowlistEmail } from "@/lib/env/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = "/parent";
  redirectTo.search = "";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    const email = data.user?.email?.toLowerCase();
    if (!error && email && email === getParentAllowlistEmail()) {
      return NextResponse.redirect(redirectTo);
    }
    await supabase.auth.signOut();
  }

  redirectTo.pathname = "/parent/login";
  redirectTo.searchParams.set("error", "invalid_link");
  return NextResponse.redirect(redirectTo);
}
