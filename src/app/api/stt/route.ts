import { getElevenLabs } from "@/lib/elevenlabs";

/** Node.js runtime — multipart file handling + SDK, key stays server-side. */
export const runtime = "nodejs";

/** A diarised speaker turn for the call-intelligence transcript. */
type Turn = { speaker: string; text: string };

/**
 * Transcribe an uploaded call with Scribe v2, diarised and role-tagged
 * (FR-API-4/5). Returns the raw text plus the words grouped into speaker turns
 * (`detectSpeakerRoles` makes the speaker ids `agent` / `customer`).
 *
 * @param req - multipart form with a `file` field (the call audio).
 */
export async function POST(req: Request): Promise<Response> {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No audio file provided." }, { status: 400 });
  }

  const result = await getElevenLabs().speechToText.convert({
    file,
    modelId: "scribe_v2",
    diarize: true,
    detectSpeakerRoles: true,
    tagAudioEvents: true,
  });

  const words = result.words ?? [];

  // Group consecutive tokens into turns, starting a new turn whenever a spoken
  // word arrives from a different speaker. Spacing/audio-event tokens append to
  // the current turn so the text reads naturally.
  const turns: Turn[] = [];
  let current: Turn | null = null;
  for (const w of words) {
    if (w.type === "word" && w.speakerId) {
      if (current === null || current.speaker !== w.speakerId) {
        current = { speaker: w.speakerId, text: "" };
        turns.push(current);
      }
    } else if (current === null) {
      current = { speaker: "speaker", text: "" };
      turns.push(current);
    }
    if (current) current.text += w.text;
  }

  return Response.json({
    text: result.text ?? "",
    durationSecs: result.audioDurationSecs,
    turns: turns.map((t) => ({ speaker: t.speaker, text: t.text.trim() })),
  });
}
