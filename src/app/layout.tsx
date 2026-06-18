import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { SECTIONS } from "@/lib/sections";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ElevenLabs Demo App",
  description:
    "One app, three ElevenLabs pillars — API, Agents, Creative — for the Meridian member-services scenario.",
};

/**
 * Root layout — renders the persistent three-tab shell (FR-PLT-1) around every
 * section. The realtime `ConversationProvider` is intentionally NOT mounted here;
 * it is scoped to the Agents (and composition) subtree only (plan §3.3).
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="border-b border-black/10 dark:border-white/15">
          <div className="mx-auto flex w-full max-w-5xl items-center gap-6 px-6 py-4">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              ElevenLabs Demo App
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              {SECTIONS.map((section) => (
                <Link
                  key={section.href}
                  href={section.href}
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-foreground/70 transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  <span
                    className={`size-4 rounded-full bg-gradient-to-br ${section.gradient}`}
                    aria-hidden
                  />
                  {section.name}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
