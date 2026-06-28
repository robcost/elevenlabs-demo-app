"use client";

import { useCallback, useEffect, useState } from "react";
import type { ElevenLabs } from "@elevenlabs/elevenlabs-js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VoicePicker } from "@/components/ui/voice-picker";
import {
  AudioPlayerButton,
  AudioPlayerDuration,
  AudioPlayerProgress,
  AudioPlayerProvider,
  AudioPlayerSpeed,
  AudioPlayerTime,
} from "@/components/ui/audio-player";
import {
  FLASH_MODEL_ID,
  MULTILINGUAL_MODEL_ID,
  V3_MODEL_ID,
} from "@/lib/voices";
import { ElevenRegion } from "@/components/eleven-region";
import {
  readElevenHeaders,
  type ElevenHeaderInfo,
} from "@/lib/eleven-headers";

/** Selectable TTS models with their trade-off blurb + rough credit cost per char. */
const MODELS = [
  { id: FLASH_MODEL_ID, label: "Flash v2.5", note: "~75ms · realtime", creditsPerChar: 0.5 },
  { id: MULTILINGUAL_MODEL_ID, label: "Multilingual v2", note: "quality", creditsPerChar: 1 },
  { id: V3_MODEL_ID, label: "v3", note: "most expressive", creditsPerChar: 1 },
] as const;

/** A generated audio clip wired into the Audio Player. */
type AudioItem = { id: string; src: string };

/** Latency/size metrics shown after a generation (FR-API-2). */
type Metrics = { ttfbMs: number; totalMs: number; chars: number };

const SAMPLE_TEXT =
  "Hi, you've reached Meridian Member Services — this is Ava. How can I help you today?";

/**
 * TTS playground (FR-API-1/2): type a line, pick a voice and model, and hear it
 * streamed back through the Audio Player with a live time-to-first-byte and
 * estimated-cost readout — the "feel the trade-offs" demo. Audio is streamed
 * from `/api/tts` (key stays server-side) into an object URL.
 */
export function TtsPlayground() {
  const [voices, setVoices] = useState<ElevenLabs.Voice[]>([]);
  const [voiceId, setVoiceId] = useState<string>("");
  const [modelId, setModelId] = useState<string>(FLASH_MODEL_ID);
  const [text, setText] = useState<string>(SAMPLE_TEXT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioItem, setAudioItem] = useState<AudioItem | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [region, setRegion] = useState<ElevenHeaderInfo | null>(null);

  // Load the voice list once (server-side proxy keeps the key off the client).
  useEffect(() => {
    fetch("/api/voices")
      .then((r) => r.json())
      .then((d: { voices?: ElevenLabs.Voice[] }) => {
        const list = d.voices ?? [];
        setVoices(list);
        if (list[0]?.voiceId) setVoiceId(list[0].voiceId);
      })
      .catch(() => setError("Could not load voices."));
  }, []);

  const model = MODELS.find((m) => m.id === modelId) ?? MODELS[0];
  const estCredits = Math.round(text.length * model.creditsPerChar);

  const generate = useCallback(async () => {
    if (!text.trim() || !voiceId) return;
    setError(null);
    setLoading(true);
    try {
      const t0 = performance.now();
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId, modelId }),
      });
      if (!res.ok) throw new Error("Speech generation failed.");
      const ttfbMs = performance.now() - t0; // response headers ≈ time-to-first-byte
      setRegion(readElevenHeaders(res));
      const blob = await res.blob();
      const totalMs = performance.now() - t0;

      const url = URL.createObjectURL(blob);
      setAudioItem((prev) => {
        if (prev) URL.revokeObjectURL(prev.src);
        return { id: url, src: url };
      });
      setMetrics({ ttfbMs, totalMs, chars: text.length });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speech generation failed.");
    } finally {
      setLoading(false);
    }
  }, [text, voiceId, modelId]);

  return (
    <div className="flex flex-col gap-5">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Type something for the voice to say…"
        className="resize-none"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground/60">Voice</span>
          <VoicePicker
            voices={voices}
            value={voiceId}
            onValueChange={setVoiceId}
            placeholder={voices.length ? "Select a voice…" : "Loading voices…"}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground/60">Model</span>
          <div className="flex gap-1">
            {MODELS.map((m) => (
              <Button
                key={m.id}
                type="button"
                size="sm"
                variant={m.id === modelId ? "default" : "outline"}
                onClick={() => setModelId(m.id)}
              >
                {m.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-foreground/50">
          {text.length} chars · ≈ {estCredits} credits · {model.note}
        </p>
        <Button onClick={generate} disabled={loading || !voiceId || !text.trim()}>
          {loading ? "Generating…" : "Generate speech"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {audioItem && (
        <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
          <AudioPlayerProvider>
            <div className="flex items-center gap-3">
              <AudioPlayerButton item={audioItem} size="icon" />
              <AudioPlayerTime />
              <AudioPlayerProgress className="flex-1" />
              <AudioPlayerDuration />
              <AudioPlayerSpeed />
            </div>
          </AudioPlayerProvider>
          {metrics && (
            <p className="text-xs text-foreground/50">
              TTFB {Math.round(metrics.ttfbMs)}ms · total{" "}
              {Math.round(metrics.totalMs)}ms · {metrics.chars} chars
            </p>
          )}
          <ElevenRegion info={region} />
        </div>
      )}
    </div>
  );
}
