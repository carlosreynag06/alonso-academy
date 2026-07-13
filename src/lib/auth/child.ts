import "server-only";

import { getChildLoginEmail } from "@/lib/env/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getDevelopmentFixtureSource } from "@/lib/development-fixtures/source";

export type ChildAccessState =
  | { status: "configuration_required" }
  | { status: "signed_out" }
  | { status: "forbidden" }
  | { status: "ready"; email: string; displayName: "Alonso"; fixture?: true };

export async function getChildAccessState(): Promise<ChildAccessState> {
  const fixture = await getDevelopmentFixtureSource();
  if (fixture) {
    return fixture.role === "child"
      ? { status: "ready", email: "alonso@fixture.invalid", displayName: "Alonso", fixture: true }
      : { status: "forbidden" };
  }
  const childEmail = getChildLoginEmail();
  if (!getSupabasePublicConfig() || !childEmail) return { status: "configuration_required" };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email?.toString().trim().toLowerCase();
  if (!email) return { status: "signed_out" };
  if (email !== childEmail) return { status: "forbidden" };
  const { data: profile, error } = await supabase.rpc("get_current_child_profile");
  if (error || !profile) return { status: "forbidden" };
  return { status: "ready", email, displayName: "Alonso" };
}

export async function getSignedInDestination(): Promise<"/parent" | "/alonso" | null> {
  const fixture = await getDevelopmentFixtureSource();
  if (fixture) return fixture.role === "parent" ? "/parent" : "/alonso";
  if (!getSupabasePublicConfig()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email?.toString().trim().toLowerCase();
  if (!email) return null;
  if (email === getChildLoginEmail()) return "/alonso";
  return null;
}
