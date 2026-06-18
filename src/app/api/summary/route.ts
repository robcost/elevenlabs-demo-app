import { getAnthropic, CLAUDE_MODEL } from "@/lib/llm";

/** Node.js runtime — server-side Anthropic call, key stays off the client. */
export const runtime = "nodejs";

/**
 * System prompt for the Call Intelligence summary (FR-API-6): asks for a single
 * JSON object so the result is machine-parseable for the UI.
 */
const SYSTEM = `You are a call-intelligence analyst for Meridian, an Australian and New Zealand member-services provider. Given a call transcript, return your analysis as a single JSON object and nothing else — no preamble, no markdown, no code fences.

The JSON must have exactly these keys:
- "intent": a short phrase describing what the member wanted.
- "sentiment": exactly one of "positive", "neutral", or "negative".
- "summary": one or two sentences summarising the call.
- "actionItems": an array of short strings describing follow-up actions for the agent (an empty array if there are none).`;

/**
 * Summarise a (diarised) call transcript with Claude (FR-API-6): intent,
 * sentiment, a short summary, and action items.
 *
 * @param req - JSON body `{ transcript: string }`.
 */
export async function POST(req: Request): Promise<Response> {
  const { transcript } = await req.json();
  if (!transcript || typeof transcript !== "string") {
    return Response.json({ error: "transcript is required" }, { status: 400 });
  }

  const message = await getAnthropic().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: "user", content: `Transcript:\n\n${transcript}` }],
  });

  let text = "";
  for (const block of message.content) {
    if (block.type === "text") text += block.text;
  }

  // Defensive parse: strip any accidental code fences before JSON.parse.
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  try {
    return Response.json(JSON.parse(cleaned));
  } catch {
    return Response.json(
      { error: "Could not parse the summary." },
      { status: 502 },
    );
  }
}
