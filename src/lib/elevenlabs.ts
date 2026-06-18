import { ElevenLabsClient, ElevenLabsEnvironment } from "@elevenlabs/elevenlabs-js";

/**
 * Lazily-constructed, shared server-side ElevenLabs client.
 *
 * Constructed on first use (not at module load) so that importing this module
 * during `next build` / page-data collection does not throw when
 * `ELEVENLABS_API_KEY` is absent — the SDK constructor requires the key. At
 * request time the key is read automatically from `process.env.ELEVENLABS_API_KEY`
 * and therefore **never reaches the browser** (PRD NFR-1).
 *
 * The region is pinned to the US residency endpoint (`api.us.elevenlabs.io`) per
 * DEC-2. The SDK also exposes `ProductionEu` / `ProductionSingapore` /
 * `ProductionIndia` for the residency talk-track (PRD NFR-3).
 *
 * @remarks Call only from server code (route handlers, server components).
 * @returns The shared {@link ElevenLabsClient} instance.
 */
let client: ElevenLabsClient | null = null;

export function getElevenLabs(): ElevenLabsClient {
  if (!client) {
    client = new ElevenLabsClient({
      environment: ElevenLabsEnvironment.ProductionUs,
    });
  }
  return client;
}
