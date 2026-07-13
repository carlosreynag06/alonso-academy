import "server-only";

import type { FixtureRole } from "./contracts";
import { getDevelopmentFixtureSession } from "./session";

export const DEVELOPMENT_FIXTURE_SOURCE = "development_fixture" as const;

export async function getDevelopmentFixtureSource() {
  const state = await getDevelopmentFixtureSession();
  if (!state) return null;
  return {
    kind: DEVELOPMENT_FIXTURE_SOURCE,
    fixture: true as const,
    sessionId: state.sessionId,
    scenario: state.scenario,
    role: state.role,
    state,
  };
}

export async function isDevelopmentFixtureRequest() {
  return Boolean(await getDevelopmentFixtureSource());
}

export async function requireDevelopmentFixtureSource(role?: FixtureRole) {
  const source = await getDevelopmentFixtureSource();
  if (!source) throw new Error("An active development fixture session is required.");
  if (role && source.role !== role) throw new Error(`The active development fixture session is not authorized for the ${role} view.`);
  return source;
}
