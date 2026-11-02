import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Torrent — fully funded payout rights (Testnet)",
  description: "Savings-circle payout rights that only exist when the funds are escrowed on Stellar. Testnet and synthetic funds only.",
  icons: { icon: "/brand/icon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
        <div role="note" className="bg-amber-200 px-4 py-2 text-center text-sm text-black">
          Stellar <strong>Testnet</strong> prototype with synthetic funds only. Not financial advice, not a guarantee of any payout, not audited.
        </div>
        <header className="mx-auto flex max-w-5xl items-center gap-3 p-4">
          <Image src="/brand/mark.svg" alt="" width={32} height={32} unoptimized />
          <Link href="/" className="text-xl font-semibold">Torrent</Link>
          <nav aria-label="Main" className="ml-auto"><Link href="/circles" className="underline">Circles</Link></nav>
        </header>
        <main id="main" className="mx-auto max-w-5xl p-4"><Providers>{children}</Providers></main>
      </body>
    </html>
  );
}
