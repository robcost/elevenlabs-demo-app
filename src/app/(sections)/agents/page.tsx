import { AgentConsole } from "@/components/agents/agent-console";

/**
 * Section 2 — ElevenAgents: "The Conversation" — the centerpiece (PRD §7.2).
 * Renders the live WebRTC agent console; the `ConversationProvider` is supplied
 * by this route's layout.
 */
export default function AgentsSection() {
  return <AgentConsole />;
}
