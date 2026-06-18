/**
 * Mock client-tool implementations for the Meridian agent (FR-AGT-5).
 *
 * These run **in the browser** (client tools — no public ingress needed) and
 * return a natural-language string that the agent reads back to the member,
 * because the dashboard tools have "Wait for response" enabled.
 *
 * They are deliberate, clearly-labelled MOCKS — there is no real claims/booking
 * backend. Results are **deterministic** (derived from the inputs) so the demo
 * is reproducible rather than random. The returned strings are written for
 * speech (no markup), and stay consistent with the policy knowledge base.
 *
 * The keys of {@link clientTools} must match the client-tool names configured in
 * the ElevenAgents dashboard: `check_claim_status` and `book_callback`.
 */

/** Possible claim states, matching policy doc 02 (claims). */
const CLAIM_STATES = [
  {
    status: "Received",
    next: "It has been logged and acknowledged, and an assessor will pick it up shortly.",
  },
  {
    status: "Under Assessment",
    next: "An assessor is reviewing the submitted documents, and a decision is expected within ten business days of all documents being received.",
  },
  {
    status: "Information Requested",
    next: "We are waiting on a few more documents before we can proceed, so please check your email for the list of what's needed.",
  },
  {
    status: "Approved",
    next: "The claim has been accepted and payment is being arranged, usually within five business days.",
  },
  {
    status: "Paid",
    next: "The benefit has been paid to the nominated account.",
  },
] as const;

/** Small deterministic hash over a string (no randomness, for reproducible demos). */
function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Mock claim-status lookup. Picks a deterministic status from the member id so
 * the same id always returns the same result.
 *
 * @param memberId - the verified Meridian member id (e.g. `M12345678`).
 * @returns A spoken-style status sentence for the agent to read back.
 */
function checkClaimStatus(memberId: string): string {
  const digits = memberId.replace(/\D/g, "");
  const ref = digits.slice(-6) || "000000";
  const state = CLAIM_STATES[hash(memberId) % CLAIM_STATES.length];
  return `Claim reference C-L-M ${ref}: the current status is ${state.status}. ${state.next}`;
}

/**
 * Mock callback booking. Produces a deterministic reference number.
 *
 * @param phone - the member's contact number.
 * @param preferredTime - the requested callback time (within business hours).
 * @returns A spoken-style confirmation for the agent to read back.
 */
function bookCallback(phone: string, preferredTime: string): string {
  const ref = (hash(phone + preferredTime) % 10000).toString().padStart(4, "0");
  return `Your callback is booked. A Meridian specialist will call ${phone} at ${preferredTime}. Your reference number is M-C-B ${ref}.`;
}

/**
 * Client tools registered with `useConversation`. Keys must match the dashboard
 * tool names; each returns a string the agent speaks back to the member.
 */
export const clientTools: Record<
  string,
  (parameters: Record<string, unknown>) => string
> = {
  check_claim_status: (p) => checkClaimStatus(String(p.member_id ?? "")),
  book_callback: (p) =>
    bookCallback(String(p.phone ?? ""), String(p.preferred_time ?? "")),
};
