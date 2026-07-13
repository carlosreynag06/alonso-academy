import "server-only";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseSupportedChildLesson } from "./registry";
import { getDevelopmentFixtureSource } from "@/lib/development-fixtures/source";
import { getFixtureChildLessonAttempt, getFixtureChildLessonHome } from "@/lib/development-fixtures/adapters";

const homePayloadSchema = z.object({
  child: z.object({ id: z.string(), preferredName: z.string() }),
  currentAttempt: z.object({ id: z.string(), lessonId: z.string(), status: z.string(), currentBlockIndex: z.number(), breakCount: z.number() }).nullable(),
  lessons: z.array(z.object({ id: z.string(), kind: z.string(), version: z.number(), dayNumber: z.number().nullable(), content: z.unknown() })),
});

const attemptPayloadSchema = z.object({
  attempt: z.object({ id: z.string(), status: z.string(), currentBlockIndex: z.number(), breakCount: z.number(), playerState: z.unknown() }),
  lesson: z.object({ id: z.string(), kind: z.string(), version: z.number(), dayNumber: z.number().nullable(), content: z.unknown() }),
});

export async function getChildLessonHome() {
  const fixture = await getDevelopmentFixtureSource();
  if (fixture) return getFixtureChildLessonHome(fixture.state);
  const supabase = await createClient();
  const result = await supabase.rpc("get_child_lesson_home");
  if (result.error) throw result.error;
  const payload = homePayloadSchema.parse(result.data);
  const lessons = payload.lessons.flatMap((record) => {
    const lesson = parseSupportedChildLesson(record.content);
    return lesson ? [{ ...record, lesson }] : [];
  });
  const currentAttempt = payload.currentAttempt && lessons.some((lesson) => lesson.id === payload.currentAttempt?.lessonId)
    ? payload.currentAttempt
    : null;
  return { child: payload.child, currentAttempt, lessons };
}

export async function getChildLessonAttempt(attemptId: string) {
  const fixture = await getDevelopmentFixtureSource();
  if (fixture) return getFixtureChildLessonAttempt(fixture.state, attemptId);
  const supabase = await createClient();
  const result = await supabase.rpc("get_child_lesson_attempt", { p_attempt_id: attemptId });
  if (result.error) throw result.error;
  const payload = attemptPayloadSchema.parse(result.data);
  const lesson = parseSupportedChildLesson(payload.lesson.content);
  if (!lesson) throw new Error("This approved lesson contains an unsupported activity.");
  return { ...payload, lesson: { ...payload.lesson, content: lesson } };
}
