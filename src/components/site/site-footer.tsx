import Link from "next/link";
import { ORG_URL, REPOS, repoFile } from "@/lib/site";
import { Logo } from "./logo";

export function SiteFooter() {
  const col = "grid content-start gap-2.5 text-sm";
  const a = "text-muted transition hover:text-fg";
  return (
    <footer className="mt-24 border-t border-line bg-bg-subtle">
      <div className="mx-auto grid max-w-6xl gap-10 grid-cols-2 px-4 py-14 sm:grid-cols-3 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 grid content-start gap-4 sm:col-span-3 md:col-span-1">
          <Logo />
          <p className="max-w-xs text-sm text-muted">Ownership of when money becomes available. Fully backed savings-circle payout rights on Stellar.</p>
          <p className="max-w-xs text-xs text-muted">Stellar Testnet prototype with synthetic funds. Not audited. Not financial advice. Not a guarantee of any payout.</p>
        </div>
        <nav aria-label="Product" className={col}>
          <h2 className="font-semibold">Product</h2>
          <Link className={a} href="/#how-it-works">How it works</Link>
          <Link className={a} href="/#safety">Safety and status</Link>
          <Link className={a} href="/#faq">FAQ</Link>
          <Link className={a} href="/circles">Launch app</Link>
        </nav>
        <nav aria-label="Repositories" className={col}>
          <h2 className="font-semibold">Open source</h2>
          {REPOS.map((r) => <a key={r.name} className={a} href={r.url}>{r.name}</a>)}
          <a className={a} href={ORG_URL}>GitHub organization</a>
        </nav>
        <nav aria-label="Project" className={col}>
          <h2 className="font-semibold">Project</h2>
          <a className={a} href={repoFile("CONTRIBUTING.md")}>Contributing</a>
          <a className={a} href={repoFile("docs/CONTRIBUTOR_ISSUES.md")}>Contributor issues</a>
          <a className={a} href={repoFile("SECURITY.md")}>Security policy</a>
          <a className={a} href={repoFile("LICENSE")}>MIT License</a>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted sm:px-6">© 2026 Torrent contributors. Released under the MIT License.</p>
      </div>
    </footer>
  );
}
