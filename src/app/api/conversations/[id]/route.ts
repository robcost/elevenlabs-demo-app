/** Node.js runtime — server-only ElevenLabs fetch. */
export const runtime = "nodejs";

/**
 * Pull the transcript + analysis/summary for a finished conversation by id
 * (FR-AGT-9, DEC-10). This is the **pull** seam that replaces a post-call
 * webhook: after a call ends the client has the `conversation_id` (from the
 * SDK's `getId()`) and requests this route, which fetches server-side from
 * ElevenLabs and returns the result for Section 1 / the composition thread.
 * No inbound webhook, HMAC, ingress, or server store required.
 *
 * @remarks ⚠️ BUILD-START DOCS CHECK (plan §7.2): confirm the get-conversation
 * endpoint path and that it returns the analysis/summary (likely the
 * `conversationalAi` SDK resource). The agent's analysis may lag a few seconds
 * post-call, so callers may need to retry until it is ready.
 *
 * @param _req - unused.
 * @param ctx - route params; `id` is the ElevenLabs `conversation_id`.
 * @returns The raw conversation payload (transcript + analysis) as JSON.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await ctx.params;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversations/${id}`,
    { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "" } }, // server only
  );

  if (!res.ok) {
    return Response.json(
      { error: "conversation_fetch_failed", status: res.status },
      { status: res.status },
    );
  }

  return Response.json(await res.json());
}
