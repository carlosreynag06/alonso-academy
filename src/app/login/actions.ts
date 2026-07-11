"use server";

import { redirect } from "next/navigation";
import { getChildLoginEmail, getParentAllowlistEmail } from "@/lib/env/server";
import { createClient } from "@/lib/supabase/server";

function resolveIdentifier(identifier: string, parentEmail: string, childEmail: string) {
  const normalized = identifier.trim().toLowerCase();
  if (["parent", "carlos"].includes(normalized)) return parentEmail;
  if (["alonso", "student", "son"].includes(normalized)) return childEmail;
  return normalized;
}

export async function signInWithPassword(formData: FormData) {
  const parentEmail = getParentAllowlistEmail();
  const childEmail = getChildLoginEmail();
  const identifier = formData.get("identifier")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  if (!parentEmail || !childEmail) redirect("/login?error=configuration");

  const email = resolveIdentifier(identifier, parentEmail, childEmail);
  if (![parentEmail, childEmail].includes(email) || password.length < 6) {
    redirect("/login?error=invalid");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user?.email) redirect("/login?error=invalid");

  const authenticatedEmail = data.user.email.trim().toLowerCase();
  if (authenticatedEmail === parentEmail) redirect("/parent");
  if (authenticatedEmail === childEmail) redirect("/alonso");
  await supabase.auth.signOut();
  redirect("/login?error=forbidden");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
