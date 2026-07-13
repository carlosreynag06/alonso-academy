import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { createDevelopmentFixtureState } from "./catalog";
import { developmentFixtureStateSchema, type FixtureScenarioKey } from "./contracts";
import {
  assertDevelopmentFixtureControlRequest,
  developmentFixturesEnabled,
  isLoopbackFixtureRequest,
} from "./guard";
import {
  deleteDevelopmentFixtureState,
  readDevelopmentFixtureState,
  writeDevelopmentFixtureState,
} from "./store";

export const DEVELOPMENT_FIXTURE_COOKIE = "alonso_dev_fixture_session";
const sessionIdSchema = z.string().uuid();
const COOKIE_MAX_AGE_SECONDS = 8 * 60 * 60;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: false,
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    priority: "high" as const,
  };
}

export async function getDevelopmentFixtureSessionId() {
  if (!developmentFixturesEnabled() || !await isLoopbackFixtureRequest()) return null;
  const value = (await cookies()).get(DEVELOPMENT_FIXTURE_COOKIE)?.value;
  const parsed = sessionIdSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export async function getDevelopmentFixtureSession() {
  const sessionId = await getDevelopmentFixtureSessionId();
  if (!sessionId) return null;
  try {
    const state = await readDevelopmentFixtureState(sessionId);
    return state ? developmentFixtureStateSchema.parse(state) : null;
  } catch (error) {
    if (error instanceof z.ZodError) return null;
    throw error;
  }
}

export async function enterDevelopmentFixtureScenario(scenario: FixtureScenarioKey) {
  await assertDevelopmentFixtureControlRequest();
  const existingSessionId = await getDevelopmentFixtureSessionId();
  const sessionId = existingSessionId ?? randomUUID();
  const state = createDevelopmentFixtureState(sessionId, scenario);
  await writeDevelopmentFixtureState(state);
  (await cookies()).set(DEVELOPMENT_FIXTURE_COOKIE, sessionId, cookieOptions());
  return state;
}

export async function resetDevelopmentFixtureSession() {
  await assertDevelopmentFixtureControlRequest();
  const current = await getDevelopmentFixtureSession();
  if (!current) return null;
  const state = createDevelopmentFixtureState(current.sessionId, current.scenario);
  await writeDevelopmentFixtureState(state);
  (await cookies()).set(DEVELOPMENT_FIXTURE_COOKIE, current.sessionId, cookieOptions());
  return state;
}

export async function exitDevelopmentFixtureSession() {
  await assertDevelopmentFixtureControlRequest();
  const sessionId = await getDevelopmentFixtureSessionId();
  if (sessionId) await deleteDevelopmentFixtureState(sessionId);
  (await cookies()).delete(DEVELOPMENT_FIXTURE_COOKIE);
}
