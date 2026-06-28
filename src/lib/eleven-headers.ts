/**
 * Capture and surface ElevenLabs response headers (region + full set) so the UI
 * can show **where** the ElevenLabs API served each request — the residency
 * story (DEC-2 / NFR-3) made visible — plus a debug view of every header.
 *
 * Our server routes proxy ElevenLabs, so the browser never sees ElevenLabs'
 * response directly. Each route copies the relevant ElevenLabs response headers
 * onto OUR response (via {@link buildForwardHeaders}); the client reads them
 * back with {@link readElevenHeaders}. Pure/isomorphic — no Node or browser-only
 * APIs, so it imports cleanly on both sides.
 */

/** The ElevenLabs response header that carries the serving region. */
export const REGION_SOURCE_HEADER = "x-region";

/** Header we set on our own response carrying the region, for convenience. */
export const FWD_REGION_HEADER = "x-eleven-region";

/** Header we set on our own response carrying all ElevenLabs headers (encoded). */
export const FWD_HEADERS_HEADER = "x-eleven-headers";

/** Parsed view of an ElevenLabs response's headers for the UI. */
export type ElevenHeaderInfo = {
  /** Value of the ElevenLabs `x-region` header, or null if absent. */
  region: string | null;
  /** Every header from the ElevenLabs response, lower-cased keys. */
  headers: Record<string, string>;
};

/**
 * Build the headers to attach to our own `Response`, copying the region and the
 * full header set from an ElevenLabs response. Call on the server.
 *
 * @param source - the `Headers` from the ElevenLabs response (raw fetch or the
 *   SDK's `rawResponse.headers`).
 * @returns a plain header map to spread into a `ResponseInit`.
 */
export function buildForwardHeaders(source: Headers): Record<string, string> {
  const all: Record<string, string> = {};
  source.forEach((value, key) => {
    all[key] = value;
  });
  // Percent-encode the JSON so the value is always header-safe ASCII.
  const out: Record<string, string> = {
    [FWD_HEADERS_HEADER]: encodeURIComponent(JSON.stringify(all)),
  };
  const region = source.get(REGION_SOURCE_HEADER);
  if (region) out[FWD_REGION_HEADER] = region;
  return out;
}

/**
 * Read the ElevenLabs header info back from one of our responses. Call on the
 * client after a `fetch` to a route that uses {@link buildForwardHeaders}.
 *
 * @param res - the `Response` from a fetch to our API route.
 * @returns the parsed header info, or null if the route didn't forward headers.
 */
export function readElevenHeaders(res: Response): ElevenHeaderInfo | null {
  const raw = res.headers.get(FWD_HEADERS_HEADER);
  if (!raw) return null;
  try {
    const headers = JSON.parse(decodeURIComponent(raw)) as Record<
      string,
      string
    >;
    return {
      region: res.headers.get(FWD_REGION_HEADER) ?? headers[REGION_SOURCE_HEADER] ?? null,
      headers,
    };
  } catch {
    return null;
  }
}
