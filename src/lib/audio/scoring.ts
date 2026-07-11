export function normalizeTranscript(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9' ]/g, " ").replace(/\s+/g, " ").trim();
}

function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const saved = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = saved;
    }
  }
  return row[b.length];
}

export function scoreTranscript(transcript: string, acceptableResponses: string[]) {
  const heard = normalizeTranscript(transcript);
  if (!heard) return { outcome: "silence" as const, correct: null, feedback: "I didn’t hear words yet. Take your time and try once more." };
  let best = 0;
  for (const answer of acceptableResponses) {
    const expected = normalizeTranscript(answer);
    if (!expected) continue;
    const similarity = 1 - distance(heard, expected) / Math.max(heard.length, expected.length, 1);
    best = Math.max(best, similarity);
  }
  if (best >= 0.72) return { outcome: "matched" as const, correct: true, feedback: "I heard you. That works!" };
  return { outcome: "try_again" as const, correct: false, feedback: `I heard “${transcript.trim()}.” Listen once, then try it again.` };
}
