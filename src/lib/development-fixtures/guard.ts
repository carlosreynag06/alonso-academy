import "server-only";

import { headers } from "next/headers";

const ENABLED_VALUE = "true";

export class DevelopmentFixturesUnavailableError extends Error {
  constructor(message = "Development fixtures are not available in this request.") {
    super(message);
    this.name = "DevelopmentFixturesUnavailableError";
  }
}

export function developmentFixturesEnabled() {
  return process.env.NODE_ENV === "development"
    && process.env.ALONSO_ENABLE_DEV_FIXTURES?.trim().toLowerCase() === ENABLED_VALUE;
}

function hostnameFromHeader(value: string) {
  const first = value.split(",", 1)[0]?.trim() ?? "";
  if (!first) return null;
  try {
    return new URL(`http://${first}`).hostname.replace(/^\[|\]$/g, "").toLowerCase();
  } catch {
    return null;
  }
}

export function isLoopbackHostname(hostname: string) {
  const normalized = hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

export async function isLoopbackFixtureRequest() {
  const requestHeaders = await headers();
  const hostValues = [
    requestHeaders.get("host"),
    requestHeaders.get("x-forwarded-host"),
  ].filter((value): value is string => Boolean(value));

  if (hostValues.length === 0) return false;
  if (!hostValues.every((value) => {
    const hostname = hostnameFromHeader(value);
    return hostname ? isLoopbackHostname(hostname) : false;
  })) return false;

  const origin = requestHeaders.get("origin");
  if (!origin) return true;
  try {
    return isLoopbackHostname(new URL(origin).hostname);
  } catch {
    return false;
  }
}

export async function fixtureControlAvailable() {
  return developmentFixturesEnabled() && await isLoopbackFixtureRequest();
}

export async function assertDevelopmentFixtureControlRequest() {
  if (!developmentFixturesEnabled()) {
    throw new DevelopmentFixturesUnavailableError("Development fixtures require NODE_ENV=development and ALONSO_ENABLE_DEV_FIXTURES=true.");
  }
  if (!await isLoopbackFixtureRequest()) {
    throw new DevelopmentFixturesUnavailableError("Development fixtures are restricted to loopback requests.");
  }
}
