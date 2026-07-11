import type { Metadata } from "next";
import { LoginScreen } from "@/components/auth/login-screen";

export const metadata: Metadata = { title: "Sign In | Alonso Academy" };

export default function Home() {
  return <LoginScreen />;
}
