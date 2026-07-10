import "server-only";

const serverVariables = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "ELEVENLABS_API_KEY",
  "PARENT_ALLOWLIST_EMAIL",
] as const;

export type ServerVariable = (typeof serverVariables)[number];

export function getParentAllowlistEmail(): string | null {
  const value = process.env.PARENT_ALLOWLIST_EMAIL?.trim().toLowerCase();
  return value || null;
}

export function requireServerEnvironment(
  required: readonly ServerVariable[],
): Record<ServerVariable, string> {
  const missing = required.filter((name) => !process.env[name]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Server configuration is incomplete. Missing: ${missing.join(", ")}.`,
    );
  }

  return Object.fromEntries(
    serverVariables.map((name) => [name, process.env[name] ?? ""]),
  ) as Record<ServerVariable, string>;
}
