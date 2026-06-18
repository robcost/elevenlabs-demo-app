import { getElevenLabs } from "@/lib/elevenlabs";

/** Node.js runtime — server-side, keeps the key off the client. */
export const runtime = "nodejs";

/**
 * List the workspace's voices for the TTS playground voice picker (FR-API-1).
 * Returns full `ElevenLabs.Voice` objects (name, previewUrl, labels) because the
 * Voice Picker component consumes that shape. The key stays server-side.
 */
export async function GET(): Promise<Response> {
  const res = await getElevenLabs().voices.getAll();
  return Response.json({ voices: res.voices });
}
