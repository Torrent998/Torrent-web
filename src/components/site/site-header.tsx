"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ORG_URL } from "@/lib/site";
import { IconArrowRight, IconClose, IconGithub, IconMenu } from "../icons";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const MARKETING = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#safety", label: "Safety" },
  { href: "/#open-source", label: "Open source" },
  { href: "/#faq", label: "FAQ" },
];
const APP = [
  { href: "/circles", label: "Circles" },
  { href: "/invitations", label: "Join a circle" },
];

export const isAppPath = (p: string | null) => !!p && (p.startsWith("/circles") || p.startsWith("/invitations"));

export function SiteHeader() {
  const pathname = usePathname();
  const inApp = isAppPath(pathname);
  const links = inApp ? APP : MARKETING;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const active = (href: string) => inApp && pathname?.startsWith(href);
  return (
    <header className={`sticky top-0 z-30 border-b transition-colors ${scrolled || open ? "border-line bg-bg/85 backdrop-blur-md" : "border-transparent bg-bg/0"}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined}
              className={`rounded-full px-3 py-2 text-sm font-medium transition hover:bg-bg-subtle hover:text-fg ${active(l.href) ? "bg-bg-subtle text-fg" : "text-muted"}`}>{l.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a href={ORG_URL} className="hidden size-10 items-center justify-center rounded-full border border-line text-fg transition hover:border-line-strong hover:bg-bg-subtle sm:inline-flex" aria-label="Torrent on GitHub">
            <IconGithub />
          </a>
          <ThemeToggle />
          {!inApp && (
            <Link href="/circles" className="hidden items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-ink transition hover:bg-brand-hover sm:inline-flex">
              Launch app <IconArrowRight width={16} height={16} />
            </Link>
          )}
          <button type="button" className="inline-flex size-10 items-center justify-center rounded-full border border-line md:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line px-4 pb-4 md:hidden">
          <ul className="grid gap-1 pt-2">
            {links.map((l) => (
              <li key={l.href}><Link href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 font-medium hover:bg-bg-subtle">{l.label}</Link></li>
            ))}
            <li><a href={ORG_URL} className="block rounded-xl px-3 py-3 font-medium hover:bg-bg-subtle">GitHub</a></li>
          </ul>
          {!inApp && <Link href="/circles" className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-brand px-4 py-3 font-semibold text-brand-ink">Launch app <IconArrowRight width={16} height={16} /></Link>}
        </nav>
      )}
    </header>
  );
}
