import { getElevenLabs } from "@/lib/elevenlabs";
import { DEFAULT_OUTPUT_FORMAT, FLASH_MODEL_ID } from "@/lib/voices";

/** Node.js runtime — the SDK and audio streaming need Node APIs (not Edge). */
export const runtime = "nodejs";

/**
 * Streaming Text-to-Speech proxy (FR-PLT-3).
 *
 * Accepts `{ text, voiceId, modelId?, outputFormat? }` and streams MP3 audio
 * straight back to the browser, keeping `ELEVENLABS_API_KEY` server-side
 * (NFR-1). The client points an `<audio>` element at this route.
 *
 * `textToSpeech.stream` returns a web `ReadableStream<Uint8Array>` (verified in
 * `@elevenlabs/elevenlabs-js@2.53.0`), which is a valid `Response` body.
 *
 * @param req - JSON body: `text` (required), `voiceId` (required),
 *   `modelId` (defaults to Flash v2.5), `outputFormat` (defaults to mp3 44.1k/64).
 * @returns A streamed `audio/mpeg` response.
 */
export async function POST(req: Request): Promise<Response> {
  const { text, voiceId, modelId, outputFormat } = await req.json();

  if (!text || !voiceId) {
    return Response.json(
      { error: "text and voiceId are required" },
      { status: 400 },
    );
  }

  const stream = await getElevenLabs().textToSpeech.stream(voiceId, {
    text,
    modelId: modelId ?? FLASH_MODEL_ID,
    outputFormat: outputFormat ?? DEFAULT_OUTPUT_FORMAT,
  });

  return new Response(stream as unknown as BodyInit, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
