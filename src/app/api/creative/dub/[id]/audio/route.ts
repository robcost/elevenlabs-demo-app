import { getElevenLabs } from "@/lib/elevenlabs";

/** Node.js runtime — streams dubbed audio from the SDK. */
export const runtime = "nodejs";

/**
 * Stream the dubbed audio for a completed dubbing job in a given language
 * (FR-CRV-3). Call only once the job status is `"dubbed"`.
 *
 * @param req - query `?lang=` ISO-639-1 code (e.g. `ja`).
 * @param ctx - route params; `id` is the `dubbingId`.
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await ctx.params;
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    return Response.json({ error: "invalid dubbing id" }, { status: 400 });
  }
  const lang = new URL(req.url).searchParams.get("lang");
  if (!lang || !/^[A-Za-z]{2,3}$/.test(lang)) {
    return Response.json(
      { error: "a valid lang query param is required" },
      { status: 400 },
    );
  }

  const stream = await getElevenLabs().dubbing.audio.get(id, lang);
  return new Response(stream as unknown as BodyInit, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}
