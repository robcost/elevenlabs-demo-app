import { SectionHeader } from "@/components/section-header";
import { TtsPlayground } from "@/components/api/tts-playground";
import { CallIntelligence } from "@/components/api/call-intelligence";

/**
 * Section 1 — ElevenAPI: "The Building Blocks" (PRD §7.1).
 *
 * Two use cases on one page: the TTS model playground (FR-API-1/2) and Call
 * Intelligence — Scribe v2 diarised transcript → Claude summary → TTS read-back
 * (FR-API-4/5/6/7).
 */
export default function ApiSection() {
  return (
    <div className="flex flex-col gap-10">
      <SectionHeader href="/api" />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground/70">
          Model playground
        </h2>
        <p className="text-sm text-foreground/60">
          Type a line, pick a voice and model, and hear it streamed back — with a
          live latency and estimated-cost readout.
        </p>
        <TtsPlayground />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground/70">
          Call intelligence
        </h2>
        <p className="text-sm text-foreground/60">
          Upload a member call → Scribe v2 transcribes and diarises it (agent vs
          customer) → Claude summarises intent, sentiment, and action items → hear
          the summary read back.
        </p>
        <CallIntelligence />
      </section>
    </div>
  );
}
