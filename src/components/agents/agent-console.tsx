"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { Matrix } from "@/components/ui/matrix";
import { MicSelector } from "@/components/ui/mic-selector";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ui/conversation";
import { Message, MessageContent } from "@/components/ui/message";
import { Response } from "@/components/ui/response";
import { SectionHeader } from "@/components/section-header";
import { LatencyMeter } from "./latency-meter";
import { ElevenRegion } from "@/components/eleven-region";
import {
  readElevenHeaders,
  type ElevenHeaderInfo,
} from "@/lib/eleven-headers";
import { clientTools } from "./client-tools";

/** A single line in the live transcript. `role` comes from the SDK MessagePayload. */
type TranscriptEntry = { role: "user" | "agent"; message: string };

/**
 * Sample questions whose answers live in the Meridian knowledge base — a correct
 * answer demonstrates RAG retrieval (waiting periods, claim timeframes, billing).
 */
const SAMPLE_QUESTIONS = [
  "What's the waiting period for cruciate ligament conditions on pet cover?",
  "How long does a claim decision take once you've got all my documents?",
  "What happens if I miss a premium payment?",
] as const;

/**
 * Live in-browser member-services voice agent console (PRD §7.2 / FR-AGT-3..7).
 *
 * Connects to the private Meridian agent over **WebRTC** using a server-minted
 * conversation token (so the API key never reaches the browser, NFR-1), renders
 * a voice orb + live transcript, exposes mic-mute, and registers the mock client
 * tools. Must be rendered inside a `ConversationProvider` (see the route layout).
 */
