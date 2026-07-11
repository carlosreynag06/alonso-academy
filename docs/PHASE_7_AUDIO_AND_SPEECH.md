# Phase 7: ElevenLabs Audio, Speech, and Pronunciation

## Outcome

Phase 7 connects the child lesson player to a server-only audio boundary. Model text and activity prompts can be synthesized and replayed, while selected spoken activities can collect short responses with clear ready, recording, processing, denied, silence, retry, and success states. Provider failure never damages lesson progress and always leaves a visual or choice-based path forward.

Live provider activation remains intentionally locked because ignored local configuration does not yet contain an ElevenLabs API key or the parent's approved American English voice ID. No default voice was silently chosen. Once both values are supplied, the existing routes become active without exposing either value to the browser.

## Text-to-speech and caching

The child requests audio using only an active attempt ID and immutable block ID. The server reauthorizes the child, loads the exact approved lesson, and resolves the permitted model or prompt text from that block. Arbitrary browser-supplied synthesis text is not accepted.

ElevenLabs returns an MP3 using the configured quality-first model. The server caches that audio in ignored `.local-data/lesson-audio` storage with a SHA-256 key derived from voice ID, model ID, and text. Replays reuse the same file. Cache contents are generated instructional assets, not child recordings.

## Speech capture and evidence

Speech is available for `phonemic_awareness` blocks whose response mode is `say` and for exit checks. Recording starts only after a child action. The browser stops every media track after the short capture, uploads the blob as multipart request memory, and releases it after the response. The server does not write raw audio to disk, Supabase Storage, database columns, logs, or provider metadata.

The server obtains acceptable responses from the approved block, never from the browser. It normalizes the transcript and applies a deliberately tolerant comparison. Silence produces a distinct neutral retry message. A close transcription counts as understood so accent variation is not treated as failure. After a retry, Alonso can use the existing choices instead of speech.

Migration `20260711270000_phase_7_speech_evidence.sql` adds a child-scoped security-definer RPC that stores transcript, confidence, timing, retry/support state, deterministic outcome, and safe provider/model metadata. The migration is applied and recorded in the hosted project.

## Provider contracts

- TTS uses ElevenLabs `POST /v1/text-to-speech/:voice_id` with MP3 output and the configured quality model.
- STT uses ElevenLabs `POST /v1/speech-to-text` with zero-retention logging disabled, `scribe_v2` by default, an English language hint, one speaker, and no audio-event tagging. If the connected ElevenLabs account does not permit zero-retention requests, speech fails safely instead of relaxing the retention rule.
- Provider calls have bounded timeouts and sanitized child-facing errors.
- API keys and voice IDs remain server-only and never use a `NEXT_PUBLIC_` variable.

The configured coding session did not expose an ElevenLabs MCP tool, so no provider administration or voice listing was performed. Runtime adapters are ready for the approved credential and voice. The parent must select the voice before live activation.

## Exclusions and verification

This phase adds no open conversation, permanent recording archive, accent-perfect score, emotion diagnosis, mastery update, or Phase 8 progress behavior. A production build passed. No test command or screenshot capture was run, in accordance with the project protocol.
