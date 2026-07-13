"use server";

import { redirect } from "next/navigation";
import { fixtureScenarioKeySchema } from "@/lib/development-fixtures/contracts";
import { getFixtureScenario } from "@/lib/development-fixtures/scenarios";
import {
  enterDevelopmentFixtureScenario,
  exitDevelopmentFixtureSession,
  resetDevelopmentFixtureSession,
} from "@/lib/development-fixtures/session";

export async function activateFixtureScenario(formData: FormData) {
  const parsed = fixtureScenarioKeySchema.safeParse(formData.get("scenario"));
  if (!parsed.success) throw new Error("The requested development fixture scenario is not supported.");
  await enterDevelopmentFixtureScenario(parsed.data);
  redirect(getFixtureScenario(parsed.data).destination);
}

export async function resetFixtureScenario() {
  await resetDevelopmentFixtureSession();
  redirect("/dev/fixtures?reset=1");
}

export async function exitFixtureScenario() {
  await exitDevelopmentFixtureSession();
  redirect("/dev/fixtures?exited=1");
}
