import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { THEME_BOOT_SCRIPT } from "@/components/site/theme-toggle";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Torrent — fully funded payout rights on Stellar (Testnet)",
  description: "Savings-circle payout rights that only exist when the funds are already escrowed in a Soroban contract on Stellar. Open source. Testnet and synthetic funds only.",
  icons: { icon: "/brand/icon.svg", apple: "/brand/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF8F1" },
    { media: "(prefers-color-scheme: dark)", color: "#00191C" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only z-50 rounded-full bg-brand px-4 py-2 font-semibold text-brand-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
        <div role="note" className="bg-ink px-4 py-2 text-center text-xs text-paper sm:text-sm">
          <span className="mr-2 inline-flex items-center gap-1.5 rounded-full bg-paper/10 px-2 py-0.5 font-semibold text-accent">
            <span aria-hidden className="size-1.5 rounded-full bg-brand" />Stellar Testnet
          </span>
          Prototype with synthetic funds only. Not financial advice, not a guarantee of any payout, not audited.
        </div>
        <SiteHeader />
        <main id="main"><Providers>{children}</Providers></main>
        <SiteFooter />
      </body>
    </html>
  );
}
