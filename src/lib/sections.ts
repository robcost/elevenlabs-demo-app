/**
 * The three product-pillar sections, named and described to match the
 * ElevenLabs product switcher (ElevenAPI / ElevenAgents / ElevenCreative).
 *
 * Ordered bottom-up to match the demo narrative (building blocks → conversation
 * → content). The `gradient` approximates each product's brand orb colour and is
 * applied to a rounded element as a lightweight orb icon. Shared by the nav, the
 * landing cards, and each section header so the branding stays in sync.
 */
export type Section = {
  href: string;
  name: string;
  tagline: string;
  /** Tailwind gradient classes for the section's orb icon. */
  gradient: string;
};

export const SECTIONS: readonly Section[] = [
  {
    href: "/api",
    name: "ElevenAPI",
    tagline: "Build with our leading AI audio models",
    gradient: "from-zinc-200 via-zinc-400 to-zinc-600",
  },
  {
    href: "/agents",
    name: "ElevenAgents",
    tagline: "Deploy and monitor conversational agents",
    gradient: "from-sky-400 via-emerald-400 to-blue-500",
  },
  {
    href: "/creative",
    name: "ElevenCreative",
    tagline: "Create, edit and localize content with AI",
    gradient: "from-amber-400 via-pink-500 to-purple-500",
  },
] as const;
