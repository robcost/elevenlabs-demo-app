import { getAnthropic, CLAUDE_MODEL } from "@/lib/llm";

/** Node.js runtime — server-side Anthropic call. */
export const runtime = "nodejs";

/** System prompt: turn a source doc into a short, expressive narration script. */
const SYSTEM = `You are a content writer for Meridian, an Australian and New Zealand member-services provider. Turn the source text into a warm, clear spoken narration script for a short member explainer — roughly 30 to 45 seconds when read aloud.

Use ElevenLabs v3 audio tags in square brackets sparingly to guide delivery, for example [warm], [reassuring], [thoughtful pause]. Write for the ear, not the page: short sentences, plain language, second person ("you").

Output only the narration script text — no title, no notes, no markdown.`;

/**
 * Generate an expressive narration script from a source document (FR-CRV-1).
 *
 * @param req - JSON body `{ sourceText: string }`.
 */
export async function POST(req: Request): Promise<Response> {
  const { sourceText } = await req.json();
  if (!sourceText || typeof sourceText !== "string") {
    return Response.json({ error: "sourceText is required" }, { status: 400 });
  }

  const message = await getAnthropic().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 800,
    system: SYSTEM,
    messages: [{ role: "user", content: `Source text:\n\n${sourceText}` }],
  });

  let script = "";
  for (const block of message.content) {
    if (block.type === "text") script += block.text;
  }
  return Response.json({ script: script.trim() });
}
