import "server-only";

import { getParentAllowlistEmail } from "@/lib/env/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type ParentAccessState =
  | { status: "configuration_required" }
  | { status: "signed_out" }
  | { status: "forbidden" }
  | { status: "ready"; email: string; displayName: string };

export async function getParentAccessState(): Promise<ParentAccessState> {
  const allowedEmail = getParentAllowlistEmail();
  if (!getSupabasePublicConfig() || !allowedEmail) {
    return { status: "configuration_required" };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email?.toString().trim().toLowerCase();

  if (!email) return { status: "signed_out" };
  if (email !== allowedEmail) return { status: "forbidden" };

  const { data: allowlisted } = await supabase
    .from("parent_allowlist")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (!allowlisted) return { status: "forbidden" };

  const { data: profile, error } = await supabase.rpc("ensure_parent_profile");
  if (error || !profile) return { status: "forbidden" };

  return {
    status: "ready",
    email,
    displayName: profile.display_name,
  };
}
