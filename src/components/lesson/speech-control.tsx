"use client";

import { useRef, useState } from "react";
import { MicIcon, SoundIcon } from "@/components/icons";
import styles from "./lesson-player.module.css";

type SpeechResult = { outcome: "matched" | "try_again" | "silence"; transcript: string; feedback: string };

export function SpeechControl({ attemptId, blockId, firstAttempt, supportLevel, retryCount, startedAt, onMatched, onRetry }: {
  attemptId: string; blockId: string; firstAttempt: boolean; supportLevel: string; retryCount: number; startedAt: number;
  onMatched: () => void; onRetry: () => void;
}) {
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [state, setState] = useState<"ready" | "recording" | "processing" | "denied" | "unavailable">("ready");
  const [result, setResult] = useState<SpeechResult | null>(null);

  async function start() {
    setResult(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setState("unavailable"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      const next = new MediaRecorder(stream);
      chunks.current = [];
      next.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      next.onstop = async () => {
        setState("processing");
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks.current, { type: next.mimeType || "audio/webm" });
        chunks.current = [];
        const form = new FormData();
        form.set("audio", blob, "response.webm"); form.set("clientEventId", crypto.randomUUID()); form.set("firstAttempt", String(firstAttempt));
        form.set("supportLevel", supportLevel); form.set("responseLatencyMs", String(Date.now() - startedAt)); form.set("retryCount", String(retryCount));
        try {
          const response = await fetch(`/api/child/attempts/${attemptId}/speech/${encodeURIComponent(blockId)}`, { method: "POST", body: form });
          const payload = await response.json();
          if (!response.ok) { setResult({ outcome: "try_again", transcript: "", feedback: payload.message || "I could not listen right now. You can use the choices instead." }); setState("unavailable"); return; }
          setResult(payload); setState("ready");
          if (payload.outcome === "matched") onMatched(); else onRetry();
        } catch { setState("unavailable"); setResult({ outcome: "try_again", transcript: "", feedback: "I could not listen right now. You can use the choices instead." }); }
      };
      recorder.current = next; next.start(); setState("recording");
    } catch { setState("denied"); }
  }

  function stop() { if (recorder.current?.state === "recording") recorder.current.stop(); }

  return <div className={styles.speechControl}>
    <button type="button" onClick={state === "recording" ? stop : start} disabled={state === "processing"} className={state === "recording" ? styles.recordingButton : styles.micButton}>
      {state === "processing" ? <SoundIcon size={28} /> : <MicIcon size={28} />}<span>{state === "recording" ? "I’m done" : state === "processing" ? "Listening…" : "Say it"}</span>
    </button>
    {state === "recording" && <p role="status">I’m listening. Say it, then tap “I’m done.”</p>}
    {state === "denied" && <p role="status">The microphone is off. That’s okay—use the choices below.</p>}
    {result && <p className={result.outcome === "matched" ? styles.speechSuccess : styles.speechRetry} role="status">{result.feedback}</p>}
  </div>;
}
