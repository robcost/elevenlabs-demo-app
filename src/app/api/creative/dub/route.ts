import { getElevenLabs } from "@/lib/elevenlabs";

/** Node.js runtime — multipart upload + SDK. */
export const runtime = "nodejs";

/**
 * Start a dubbing job for the narration audio into one target language
 * (FR-CRV-3). Dubbing is asynchronous: this returns a `dubbingId` the client
 * polls via `/api/creative/dub/[id]`, then fetches the result audio from
 * `/api/creative/dub/[id]/audio`.
 *
 * @param req - multipart form with `file` (narration audio), `targetLang`
 *   (ISO-639-1, e.g. `ja`), and optional `sourceLang` (defaults to `en`).
 */
export async function POST(req: Request): Promise<Response> {
  const form = await req.formData();
  const file = form.get("file");
  const targetLang = form.get("targetLang");

  if (!(file instanceof File) || typeof targetLang !== "string") {
    return Response.json(
      { error: "file and targetLang are required" },
      { status: 400 },
    );
  }

  const sourceLang =
    typeof form.get("sourceLang") === "string"
      ? (form.get("sourceLang") as string)
      : "en";

  const res = await getElevenLabs().dubbing.create({
    file,
    targetLang,
    sourceLang,
    numSpeakers: 1,
  });

  return Response.json({
    dubbingId: res.dubbingId,
    expectedDurationSec: res.expectedDurationSec,
  });
}
