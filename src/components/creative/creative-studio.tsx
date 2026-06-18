"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AudioPlayerButton,
  AudioPlayerDuration,
  AudioPlayerProgress,
  AudioPlayerProvider,
  AudioPlayerTime,
} from "@/components/ui/audio-player";
import {
  DEFAULT_VOICE_ID,
  MULTILINGUAL_MODEL_ID,
  V3_MODEL_ID,
} from "@/lib/voices";

/** Source language + the 5 dub targets (incl. Japanese, the APAC language — DEC-3). */
const LANGUAGES = [
  { code: "en", label: "English (original)" },
  { code: "ja", label: "Japanese" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "zh", label: "Mandarin" },
] as const;

/** Per-language dubbing state. */
type DubState = { state: "dubbing" | "ready" | "error"; url?: string };

/** Audio currently loaded in the player. */
type AudioItem = { id: string; src: string };

const SOURCE_DEFAULT =
  "Meridian Income Assist pays a monthly benefit of up to 70% of your regular income if you can't work due to illness or injury. You choose a waiting period of 14, 30, or 90 days before benefits begin, and a benefit period of 2 years or to age 65.";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * ElevenCreative studio surface (PRD §7.3): a Meridian policy excerpt becomes an
 * expressive TTS v3 narration (A/B against Multilingual v2), which is then dubbed
 * into five languages, and the section closes on the Studio-produced lip-synced
 * spokesperson video. Audio steps are fully API-driven; the video is embedded.
 */
