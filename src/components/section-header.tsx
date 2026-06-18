import { SECTIONS } from "@/lib/sections";

/**
 * Branded section header (orb icon + ElevenLabs product name + tagline), matching
 * the ElevenLabs product switcher. Looks the section up by its route `href`.
 */
export function SectionHeader({ href }: { href: string }) {
  const section = SECTIONS.find((s) => s.href === href);
  if (!section) return null;
  return (
    <header className="flex items-center gap-3">
      <span
        className={`size-10 shrink-0 rounded-full bg-gradient-to-br ${section.gradient}`}
        aria-hidden
      />
      <div className="flex flex-col">
        <h1 className="text-xl font-semibold tracking-tight">{section.name}</h1>
        <p className="text-sm text-foreground/60">{section.tagline}</p>
      </div>
    </header>
  );
}
