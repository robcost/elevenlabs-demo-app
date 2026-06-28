"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ElevenHeaderInfo } from "@/lib/eleven-headers";

/**
 * Shows the region the ElevenLabs API served a request from — read from the
 * `x-region` response header — with a toggle to reveal the full set of headers
 * ElevenLabs returned (for debugging / demoing residency). Renders nothing until
 * an ElevenLabs-backed request has completed.
 *
 * @param info - parsed header info from `readElevenHeaders`, or null.
 */
export function ElevenRegion({ info }: { info: ElevenHeaderInfo | null }) {
  const [open, setOpen] = useState(false);
  if (!info) return null;

  const entries = Object.entries(info.headers).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-secondary/30 px-3 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <Globe className="size-3.5 text-foreground/50" aria-hidden />
        <span className="text-foreground/70">
          ElevenLabs region:{" "}
          <code className="font-medium text-foreground">
            {info.region ?? "unknown"}
          </code>
        </span>
        <span className="text-foreground/40">
          (from the <code>x-region</code> response header)
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto h-6 px-2 text-xs"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Hide headers" : "Show headers"}
        </Button>
      </div>

      {open && (
        <div className="overflow-x-auto rounded border border-border bg-background/60">
          <table className="w-full border-collapse text-left font-mono text-[11px]">
            <tbody>
              {entries.map(([key, value]) => (
                <tr key={key} className="border-b border-border/50 last:border-0">
                  <td className="whitespace-nowrap px-2 py-1 align-top text-foreground/60">
                    {key}
                  </td>
                  <td className="px-2 py-1 break-all text-foreground/90">
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
