import { getElevenLabs } from "@/lib/elevenlabs";

/** Node.js runtime — server-side status poll. */
export const runtime = "nodejs";

/**
 * Poll the status of a dubbing job (FR-CRV-3). The client calls this until
 * `status` is `"dubbed"`, then fetches the audio from `.../audio`.
 *
 * @param ctx - route params; `id` is the `dubbingId`.
 * @returns `{ status, targetLanguages, error? }`.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await ctx.params;
  const meta = await getElevenLabs().dubbing.get(id);
  return Response.json({
    status: meta.status,
    targetLanguages: meta.targetLanguages,
    error: meta.error,
  });
}