export function AgentConsole() {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [micDeviceId, setMicDeviceId] = useState<string>("");
  const [region, setRegion] = useState<ElevenHeaderInfo | null>(null);
  const [latencies, setLatencies] = useState<number[]>([]);
  // Timestamp of the member's most recent turn, anchoring the next latency sample.
  const pendingTurnAt = useRef<number | null>(null);

  const conversation = useConversation({
    clientTools,
    onConnect: ({ conversationId }) => setConversationId(conversationId),
    onMessage: ({ role, message }) => {
      setTranscript((prev) => [...prev, { role, message }]);
      // A user message = the member's turn was transcribed; start the latency clock.
      if (role === "user") pendingTurnAt.current = performance.now();
    },
    onModeChange: ({ mode }) => {
      // Agent began speaking after a member turn → record the response latency.
      if (mode === "speaking" && pendingTurnAt.current !== null) {
        const ms = performance.now() - pendingTurnAt.current;
        pendingTurnAt.current = null;
        setLatencies((prev) => [...prev, ms].slice(-40));
      }
    },
    onError: (message) => setError(message),
  });

  const { status, isSpeaking, isMuted, setMuted, sendUserMessage } =
    conversation;
  const isConnected = status === "connected";

  /** Request mic, mint a token, and open the WebRTC session — on a user gesture. */
  const start = useCallback(async () => {
    setError(null);
    setStarting(true);
    try {
      // Mic permission + user gesture are required before the AudioContext starts.
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const res = await fetch("/api/conversation-token");
      if (!res.ok) throw new Error("Could not get a conversation token.");
      setRegion(readElevenHeaders(res));
      const { conversationToken } = await res.json();
      if (!conversationToken) throw new Error("No conversation token returned.");

      setTranscript([]);
      setConversationId(null);
      setLatencies([]);
      pendingTurnAt.current = null;
      await conversation.startSession({
        conversationToken,
        connectionType: "webrtc",
      });
      if (micDeviceId) {
        await conversation.changeInputDevice({ inputDeviceId: micDeviceId });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start the conversation.",
      );
    } finally {
      setStarting(false);
    }
  }, [conversation, micDeviceId]);

  const end = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  /** Switch the active microphone; applies live if a call is in progress. */
  const handleMicChange = useCallback(
    (deviceId: string) => {
      setMicDeviceId(deviceId);
      if (status === "connected") {
        void conversation.changeInputDevice({ inputDeviceId: deviceId });
      }
    },
    [conversation, status],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <SectionHeader href="/agents" />
        <p className="text-sm text-foreground/60">
          Live Meridian member-services voice agent (WebRTC). Ask about cover,
          claim status, premiums, or request a callback.
        </p>
      </div>

      {/* Sample questions — grounded in the policy KB, so a good answer proves RAG */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-foreground/60">
          Try asking (answers live in the policy knowledge base):
        </span>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {SAMPLE_QUESTIONS.map((q) => (
            <Button
              key={q}
              size="sm"
              variant="outline"
              disabled={!isConnected}
              onClick={() => sendUserMessage(q)}
              className="h-auto whitespace-normal text-left text-xs"
            >
              {q}
            </Button>
          ))}
        </div>
        {!isConnected && (
          <span className="text-xs text-foreground/40">
            Start the call to send one as a message — or just ask aloud.
          </span>
        )}
      </div>

      {/* Orb + primary controls */}
      <div className="flex flex-col items-center gap-5 rounded-xl border border-black/10 py-10 dark:border-white/15">
        <div
          className={
            isConnected
              ? isSpeaking
                ? "text-emerald-500"
                : "text-sky-500"
              : "text-foreground/25"
          }
        >
          <ConversationVisualizer
            active={isConnected}
            getOutput={conversation.getOutputByteFrequencyData}
            getInput={conversation.getInputByteFrequencyData}
          />
        </div>
        <div className="text-sm text-foreground/70">
          {starting
            ? "Connecting…"
            : isConnected
              ? isSpeaking
                ? "Ava is speaking"
                : "Listening…"
              : "Not connected"}
        </div>

        <div className="flex items-center gap-3">
          {!isConnected ? (
            <Button
              onClick={start}
              disabled={starting || status === "connecting"}
            >
              Start call
            </Button>
          ) : (
            <>
              <MicSelector
                value={micDeviceId}
                onValueChange={handleMicChange}
                muted={isMuted}
                onMutedChange={setMuted}
              />
              <Button variant="destructive" onClick={end}>
                End call
              </Button>
            </>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {/* Voice response latency + region of the conversation-token mint */}
      <LatencyMeter samples={latencies} active={isConnected} />
      <ElevenRegion info={region} />

      {/* Live transcript */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-foreground/70">Transcript</h2>
        <Conversation className="h-80 rounded-lg border border-border">
          <ConversationContent>
            {transcript.length === 0 ? (
              <ConversationEmptyState
                title="No messages yet"
                description="Start the call and the conversation will appear here."
              />
            ) : (
              transcript.map((entry, i) => (
                <Message
                  key={i}
                  from={entry.role === "agent" ? "assistant" : "user"}
                >
                  <MessageContent>
                    {entry.role === "agent" ? (
                      <Response>{entry.message}</Response>
                    ) : (
                      entry.message
                    )}
                  </MessageContent>
                </Message>
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        {conversationId && !isConnected && (
          <p className="text-xs text-foreground/40">
            Conversation ID: <code>{conversationId}</code>
          </p>
        )}
      </section>
    </div>
  );
}

/** Number of Matrix columns in the audio visualizer. */
const MATRIX_COLS = 28;

/** Stable all-off levels for the idle/disconnected state. */
const ZERO_LEVELS = new Array<number>(MATRIX_COLS).fill(0);

/**
 * Buckets raw frequency byte arrays (0–255) into {@link MATRIX_COLS} normalised
 * levels (0–1), taking the per-column max of the agent's output audio and the
 * member's mic input so the bars react to whoever is speaking.
 */
function toLevels(out?: Uint8Array, inp?: Uint8Array): number[] {
  const bins = new Array<number>(MATRIX_COLS).fill(0);
  for (const data of [out, inp]) {
    if (!data || data.length === 0) continue;
    const binSize = Math.max(1, Math.floor(data.length / MATRIX_COLS));
    for (let c = 0; c < MATRIX_COLS; c++) {
      let sum = 0;
      let n = 0;
      for (let i = c * binSize; i < (c + 1) * binSize && i < data.length; i++) {
        sum += data[i];
        n++;
      }
      const v = n ? sum / n / 255 : 0;
      if (v > bins[c]) bins[c] = v;
    }
  }
  return bins.map((v) => Math.min(1, v * 1.4));
}

/**
 * Drives the ElevenLabs **Matrix** component as a live VU meter from the
 * conversation's audio. Owns its own per-frame state so the 60fps updates don't
 * re-render the parent console (transcript, controls).
 */
function ConversationVisualizer({
  active,
  getOutput,
  getInput,
}: {
  active: boolean;
  getOutput: () => Uint8Array;
  getInput: () => Uint8Array;
}) {
  const [levels, setLevels] = useState<number[]>(ZERO_LEVELS);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const tick = () => {
      let out: Uint8Array | undefined;
      let inp: Uint8Array | undefined;
      try {
        out = getOutput();
      } catch {}
      try {
        inp = getInput();
      } catch {}
      setLevels(toLevels(out, inp));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, getOutput, getInput]);

  return (
    <Matrix
      rows={7}
      cols={MATRIX_COLS}
      mode="vu"
      levels={active ? levels : ZERO_LEVELS}
      size={8}
      gap={3}
      ariaLabel="Conversation audio visualizer"
    />
  );
}
