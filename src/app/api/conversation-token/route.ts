import { buildForwardHeaders } from "@/lib/eleven-headers";

/** Node.js runtime — server-only credential mint. */
export const runtime = "nodejs";

/**
 * Mint a short-lived WebRTC **conversation token** for the live agent (FR-PLT-4).
 *
 * The browser fetches this, then calls
 * `startSession({ conversationToken, connectionType: "webrtc" })`. Verified in
 * `@elevenlabs/client@1.11.2`: WebRTC sessions require a `conversationToken`
 * (a `signedUrl` is only valid for the websocket transport), so this route
 * mints a token — not a signed URL.
 *
 * Verified live against the agent: `GET /v1/convai/conversation/token?agent_id=…`
 * returns `200 { token: "<JWT>" }`.
 *
 * @returns `{ conversationToken }` on success.
 */
export async function GET(): Promise<Response> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${process.env.AGENT_ID}`,
    { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "" } }, // server only
  );

  if (!res.ok) {
    return Response.json(
      { error: "conversation_token_mint_failed", status: res.status },
      { status: 500 },
    );
  }

  const { token } = await res.json();
  return Response.json(
    { conversationToken: token },
    { headers: buildForwardHeaders(res.headers) },
  );
}