export function CreativeStudio() {
  const [sourceText, setSourceText] = useState(SOURCE_DEFAULT);
  const [script, setScript] = useState("");
  const [genScript, setGenScript] = useState(false);

  const [narrationModel, setNarrationModel] = useState<string>(V3_MODEL_ID);
  const [genNarration, setGenNarration] = useState(false);
  const [narrationBlob, setNarrationBlob] = useState<Blob | null>(null);

  const [current, setCurrent] = useState<AudioItem | null>(null);
  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [dubs, setDubs] = useState<Record<string, DubState>>({});
  const [error, setError] = useState<string | null>(null);

  // Read the latest selected language inside async polling closures.
  const selectedLangRef = useRef(selectedLang);
  useEffect(() => {
    selectedLangRef.current = selectedLang;
  }, [selectedLang]);

  const narrationItemRef = useRef<AudioItem | null>(null);

  const generateScript = useCallback(async () => {
    if (!sourceText.trim()) return;
    setError(null);
    setGenScript(true);
    try {
      const res = await fetch("/api/creative/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText }),
      });
      if (!res.ok) throw new Error("Script generation failed.");
      const { script: s } = await res.json();
      setScript(s ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Script generation failed.");
    } finally {
      setGenScript(false);
    }
  }, [sourceText]);

  const generateNarration = useCallback(async () => {
    if (!script.trim()) return;
    setError(null);
    setGenNarration(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: script,
          voiceId: DEFAULT_VOICE_ID,
          modelId: narrationModel,
        }),
      });
      if (!res.ok) throw new Error("Narration generation failed.");
      const blob = await res.blob();
      setNarrationBlob(blob);
      const url = URL.createObjectURL(blob);
      const item = { id: "narration", src: url };
      narrationItemRef.current = item;
      setCurrent(item);
      setSelectedLang("en");
      setDubs({}); // narration changed — clear stale dubs
    } catch (err) {
      setError(err instanceof Error ? err.message : "Narration generation failed.");
    } finally {
      setGenNarration(false);
    }
  }, [script, narrationModel]);

  /** Kick off (or replay) a dub for a target language, polling until ready. */
  const startDub = useCallback(
    async (code: string) => {
      if (!narrationBlob) {
        setError("Generate the narration first.");
        return;
      }
      setError(null);
      setDubs((prev) => ({ ...prev, [code]: { state: "dubbing" } }));
      try {
        const form = new FormData();
        form.append("file", narrationBlob, "narration.mp3");
        form.append("targetLang", code);
        form.append("sourceLang", "en");
        const createRes = await fetch("/api/creative/dub", {
          method: "POST",
          body: form,
        });
        if (!createRes.ok) throw new Error("create failed");
        const { dubbingId } = await createRes.json();

        // Poll status (dubbing is asynchronous and can take a few minutes).
        for (let i = 0; i < 90; i++) {
          await sleep(4000);
          const statusRes = await fetch(`/api/creative/dub/${dubbingId}`);
          const { status } = await statusRes.json();
          if (status === "dubbed") {
            const audioRes = await fetch(
              `/api/creative/dub/${dubbingId}/audio?lang=${code}`,
            );
            const url = URL.createObjectURL(await audioRes.blob());
            setDubs((prev) => ({ ...prev, [code]: { state: "ready", url } }));
            if (selectedLangRef.current === code) {
              setCurrent({ id: `dub-${code}`, src: url });
            }
            return;
          }
          if (status === "failed") throw new Error("dubbing failed");
        }
        throw new Error("dubbing timed out");
      } catch {
        setDubs((prev) => ({ ...prev, [code]: { state: "error" } }));
      }
    },
    [narrationBlob],
  );

  const selectLang = useCallback(
    (code: string) => {
      setSelectedLang(code);
      if (code === "en") {
        setCurrent(narrationItemRef.current);
        return;
      }
      const dub = dubs[code];
      if (dub?.url) {
        setCurrent({ id: `dub-${code}`, src: dub.url });
      } else if (dub?.state !== "dubbing") {
        void startDub(code);
      }
    },
    [dubs, startDub],
  );

  return (
    <div className="flex flex-col gap-8">
      {/* 1 — Source → script */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground/70">
          1 · Source → narration script
        </h3>
        <Textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <div>
          <Button onClick={generateScript} disabled={genScript}>
            {genScript ? "Writing…" : "Generate script"}
          </Button>
        </div>
        {script && (
          <Textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={6}
            className="resize-none font-mono text-xs"
          />
        )}
      </section>

      {/* 2 — Narration (A/B v3 vs Multilingual v2) */}
      {script && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground/70">
            2 · Expressive narration
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-foreground/60">Model:</span>
            <Button
              size="sm"
              variant={narrationModel === V3_MODEL_ID ? "default" : "outline"}
              onClick={() => setNarrationModel(V3_MODEL_ID)}
            >
              v3 (expressive)
            </Button>
            <Button
              size="sm"
              variant={
                narrationModel === MULTILINGUAL_MODEL_ID ? "default" : "outline"
              }
              onClick={() => setNarrationModel(MULTILINGUAL_MODEL_ID)}
            >
              Multilingual v2
            </Button>
            <Button onClick={generateNarration} disabled={genNarration}>
              {genNarration ? "Generating…" : "Generate narration"}
            </Button>
          </div>
        </section>
      )}

      {/* 3 — Localisation + player */}
      {narrationBlob && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground/70">
            3 · Localisation
          </h3>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => {
              const dub = dubs[lang.code];
              const isActive = selectedLang === lang.code;
              const status =
                lang.code === "en"
                  ? "ready"
                  : (dub?.state ?? "idle");
              return (
                <Button
                  key={lang.code}
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  onClick={() => selectLang(lang.code)}
                  disabled={status === "dubbing"}
                >
                  {lang.label}
                  {status === "dubbing" && " · dubbing…"}
                  {status === "error" && " · failed"}
                </Button>
              );
            })}
          </div>

          <div className="rounded-lg border border-border p-4">
            <AudioPlayerProvider>
              <div className="flex items-center gap-3">
                <AudioPlayerButton item={current ?? undefined} size="icon" />
                <AudioPlayerTime />
                <AudioPlayerProgress className="flex-1" />
                <AudioPlayerDuration />
              </div>
            </AudioPlayerProvider>
          </div>
        </section>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* 4 — Video finale (Studio-produced, embedded) */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground/70">
          4 · Spokesperson video — the finale
        </h3>
        <video
          controls
          className="mx-auto max-h-[24rem] w-auto max-w-full rounded-lg border border-border bg-black/40"
          poster="/meridian/spokesperson.png"
        >
          <source src="/meridian/spokesperson.mp4" type="video/mp4" />
        </video>
        <p className="text-xs text-foreground/50">
          Produced in ElevenCreative → <strong>Image &amp; Video → Lip sync</strong>{" "}
          (paid tier): a spokesperson — a prebuilt Avatar (e.g. Sofia/Sem) or a
          generated Meridian image — driven by the localised narration as{" "}
          <strong>Speech</strong> → exported as a 720p MP4. Drop it at{" "}
          <code>public/meridian/spokesperson.mp4</code> (and a poster at{" "}
          <code>public/meridian/spokesperson.png</code>) and it plays here.
        </p>
      </section>
    </div>
  );
}
