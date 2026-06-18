"use client";

import { ConversationProvider } from "@elevenlabs/react";

/**
 * Scopes the realtime `ConversationProvider` to the Agents subtree only
 * (plan §3.3) — the other sections don't need the conversation context, so it
 * is not mounted app-wide.
 */
export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConversationProvider>{children}</ConversationProvider>;
}
