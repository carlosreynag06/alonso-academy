import "server-only";

import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  developmentFixtureStateSchema,
  type DevelopmentFixtureState,
} from "./contracts";

const sessionIdSchema = z.string().uuid();
const fixtureDirectory = path.join(process.cwd(), ".local-data", "dev-fixtures");

function statePath(sessionId: string) {
  return path.join(fixtureDirectory, `${sessionIdSchema.parse(sessionId)}.json`);
}

export async function readDevelopmentFixtureState(sessionId: string): Promise<DevelopmentFixtureState | null> {
  try {
    const serialized = await readFile(statePath(sessionId), "utf8");
    return developmentFixtureStateSchema.parse(JSON.parse(serialized));
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    if (code === "ENOENT") return null;
    throw error;
  }
}

export async function writeDevelopmentFixtureState(state: DevelopmentFixtureState) {
  const validated = developmentFixtureStateSchema.parse(state);
  await mkdir(fixtureDirectory, { recursive: true });
  const destination = statePath(validated.sessionId);
  const temporary = path.join(fixtureDirectory, `${validated.sessionId}.${randomUUID()}.tmp`);
  await writeFile(temporary, `${JSON.stringify(validated, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  try {
    await rename(temporary, destination);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    if (code !== "EEXIST" && code !== "EPERM") {
      await rm(temporary, { force: true });
      throw error;
    }
    await rm(destination, { force: true });
    await rename(temporary, destination);
  }
  return validated;
}

export async function deleteDevelopmentFixtureState(sessionId: string) {
  await rm(statePath(sessionId), { force: true });
}
