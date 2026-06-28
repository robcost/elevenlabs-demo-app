"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AudioPlayerButton,
  AudioPlayerDuration,
  AudioPlayerProgress,
  AudioPlayerProvider,
  AudioPlayerTime,
} from "@/components/ui/audio-player";
import { DEFAULT_VOICE_ID } from "@/lib/voices";
import { ElevenRegion } from "@/components/eleven-region";
import {
  readElevenHeaders,
  type ElevenHeaderInfo,
} from "@/lib/eleven-headers";

/** A diarised speaker turn returned by /api/stt. */
type Turn = { speaker: string; text: string };

/** The structured analysis returned by /api/summary. */
type Analysis = {
  intent: string;
  sentiment: "positive" | "neutral" | "negative";
  summary: string;
  actionItems: string[];
};

/** Map a sentiment to a Badge variant. */
function sentimentVariant(
  s: Analysis["sentiment"],
): "default" | "secondary" | "destructive" {
  if (s === "negative") return "destructive";
  if (s === "positive") return "default";
  return "secondary";
}

/**
 * Call Intelligence (FR-API-4/5/6/7): upload a member call → Scribe v2 diarised
 * transcript (agent/customer roles) → Claude summary (intent, sentiment, action
 * items) → read the summary back with TTS. All processing is server-side.
 */
export function CallIntelligence() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [readback, setReadback] = useState<{ id: string; src: string } | null>(
    null,
  );
  const [region, setRegion] = useState<ElevenHeaderInfo | null>(null);

  const analyse = useCallback(async () => {
    if (!file) return;
    setError(null);
    setLoading(true);
    setTurns([]);
    setAnalysis(null);
    setReadback(null);
    setRegion(null);
    try {
      // 1. Transcribe (Scribe v2, diarised).
      const form = new FormData();
      form.append("file", file);
      const sttRes = await fetch("/api/stt", { method: "POST", body: form });
      if (!sttRes.ok) throw new Error("Transcription failed.");
      setRegion(readElevenHeaders(sttRes));
      const { turns: t } = (await sttRes.json()) as { turns: Turn[] };
      setTurns(t ?? []);

      // 2. Summarise the transcript with Claude.
      const transcript = (t ?? [])
        .map((turn) => `${turn.speaker}: ${turn.text}`)
        .join("\n");
      const sumRes = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!sumRes.ok) throw new Error("Summary failed.");
      setAnalysis((await sumRes.json()) as Analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Call analysis failed.");
    } finally {
      setLoading(false);
    }
  }, [file]);

  const readSummary = useCallback(async () => {
    if (!analysis) return;
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: analysis.summary, voiceId: DEFAULT_VOICE_ID }),
    });
    if (!res.ok) return;
    const url = URL.createObjectURL(await res.blob());
    setReadback((prev) => {
      if (prev) URL.revokeObjectURL(prev.src);
      return { id: url, src: url };
    });
  }, [analysis]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-foreground/70 file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
        />
        <Button onClick={analyse} disabled={!file || loading}>
          {loading ? "Analysing…" : "Analyse call"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {turns.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground/70">
            Diarised transcript
          </h3>
          <div className="flex flex-col gap-2 rounded-lg border border-border p-4 text-sm">
            {turns.map((turn, i) => (
              <div key={i} className="flex gap-2">
                <span className="shrink-0 font-medium capitalize text-foreground/60">
                  {turn.speaker}:
                </span>
                <span className="text-foreground/90">{turn.text}</span>
              </div>
            ))}
          </div>
          <ElevenRegion info={region} />
        </section>
      )}

      {analysis && (
        <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground/70">Summary</h3>
            <Badge variant={sentimentVariant(analysis.sentiment)}>
              {analysis.sentiment}
            </Badge>
          </div>
          <p className="text-sm">
            <span className="text-foreground/60">Intent: </span>
            {analysis.intent}
          </p>
          <p className="text-sm text-foreground/90">{analysis.summary}</p>
          {analysis.actionItems.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-foreground/60">
                Action items
              </span>
              <ul className="list-inside list-disc text-sm text-foreground/90">
                {analysis.actionItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={readSummary}>
              Read summary aloud
            </Button>
            {readback && (
              <AudioPlayerProvider>
                <div className="flex items-center gap-3">
                  <AudioPlayerButton item={readback} size="icon" />
                  <AudioPlayerTime />
                  <AudioPlayerProgress className="flex-1" />
                  <AudioPlayerDuration />
                </div>
              </AudioPlayerProvider>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
