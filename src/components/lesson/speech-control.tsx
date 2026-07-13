"use client";

import { useEffect, useRef, useState } from "react";
import { MicIcon, SoundIcon } from "@/components/icons";
import {
  attemptMutationResponseSchema,
  type AttemptOutcome,
  type AuthoritativeAttemptSnapshot,
} from "@/lib/lesson/runtime-contracts";
import styles from "./lesson-player.module.css";

type SpeechResult = {
  outcome: AttemptOutcome | "transport_error";
  feedback: string;
};

export function SpeechControl({
  attemptId,
  blockId,
  expectedStateVersion,
  onSnapshot,
  onUnavailable,
}: {
  attemptId: string;
  blockId: string;
  expectedStateVersion: number;
  onSnapshot: (snapshot: AuthoritativeAttemptSnapshot, outcome?: AttemptOutcome) => void;
  onUnavailable: () => void;
}) {
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [state, setState] = useState<"ready" | "recording" | "processing" | "denied" | "unavailable">("ready");
  const [result, setResult] = useState<SpeechResult | null>(null);

  useEffect(() => () => {
    if (recorder.current?.state === "recording") {
      recorder.current.onstop = null;
      recorder.current.stop();
    }
    stream.current?.getTracks().forEach((track) => track.stop());
    chunks.current = [];
  }, []);

  async function start() {
    setResult(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState("unavailable");
      onUnavailable();
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      const next = new MediaRecorder(mediaStream);
      stream.current = mediaStream;
      chunks.current = [];
      next.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      next.onstop = async () => {
        setState("processing");
        mediaStream.getTracks().forEach((track) => track.stop());
        stream.current = null;
        const blob = new Blob(chunks.current, { type: next.mimeType || "audio/webm" });
        chunks.current = [];
        const form = new FormData();
        form.set("audio", blob, "response.webm");
        form.set("clientEventId", crypto.randomUUID());
        form.set("expectedStateVersion", String(expectedStateVersion));

        try {
          const response = await fetch(`/api/child/attempts/${attemptId}/speech/${encodeURIComponent(blockId)}`, { method: "POST", body: form });
          const payload: unknown = await response.json().catch(() => null);
          const mutation = attemptMutationResponseSchema.safeParse(payload);
          if (mutation.success) {
            onSnapshot(mutation.data.snapshot, mutation.data.outcome);
            setResult({
              outcome: mutation.data.outcome ?? mutation.data.snapshot.outcome ?? "acknowledged",
              feedback: mutation.data.snapshot.feedback?.message ?? "I heard you.",
            });
          }
          if (!response.ok || !mutation.success) {
            const message = payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
              ? payload.message
              : "I could not listen right now. You can use the choices instead.";
            setResult({ outcome: "transport_error", feedback: message });
            setState("unavailable");
            onUnavailable();
            return;
          }
          setState("ready");
        } catch {
          setState("unavailable");
          setResult({ outcome: "transport_error", feedback: "I could not listen right now. You can use the choices instead." });
          onUnavailable();
        }
      };
      recorder.current = next;
      next.start();
      setState("recording");
    } catch {
      setState("denied");
      onUnavailable();
    }
  }

  function stop() {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  return <div className={styles.speechControl}>
    <button type="button" onClick={state === "recording" ? stop : start} disabled={state === "processing"} className={state === "recording" ? styles.recordingButton : styles.micButton}>
      {state === "processing" ? <SoundIcon size={28} /> : <MicIcon size={28} />}<span>{state === "recording" ? "I’m done" : state === "processing" ? "Listening…" : "Say it"}</span>
    </button>
    {state === "recording" && <p role="status">I’m listening. Say it, then tap “I’m done.”</p>}
    {state === "denied" && <p role="status">The microphone is off. That’s okay—use the choices below.</p>}
    {result && <p className={result.outcome === "matched" || result.outcome === "correct" ? styles.speechSuccess : styles.speechRetry} role="status">{result.feedback}</p>}
  </div>;
}
