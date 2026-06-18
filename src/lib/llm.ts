import Anthropic from "@anthropic-ai/sdk";

/**
 * Lazily-constructed, shared server-side Anthropic (Claude) client.
 *
 * Constructed on first use (not at module load) so importing this module during
 * `next build` does not throw when `ANTHROPIC_API_KEY` is absent. Used for the
 * non-ElevenLabs LLM passes: the Call Intelligence summary (FR-API-6) and the
 * Creative script pass (FR-CRV-1). Server-only, like {@link getElevenLabs}.
 *
 * @remarks The actual `messages.create` calls are implemented in Phase 2/3.
 * Consult the `claude-api` reference before writing those calls to confirm the
 * current model id, params, and token handling.
 * @returns The shared {@link Anthropic} client instance.
 */
let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

/**
 * Default Claude model for summary/script passes (DEC-1 — "latest available").
 * Opus 4.8 is the most capable Opus-tier model; swap to `claude-sonnet-4-6`
 * for a cheaper/faster option if demo cost matters.
 */
export const CLAUDE_MODEL = "claude-opus-4-8";
