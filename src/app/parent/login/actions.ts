"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getParentAllowlistEmail } from "@/lib/env/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function requestMagicLink(formData: FormData) {
  const configuredEmail = getParentAllowlistEmail();
  const submittedEmail = formData.get("email")?.toString().trim().toLowerCase();

  if (!getSupabasePublicConfig() || !configuredEmail) redirect("/parent?setup=required");
  if (!submittedEmail || submittedEmail !== configuredEmail) redirect("/parent/login?sent=1");

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: submittedEmail,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) redirect("/parent/login?error=unavailable");
  redirect("/parent/login?sent=1");
}

export async function signOutParent() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
