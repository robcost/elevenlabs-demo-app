import { SectionHeader } from "@/components/section-header";
import { CreativeStudio } from "@/components/creative/creative-studio";

/**
 * Section 3 — ElevenCreative: "The Content Engine" → video finale (PRD §7.3).
 *
 * A Meridian policy excerpt → Claude narration script → expressive TTS v3
 * narration (A/B vs Multilingual v2) → dubbing into five languages (incl.
 * Japanese) → the Studio-produced lip-synced spokesperson video finale.
 */
export default function CreativeSection() {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader href="/creative" />
      <CreativeStudio />
    </div>
  );
}
