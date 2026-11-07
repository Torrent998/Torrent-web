import Link from "next/link";
import type { ReactNode } from "react";
import { FAQS, FEATURES, ORG_URL, REPOS, STATUS, STEPS, WAVE_ISSUES_URL, type Feature } from "@/lib/site";
import { IconArrowRight, IconExternal, IconGithub, IconKey, IconLedger, IconPlus, IconReplay, IconShield, IconStatus, IconSwap } from "../icons";
import { PoolVisual } from "./pool-visual";
import { Reveal } from "./reveal";

const wrap = "mx-auto max-w-6xl px-4 sm:px-6";
export const ctaPrimary = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-brand-ink transition hover:-translate-y-0.5 hover:bg-brand-hover active:translate-y-0";
export const ctaSecondary = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line-strong px-6 py-3 font-semibold transition hover:-translate-y-0.5 hover:bg-bg-subtle active:translate-y-0";

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-text">{children}</p>;
}

function SectionHead({ id, eyebrow, title, lede }: { id: string; eyebrow: string; title: string; lede: ReactNode }) {
  return (
    <Reveal className="max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 id={`${id}-title`} className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h2>
      <p className="mt-4 text-lg text-muted text-pretty">{lede}</p>
    </Reveal>
  );
}

/* ---------------------------------------------------------------- Hero */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div aria-hidden className="dot-field pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      {/* brand motif: rounded flow bars */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
        <span className="absolute -right-24 top-28 h-6 w-[30rem] rounded-full bg-brand/15" />
        <span className="absolute -right-8 top-44 h-6 w-64 rounded-full bg-accent/30" />
        <span className="absolute -left-40 bottom-16 h-6 w-[26rem] rounded-full bg-brand/10" />
      </div>
      <div className={`${wrap} relative grid items-center gap-14 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-28`}>
        <div>
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur sm:text-sm">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden />Built on Stellar Soroban · Open source · Testnet prototype
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 id="hero-title" className="mt-6 text-[2.5rem] font-extrabold leading-[1.05] tracking-tight text-balance sm:text-6xl">
              Payout rights that are <span className="text-brand-text">funded before they exist.</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-lg text-muted text-pretty sm:text-xl">
              Torrent lets a savings circle lock its money in a Soroban escrow pool first, then issue payout rights against it.
              Members can trade <em className="not-italic font-semibold text-fg">when</em> they get paid, never <em className="not-italic font-semibold text-fg">whether</em> the money is there.
            </p>
          </Reveal>
          <Reveal delay={240} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/circles" className={ctaPrimary}>Launch app <IconArrowRight width={18} height={18} /></Link>
            <a href={ORG_URL} className={ctaSecondary}><IconGithub width={18} height={18} /> View the source</a>
          </Reveal>
          <Reveal delay={320}>
            <ul className="mt-10 flex max-w-xl flex-wrap gap-x-6 gap-y-3 text-sm text-muted" aria-label="Project facts">
              <li className="flex items-center gap-2"><IconShield width={16} height={16} className="text-brand-text" />Backing invariant on-chain</li>
              <li className="flex items-center gap-2"><IconLedger width={16} height={16} className="text-brand-text" />Ledger-derived state</li>
              <li className="flex items-center gap-2"><IconGithub width={16} height={16} className="text-brand-text" />4 MIT repositories</li>
            </ul>
          </Reveal>
        </div>
        <Reveal delay={200}><PoolVisual /></Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- How it works */
