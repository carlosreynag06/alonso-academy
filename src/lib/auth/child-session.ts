import "server-only";

import { createHash, randomBytes } from "node:crypto";

export const CHILD_SESSION_TTL_SECONDS = 60 * 60 * 8;

export function createChildSessionSecret() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashChildSessionToken(token) };
}

export function hashChildSessionToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function childSessionExpiresAt(now = new Date()) {
  return new Date(now.getTime() + CHILD_SESSION_TTL_SECONDS * 1000);
}
