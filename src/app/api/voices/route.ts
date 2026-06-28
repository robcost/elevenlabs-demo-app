import { getElevenLabs } from "@/lib/elevenlabs";
import { buildForwardHeaders } from "@/lib/eleven-headers";

/** Node.js runtime — server-side, keeps the key off the client. */
export const runtime = "nodejs";

/**
 * List the workspace's voices for the TTS playground voice picker (FR-API-1).
 * Returns full `ElevenLabs.Voice` objects (name, previewUrl, labels) because the
 * Voice Picker component consumes that shape. The key stays server-side; the
 * ElevenLabs response headers (incl. `x-region`) are forwarded for the UI.
 */
export async function GET(): Promise<Response> {
  const { data, rawResponse } = await getElevenLabs()
    .voices.getAll()
    .withRawResponse();
  return Response.json(
    { voices: data.voices },
    { headers: buildForwardHeaders(rawResponse.headers) },
  );
}