export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-it-works-title" className="scroll-mt-20 border-y border-line bg-bg-subtle py-20 sm:py-28">
      <div className={wrap}>
        <SectionHead id="how-it-works" eyebrow="How it works" title="Four steps, each one enforced on-chain"
          lede="The off-chain API organizes people and requests. The Soroban contract decides what actually happens to money and ownership." />
        <ol className="relative mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <span aria-hidden className="absolute left-0 right-0 top-[2.15rem] hidden h-px bg-line-strong lg:block" />
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 90} className="group relative">
              <div className="h-full rounded-3xl border border-line bg-card p-6 shadow-card transition duration-300 group-hover:-translate-y-1 group-hover:border-brand/60">
                <span className="num relative inline-flex size-11 items-center justify-center rounded-2xl bg-ink text-sm font-medium text-brand ring-4 ring-bg-subtle">{s.n}</span>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
                  <span className="mb-1.5 block font-semibold uppercase tracking-wider">Contract call</span>
                  <code className="num text-[12px] text-fg">{s.onChain}</code>
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Features */
const ICONS: Record<Feature["icon"], typeof IconShield> = { shield: IconShield, ledger: IconLedger, status: IconStatus, key: IconKey, swap: IconSwap, replay: IconReplay };

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-20 py-20 sm:py-28">
      <div className={wrap}>
        <SectionHead id="features" eyebrow="Features" title="Financial truth first, interface second"
          lede="Every number in the app traces back to the ledger, and every state says exactly how final it is." />
        <ul className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = ICONS[f.icon];
            return (
              <Reveal as="li" key={f.title} delay={(i % 3) * 80} className="group bg-card p-7 transition-colors hover:bg-elevated">
                <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-brand-soft text-brand-text transition-transform duration-300 group-hover:scale-110"><Icon /></span>
                <h3 className="mt-5 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- Trust & safety */
export function Safety() {
  return (
    <section id="safety" aria-labelledby="safety-title" className="scroll-mt-20 border-y border-paper/10 bg-ink py-20 text-paper sm:py-28">
      <div className={`${wrap} grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-16`}>
        <div>
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">Trust and safety</p>
            <h2 id="safety-title" className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">One invariant, checked after every call</h2>
            <p className="mt-4 text-lg text-paper/70 text-pretty">
              The escrow contract refuses any deposit, issuance, transfer or claim that would leave a right uncovered.
              It is tested with property tests over random sequences of actions.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-8 rounded-3xl border border-paper/10 bg-paper/[0.04] p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-paper/60">Backing invariant</p>
              <p className="num mt-3 text-lg leading-relaxed text-accent sm:text-xl">reserved ≤ funded − claimed − withdrawn</p>
              <ul className="mt-5 grid gap-2.5 text-sm text-paper/80">
                <li>Rights can only be issued against escrowed tokens.</li>
                <li>An old owner cannot claim after a transfer.</li>
                <li>Nothing is claimable before maturity, or twice.</li>
                <li>No operator backdoor un-reserves an issued right.</li>
              </ul>
            </div>
          </Reveal>
        </div>
        <Reveal delay={160}>
          <div className="rounded-3xl border border-paper/10 bg-paper/[0.04] p-2">
            <h3 className="px-4 pb-2 pt-4 text-lg font-semibold">Status, plainly</h3>
            <dl className="divide-y divide-paper/10">
              {STATUS.map((s) => (
                <div key={s.item} className="grid gap-1.5 px-4 py-4 sm:grid-cols-[9rem_1fr] sm:gap-4">
                  <dt className="text-sm text-paper/60">{s.item}</dt>
                  <dd>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${{ good: "bg-brand/15 text-brand", warn: "bg-amber-300/15 text-amber-200", bad: "bg-red-400/15 text-red-200", neutral: "bg-paper/10 text-paper" }[s.tone]}`}>{s.state}</span>
                    <p className="mt-1.5 text-sm text-paper/70">{s.note}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------- Architecture / open source */
export function OpenSource() {
  const [contracts, indexer, api, web] = REPOS;
  return (
    <section id="open-source" aria-labelledby="open-source-title" className="scroll-mt-20 py-20 sm:py-28">
      <div className={wrap}>
        <SectionHead id="open-source" eyebrow="Architecture and open source" title="Four repositories, one source of truth"
          lede={<>Each repository owns one boundary, ships its own tests and CI, and publishes a versioned interface its siblings test against. The contract is the only source of truth for backing, ownership and payout.</>} />

        <Reveal delay={80}>
          <div className="mt-12 rounded-3xl border border-line bg-bg-subtle p-4 sm:p-8" role="img"
            aria-label="Data flow: torrent-web calls torrent-api; torrent-api reads ledger state from torrent-indexer; users sign transactions for torrent-contracts on Stellar; torrent-indexer reads contract events from Stellar RPC.">
            <div aria-hidden className="grid items-center gap-3 text-sm md:grid-cols-[1fr_auto_1fr_auto_1fr]">
              <Node name="Torrent-web" sub="Next.js app" />
              <Arrow label="HTTPS · OpenAPI v1" />
              <Node name="Torrent-api" sub="Circles + signing requests" />
              <Arrow label="read models" reverse />
              <Node name="Torrent-indexer" sub="Ledger-derived state" />
            </div>
            <div aria-hidden className="mt-3 grid items-center gap-3 text-sm md:grid-cols-[1fr_auto_1fr_auto_1fr]">
              <div className="hidden md:block" />
              <div className="hidden md:block" />
              <p className="text-center text-xs text-muted">↓ Submits transactions the user signed</p>
              <div className="hidden md:block" />
              <p className="text-center text-xs text-muted">↑ Contract events via Stellar RPC</p>
            </div>
            <div aria-hidden className="mt-3 rounded-2xl border border-brand/50 bg-card p-4 text-center">
              <p className="font-semibold">Torrent-contracts <span className="font-normal text-muted">· Soroban escrow on Stellar</span></p>
              <p className="mt-1 text-xs text-muted">Custody, payout rights, transfers and claims. The only writer of financial truth.</p>
            </div>
          </div>
        </Reveal>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {[contracts, indexer, api, web].map((r, i) => r && (
            <Reveal as="li" key={r.name} delay={(i % 2) * 80}>
              <a href={r.url} className="group flex h-full flex-col rounded-3xl border border-line bg-card p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:border-brand/60">
                <div className="flex items-center gap-3">
                  <IconGithub className="text-muted" />
                  <span className="font-semibold">Torrent998/{r.name}</span>
                  <IconExternal width={16} height={16} className="ml-auto text-muted transition group-hover:text-brand-text" />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">{r.role}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-5 text-xs">
                  <span className="rounded-full bg-bg-subtle px-2.5 py-1 font-medium">{r.stack}</span>
                  <span className="num rounded-full bg-bg-subtle px-2.5 py-1">{r.boundary}</span>
                  <span className="rounded-full bg-bg-subtle px-2.5 py-1">MIT</span>
                </div>
              </a>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Node({ name, sub }: { name: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4 text-center shadow-card">
      <p className="font-semibold">{name}</p>
      <p className="mt-0.5 text-xs text-muted">{sub}</p>
    </div>
  );
}
function Arrow({ label, reverse = false }: { label: string; reverse?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 px-1 text-muted">
      <span className="text-center text-[11px] leading-tight">{label}</span>
      <span className="rotate-90 text-lg leading-none md:rotate-0">{reverse ? "⇄" : "→"}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ FAQ */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 border-t border-line bg-bg-subtle py-20 sm:py-28">
      <div className={`${wrap} grid gap-12 lg:grid-cols-[1fr_1.6fr]`}>
        <SectionHead id="faq" eyebrow="FAQ" title="Questions, answered honestly" lede={<>Something missing? Open an issue on <a className="font-medium text-brand-text underline underline-offset-4" href={ORG_URL}>GitHub</a>.</>} />
        <div className="grid gap-3">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={i * 40}>
              <details className="group rounded-2xl border border-line bg-card px-5 transition-colors open:border-line-strong">
                <summary className="flex min-h-14 cursor-pointer items-center gap-4 py-4 font-semibold">
                  <span className="flex-1">{f.q}</span>
                  <span className="faq-icon inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-subtle text-muted transition-transform duration-300"><IconPlus width={16} height={16} /></span>
                </summary>
                <p className="pb-5 pr-10 text-muted">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Final CTA */
export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className={`${wrap} pt-20 sm:pt-28`}>
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] border border-paper/10 bg-ink px-6 py-14 text-center text-paper sm:px-12 sm:py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <span className="absolute -left-16 top-10 h-5 w-80 rounded-full bg-brand/20" />
            <span className="absolute -right-20 bottom-12 h-5 w-96 rounded-full bg-accent/15" />
          </div>
          <h2 id="cta-title" className="relative text-3xl font-bold tracking-tight text-balance sm:text-4xl">See every number trace back to the ledger</h2>
          <p className="relative mx-auto mt-4 max-w-2xl text-paper/70 text-pretty">
            The app talks to a running <code className="num text-accent">torrent-api</code>. Run the four services locally against Stellar Testnet,
            or read the code and pick up a scoped contributor issue.
          </p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/circles" className={ctaPrimary}>Launch app <IconArrowRight width={18} height={18} /></Link>
            <a href={WAVE_ISSUES_URL} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-paper/25 px-6 py-3 font-semibold transition hover:-translate-y-0.5 hover:bg-paper/10">Contribute</a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
