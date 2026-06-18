import Link from "next/link";
import { SECTIONS } from "@/lib/sections";

/**
 * Landing page — frames the Meridian scenario and links into the three pillars,
 * branded to match the ElevenLabs product switcher (name + orb + tagline).
 */
export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Meridian — one member journey, three ElevenLabs pillars
        </h1>
        <p className="max-w-2xl text-sm text-foreground/70">
          A single Next.js app threading one member-services scenario through the
          raw models (ElevenAPI), a live voice agent (ElevenAgents), and a
          localised content engine that ends on a generated video
          (ElevenCreative).
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex flex-col gap-3 rounded-lg border border-border p-5 transition-colors hover:bg-white/5"
          >
            <span
              className={`size-9 rounded-full bg-gradient-to-br ${s.gradient}`}
              aria-hidden
            />
            <h2 className="text-sm font-semibold">{s.name}</h2>
            <p className="text-xs text-foreground/60">{s.tagline}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
