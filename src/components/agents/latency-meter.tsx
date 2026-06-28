"use client";

import { Activity } from "lucide-react";

/** A tiny inline SVG sparkline of recent values (no chart dependency). */
function Sparkline({
  values,
  width = 140,
  height = 32,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  if (values.length < 2) {
    return <svg width={width} height={height} aria-hidden />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - 1 - ((v - min) / range) * (height - 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={width}
      height={height}
      className="text-emerald-500"
      aria-label="Latency over recent turns"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** One labelled stat in the latency readout. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wide text-foreground/40">
        {label}
      </span>
      <span className="font-mono text-sm tabular-nums text-foreground/90">
        {value}
      </span>
    </div>
  );
}

/**
 * Voice response-latency meter for the live agent. Each sample is the time from
 * the member's turn (their speech transcribed) to the agent starting to speak —
 * the real STT → LLM → TTS pipeline latency, measured from SDK turn events. Shows
 * a running last / min / max / average plus a sparkline of recent turns.
 *
 * @param samples - per-turn latencies in milliseconds (oldest → newest).
 * @param active - whether a call is in progress (drives the "measuring" hint).
 */
export function LatencyMeter({
  samples,
  active,
}: {
  samples: number[];
  active: boolean;
}) {
  if (!active && samples.length === 0) return null;

  const ms = (n: number) => `${Math.round(n)}ms`;
  const last = samples.length ? samples[samples.length - 1] : null;
  const min = samples.length ? Math.min(...samples) : null;
  const max = samples.length ? Math.max(...samples) : null;
  const avg = samples.length
    ? samples.reduce((a, b) => a + b, 0) / samples.length
    : null;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-secondary/30 px-3 py-2">
      <div className="flex items-center gap-2">
        <Activity className="size-3.5 text-foreground/50" aria-hidden />
        <span className="text-xs text-foreground/70">
          Voice response latency
        </span>
        <span className="text-[11px] text-foreground/40">
          (your turn → agent speaking · STT → LLM → TTS)
        </span>
      </div>

      {samples.length === 0 ? (
        <p className="text-xs text-foreground/40">
          Speak to the agent to start measuring…
        </p>
      ) : (
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <Stat label="last" value={ms(last!)} />
          <Stat label="min" value={ms(min!)} />
          <Stat label="max" value={ms(max!)} />
          <Stat label="avg" value={ms(avg!)} />
          <div className="ml-auto flex flex-col items-end gap-0.5">
            <Sparkline values={samples} />
            <span className="text-[10px] text-foreground/40">
              {samples.length} turn{samples.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
