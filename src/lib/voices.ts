/**
 * Shared voice configuration.
 *
 * The same voice is reused across the API playground default, the live agent,
 * and the Creative narration so the demo can land the "one voice, whole
 * platform" talk-track (PRD §3.7 / NFR narrative).
 *
 * `DEFAULT_VOICE_ID` is a real premade ElevenLabs voice from the shared Voice
 * Library (no synthetic data). The API playground (FR-API-1) lets the presenter
 * pick any voice via `voices.search`; this is only the starting selection.
 */

/** Default premade voice ("Rachel") used as the shared brand voice for the demo. */
export const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

/** Default realtime model for live/low-latency speech (~75ms class). */
export const FLASH_MODEL_ID = "eleven_flash_v2_5";

/** Higher-quality multilingual model for non-realtime narration. */
export const MULTILINGUAL_MODEL_ID = "eleven_multilingual_v2";

/** Most expressive model (audio tags); non-realtime — Sections 1/3 only. */
export const V3_MODEL_ID = "eleven_v3";

/** Default streaming output format for browser playback. */
export const DEFAULT_OUTPUT_FORMAT = "mp3_44100_64";
