import type { Metadata } from "next";
import { LoginScreen } from "@/components/auth/login-screen";

export const metadata: Metadata = { title: "Sign In | Alonso Academy" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  return <LoginScreen error={query.error} />;
}
