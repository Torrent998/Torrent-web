"use client";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { IconArrowRight } from "../icons";
import { Reveal } from "./reveal";

/*
 * Explanatory illustrations for the landing page. Everything here is a synthetic, labelled
 * example: four illustrative members, a 100-unit contribution and no real data, users or
 * partners. Motion is CSS (globally disabled under prefers-reduced-motion) plus an autoplay
 * timer that never starts when the visitor prefers reduced motion.
 */

const wrap = "mx-auto max-w-6xl px-4 sm:px-6";
const pill = "inline-flex min-h-10 items-center justify-center rounded-full border border-line-strong px-4 text-sm font-semibold transition hover:bg-bg-subtle";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function Head({ id, eyebrow, title, lede }: { id: string; eyebrow: string; title: string; lede: ReactNode }) {
  return (
    <Reveal className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-text">{eyebrow}</p>
      <h2 id={`${id}-title`} className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h2>
      <p className="mt-4 text-lg text-muted text-pretty">{lede}</p>
    </Reveal>
  );
}

/* --------------------------------------------------------------- shared */
export const MEMBERS = [
  { key: "A", name: "Ada", slot: "Jan", tone: "#42DEB4" },
  { key: "B", name: "Bola", slot: "Feb", tone: "#A5F9DE" },
  { key: "C", name: "Chidi", slot: "Mar", tone: "#7CCFE0" },
  { key: "D", name: "Dayo", slot: "Apr", tone: "#F3C969" },
] as const;
type MemberKey = (typeof MEMBERS)[number]["key"];

function Avatar({ m, size = 36, ring = false }: { m: (typeof MEMBERS)[number]; size?: number; ring?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden className="shrink-0">
      <circle cx="18" cy="18" r="17" fill={m.tone} stroke={ring ? "var(--fg)" : "transparent"} strokeWidth="2" />
      <circle cx="18" cy="14" r="5.5" fill="#00191C" opacity="0.85" />
      <path d="M8 29c2-5.5 6-8 10-8s8 2.5 10 8" fill="#00191C" opacity="0.85" />
    </svg>
  );
}

/* ================================================= 1. Savings-circle story */
export const STORY = [
  { title: "Everyone contributes", body: "Four members of an ajo / esusu / tanda each pay 100 into the circle's Soroban escrow. Nothing is promised yet." },
  { title: "The escrow verifies the money", body: "The contract checks that exactly 100 arrived for every deposit. Funded: 400. Reserved: 0." },
  { title: "Rights are issued per payout slot", body: "One payout right per slot (Jan to Apr), each 100. The contract refuses any right that unreserved escrow does not cover." },
  { title: "Bola swaps slots with Chidi", body: "Bola needs money sooner. Two transfers, each proposed by its owner and accepted by its recipient: four signatures in total, no new money." },
  { title: "Claims pay out at maturity", body: "When a slot matures, its current owner claims it exactly once. Reserved falls as each right is paid; the invariant holds throughout." },
] as const;

/** Owner of each slot after a given story step. Slots: Jan..Apr belong to A..D, swapped B<->C from step 3. */
export function slotOwner(slot: number, step: number): MemberKey {
  const base: MemberKey[] = ["A", "B", "C", "D"];
  if (step >= 3 && slot === 1) return "C";
  if (step >= 3 && slot === 2) return "B";
  return base[slot]!;
}

export function CircleStory() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { if (!prefersReducedMotion()) setPlaying(true); }, []);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setStep((s) => (s + 1) % STORY.length), 4200);
    return () => clearInterval(t);
  }, [playing]);
  const funded = step === 0 ? 0 : 400;
  const reserved = step < 2 ? 0 : step === 4 ? 200 : 400;
  const claimed = step === 4 ? 200 : 0;
  const held = funded - claimed;
  const go = (i: number) => { setPlaying(false); setStep(i); };

  return (
    <section id="circle-story" aria-labelledby="circle-story-title" className="scroll-mt-20 py-20 sm:py-28">
      <div className={wrap}>
        <Head id="circle-story" eyebrow="A savings circle, step by step" title="From contributions to payouts, with the money there first"
          lede="An illustrated example with four synthetic members. Use the steps or let it play." />
        <Reveal className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <figure className="rounded-[1.75rem] border border-line bg-card p-4 shadow-card sm:p-6" aria-labelledby="story-caption">
            {/* members */}
            <div className="grid grid-cols-4 gap-2">
              {MEMBERS.map((m, i) => (
                <div key={m.key} className="flex flex-col items-center gap-1 text-center">
                  <Avatar m={m} size={40} />
                  <span className="text-xs font-semibold">{m.name}</span>
                  <span className={`num text-[11px] ${step >= 1 ? "text-brand-text" : "text-muted"}`} data-testid={`paid-${m.key}`}>{step >= 1 ? "paid 100" : "paying…"}</span>
                  {/* contribution drop into the escrow */}
                  <svg width="12" height="28" viewBox="0 0 12 28" aria-hidden className="overflow-visible">
                    <line x1="6" y1="0" x2="6" y2="28" stroke="var(--line-strong)" strokeDasharray="3 3" />
                    {step === 0 && <circle cx="6" cy="4" r="4" fill={m.tone} className="anim-drop" style={{ animationDelay: `${i * 220}ms` }} />}
                  </svg>
                </div>
              ))}
            </div>
            {/* escrow vault */}
            <div className="rounded-2xl border border-line bg-bg-subtle p-3 sm:p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Soroban escrow</p>
                <p className="num text-sm"><span className="text-muted">held</span> {held} · <span className="text-muted">reserved</span> {reserved}</p>
              </div>
              <div className="relative mt-2 h-4 overflow-hidden rounded-full bg-card" aria-hidden>
                <div className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-700" style={{ width: `${(held / 400) * 100}%` }} />
                <div className="absolute inset-y-0 left-0 rounded-full bg-brand transition-[width] duration-700" style={{ width: `${(reserved / 400) * 100}%` }} />
              </div>
              <p className="num mt-2 text-xs text-muted" data-testid="story-invariant">reserved {reserved} ≤ funded {funded} − claimed {claimed} − withdrawn 0 <span className="text-brand-text">✓</span></p>
            </div>
            {/* payout slots */}
            <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Payout slots">
              {MEMBERS.map((slotM, slot) => {
                const owner = MEMBERS.find((m) => m.key === slotOwner(slot, step))!;
                const issued = step >= 2;
                const paid = step === 4 && slot < 2;
                const swapping = step === 3 && (slot === 1 || slot === 2);
                return (
                  <li key={slotM.slot} data-testid={`slot-${slotM.slot}`}
                    className={`relative rounded-2xl border p-3 transition duration-500 ${issued ? "border-brand/60 bg-brand-soft/60" : "border-dashed border-line-strong opacity-60"} ${swapping ? "anim-swap" : ""}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{slotM.slot} slot</p>
                    <p className="num mt-1 text-sm font-semibold">{issued ? "Right · 100" : "not issued"}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <Avatar m={owner} size={22} ring={swapping} />
                      <span className="text-xs">{owner.name}</span>
                      {paid && <span className="tone-good ml-auto rounded-full bg-(--t-bg) px-1.5 text-[10px] font-semibold text-(--t-fg)">paid</span>}
                      {swapping && <span className="ml-auto text-[10px] font-semibold text-brand-text" aria-label="two signatures">✍✍</span>}
                    </div>
                  </li>
                );
              })}
            </ol>
            <figcaption id="story-caption" className="mt-4 text-xs text-muted">Illustration with synthetic members and amounts. Not real data.</figcaption>
          </figure>

          <div className="flex flex-col">
            <ol className="grid gap-2" aria-label="Story steps">
              {STORY.map((s, i) => (
                <li key={s.title}>
                  <button type="button" onClick={() => go(i)} aria-current={i === step ? "step" : undefined}
                    className={`w-full rounded-2xl border p-4 text-left transition ${i === step ? "border-brand bg-card shadow-card" : "border-line hover:bg-bg-subtle"}`}>
                    <span className="num mr-2 text-xs text-brand-text">{i + 1}</span><span className="font-semibold">{s.title}</span>
                    {i === step && <span className="mt-1.5 block text-sm text-muted">{s.body}</span>}
                  </button>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={pill} onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>{playing ? "Pause" : "Play"}</button>
              <button type="button" className={pill} onClick={() => go((step + 1) % STORY.length)}>Next step</button>
            </div>
            <p className="sr-only" aria-live="polite">{`Step ${step + 1} of ${STORY.length}: ${STORY[step]!.title}`}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================================================ 2. Trade your payout date */
export function tradePlan(mine: number, wanted: number) {
  const me = MEMBERS[mine]!; const them = MEMBERS[wanted]!;
  if (mine === wanted) return { swap: false as const, me, them, lines: ["Pick a different slot to see what a swap involves."] };
  return {
    swap: true as const, me, them,
    lines: [
      `${me.name} proposes the ${me.slot} right to ${them.name}; ${them.name} accepts. (2 signatures)`,
      `${them.name} proposes the ${them.slot} right to ${me.name}; ${me.name} accepts. (2 signatures)`,
      `${me.name} is now paid in ${them.slot}, ${wanted < mine ? "earlier" : "later"} than before. Both rights stay 100: no interest, no new money.`,
    ],
  };
}

export function TradeExplainer() {
  const [mine, setMine] = useState(1);
  const [wanted, setWanted] = useState(0);
  const plan = tradePlan(mine, wanted);
  return (
    <section id="trade-your-date" aria-labelledby="trade-your-date-title" className="scroll-mt-20 border-y border-line bg-bg-subtle py-20 sm:py-28">
      <div className={wrap}>
        <Head id="trade-your-date" eyebrow="Try it" title="Trade your payout date, not your payout"
          lede="Pick whose slot you hold and the slot you would rather have. Torrent moves ownership of fully funded rights; amounts never change." />
        <Reveal className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="grid gap-5 rounded-3xl border border-line bg-card p-5 shadow-card">
            <fieldset>
              <legend className="text-sm font-semibold">I am</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {MEMBERS.map((m, i) => (
                  <label key={m.key} className={`flex cursor-pointer items-center gap-2 rounded-2xl border p-2 text-sm ${mine === i ? "border-brand bg-brand-soft/60" : "border-line"}`}>
                    <input type="radio" name="trade-me" className="sr-only" checked={mine === i} onChange={() => setMine(i)} />
                    <Avatar m={m} size={24} /><span>{m.name}<span className="block text-[11px] text-muted">holds {m.slot}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="grid gap-1.5 text-sm font-semibold">I would rather be paid in
              <select className="min-h-11 rounded-xl border border-line-strong bg-card px-3 font-normal" value={wanted} onChange={(e) => setWanted(Number(e.target.value))}>
                {MEMBERS.map((m, i) => <option key={m.slot} value={i}>{m.slot} (held by {m.name})</option>)}
              </select>
            </label>
          </div>

          <div className="rounded-3xl border border-line bg-card p-5 shadow-card" aria-live="polite">
            {/* month line */}
            <svg viewBox="0 0 400 70" className="w-full" role="img" aria-label={plan.swap ? `${plan.me.name} moves from ${plan.me.slot} to ${plan.them.slot}` : "No change"}>
              <line x1="30" y1="35" x2="370" y2="35" stroke="var(--line-strong)" strokeWidth="2" />
              {MEMBERS.map((m, i) => {
                const x = 30 + i * (340 / 3);
                const active = i === mine || i === wanted;
                return (
                  <g key={m.slot}>
                    <circle cx={x} cy="35" r={active ? 11 : 7} fill={active ? "var(--brand)" : "var(--card)"} stroke="var(--fg)" strokeWidth="1.5" className="transition-all duration-500" />
                    <text x={x} y="64" textAnchor="middle" fontSize="12" fill="var(--muted)">{m.slot}</text>
                  </g>
                );
              })}
              {plan.swap && (() => {
                const x1 = 30 + mine * (340 / 3); const x2 = 30 + wanted * (340 / 3);
                return <path key={`${mine}-${wanted}`} d={`M${x1} 22 Q ${(x1 + x2) / 2} -6 ${x2} 22`} fill="none" stroke="var(--brand-text)" strokeWidth="2.5" strokeDasharray="6 6" className="anim-dash" markerEnd="url(#arrow)" />;
              })()}
              <defs><marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--brand-text)" /></marker></defs>
            </svg>
            <ol className="mt-4 grid gap-2 text-sm" data-testid="trade-plan">
              {plan.lines.map((l, i) => <li key={l} className="flex gap-2"><span className="num text-brand-text">{plan.swap ? i + 1 : "·"}</span><span>{l}</span></li>)}
            </ol>
            <p className="mt-4 border-t border-line pt-3 text-xs text-muted">Only fully funded, unmatured rights can change hands, and an offer expires no later than the right matures. Both parties sign every transfer.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ========================================================= 3. Who is it for */
function Illo({ kind }: { kind: "circle" | "sooner" | "later" | "organizer" }) {
  const common = { width: 72, height: 72, viewBox: "0 0 72 72", "aria-hidden": true } as const;
  switch (kind) {
    case "circle":
      return <svg {...common}><circle cx="36" cy="36" r="22" fill="none" stroke="var(--brand)" strokeWidth="3" strokeDasharray="5 6" className="anim-spin-slow" />{[0, 1, 2, 3].map((i) => { const a = (i * Math.PI) / 2; return <circle key={i} cx={36 + 22 * Math.cos(a)} cy={36 + 22 * Math.sin(a)} r="7" fill={MEMBERS[i]!.tone} stroke="var(--fg)" strokeWidth="1.5" />; })}<rect x="28" y="30" width="16" height="12" rx="3" fill="var(--fg)" /></svg>;
    case "sooner":
      return <svg {...common}><circle cx="36" cy="36" r="24" fill="var(--brand-soft)" /><path d="M36 22v14l-9 6" stroke="var(--fg)" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M58 18l-8 2 2 8" stroke="var(--brand-text)" strokeWidth="3" fill="none" strokeLinecap="round" className="anim-nudge" /></svg>;
    case "later":
      return <svg {...common}><rect x="14" y="18" width="44" height="40" rx="6" fill="var(--brand-soft)" stroke="var(--fg)" strokeWidth="2" /><path d="M14 30h44" stroke="var(--fg)" strokeWidth="2" /><circle cx="48" cy="44" r="5" fill="var(--brand)" className="anim-pulse" /><path d="M24 12v10M48 12v10" stroke="var(--fg)" strokeWidth="3" strokeLinecap="round" /></svg>;
    case "organizer":
      return <svg {...common}><path d="M36 12l20 8v14c0 12-8 20-20 26-12-6-20-14-20-26V20z" fill="var(--brand-soft)" stroke="var(--fg)" strokeWidth="2" /><path d="M27 36l6 6 12-13" stroke="var(--brand-text)" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="anim-draw" /></svg>;
  }
}

export const AUDIENCES = [
  { kind: "circle" as const, title: "Savings circles", body: "Ajo, esusu, tanda, chit funds and other rotating groups that want the pot locked before anyone is promised a turn." },
  { kind: "sooner" as const, title: "Members who need money sooner", body: "Hold a late slot but face a bill now? Ask a member with an earlier, already funded slot to swap." },
  { kind: "later" as const, title: "Members happy to wait", body: "Flexible on timing? Take a later slot and help someone else. The amount you receive stays the same." },
  { kind: "organizer" as const, title: "Organizers and treasurers", body: "Set the rules once, see coverage straight from the ledger, and never hold anyone's money or keys yourself." },
];

export function WhoFor() {
  return (
    <section id="who-for" aria-labelledby="who-for-title" className="scroll-mt-20 py-20 sm:py-28">
      <div className={wrap}>
        <Head id="who-for" eyebrow="Who it is for" title="Built for groups that already save together"
          lede="Torrent is a prototype for the people in a circle, not for speculators: rights only move between members of the same pool." />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map((a, i) => (
            <Reveal as="li" key={a.title} delay={i * 80} className="group rounded-3xl border border-line bg-card p-6 shadow-card transition hover:-translate-y-1 hover:border-brand/60">
              <Illo kind={a.kind} />
              <h3 className="mt-4 font-semibold">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{a.body}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ======================================================= 4. Under the hood */
export const FUNDED_EXAMPLE = 1000;
export function invariantCheck(issue: number, alreadyReserved = 400, funded = FUNDED_EXAMPLE) {
  const reserved = alreadyReserved + issue;
  return { reserved, funded, ok: reserved <= funded };
}

export function UnderTheHood() {
  const [issue, setIssue] = useState(500);
  const r = invariantCheck(issue);
  const flow = ["Wallet signs", "issue_right", "Invariant check", r.ok ? "Event emitted" : "Call reverts"];
  return (
    <section id="under-the-hood" aria-labelledby="under-the-hood-title" className="scroll-mt-20 border-y border-line bg-ink py-20 text-paper sm:py-28">
      <div className={wrap}>
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">Under the hood</p>
          <h2 id="under-the-hood-title" className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">One check runs after every call</h2>
          <p className="mt-4 text-lg text-paper/75 text-pretty">The Soroban contract refuses any change that would leave a right without escrowed money behind it. Drag the slider to try issuing a new right.</p>
        </Reveal>
        <Reveal className="mt-12 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <figure className="rounded-[1.75rem] border border-paper/15 bg-paper/5 p-4 sm:p-6" aria-labelledby="hood-caption">
            <svg viewBox="0 0 520 290" className="w-full" role="img" aria-label={`Call flow: ${flow.join(", ")}; then contract events flow to Torrent-indexer, Torrent-api and Torrent-web`}>
              <text x="10" y="26" fontSize="11" fontWeight="600" letterSpacing="1.5" fill="#9ab4b3">ON-CHAIN</text>
              {flow.map((label, i) => {
                const x = 10 + i * 128;
                const bad = i === 3 && !r.ok;
                return (
                  <g key={label}>
                    <rect x={x} y="40" width="112" height="56" rx="14" fill={i === 2 ? "#42DEB4" : bad ? "#5a1f22" : "#052c31"} stroke={bad ? "#e5484d" : "#42DEB4"} strokeOpacity={i === 2 ? 1 : 0.5} />
                    <text x={x + 56} y="73" textAnchor="middle" fontSize="12.5" fontWeight="600" fill={i === 2 ? "#00191C" : "#FBF8F1"} fontFamily={i === 1 ? "var(--font-mono)" : undefined}>{label}</text>
                    {i < 3 && <line x1={x + 112} y1="68" x2={x + 128} y2="68" stroke="#42DEB4" strokeWidth="2" />}
                  </g>
                );
              })}
              <circle cx="66" cy="68" r="5" fill="#A5F9DE" className="anim-packet" />
              <text x="266" y="122" textAnchor="middle" fontSize="12" fill="#A5F9DE" fontFamily="var(--font-mono)">reserved ≤ funded − claimed − withdrawn</text>
              <text x="10" y="170" fontSize="11" fontWeight="600" letterSpacing="1.5" fill="#9ab4b3">READ BACK FROM THE LEDGER</text>
              {(r.ok ? ["right_issued event", "Torrent-indexer", "Torrent-api", "Torrent-web"] : ["no event", "nothing indexed", "nothing changes", "error shown"]).map((label, i) => {
                const x = 10 + i * 128;
                return (
                  <g key={label} opacity={r.ok ? 1 : 0.55}>
                    <rect x={x} y="186" width="112" height="48" rx="12" fill="#052c31" stroke="#A5F9DE" strokeOpacity="0.35" strokeDasharray={r.ok ? undefined : "4 4"} />
                    <text x={x + 56} y="214" textAnchor="middle" fontSize="11.5" fill="#FBF8F1">{label}</text>
                    {i < 3 && <line x1={x + 112} y1="210" x2={x + 128} y2="210" stroke="#A5F9DE" strokeOpacity="0.6" strokeWidth="2" />}
                  </g>
                );
              })}
              <path d="M450 96 V 150 H 66 V 186" fill="none" stroke="#A5F9DE" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="4 5" className={r.ok ? "anim-dash" : undefined} />
              <text x="266" y="266" textAnchor="middle" fontSize="11.5" fill="#9ab4b3">The app shows only what the indexer rebuilt from contract events.</text>
            </svg>
            <figcaption id="hood-caption" className="mt-2 text-xs text-paper/60">Example numbers: a pool funded with {FUNDED_EXAMPLE}, 400 already reserved.</figcaption>
          </figure>
          <div className="rounded-[1.75rem] border border-paper/15 bg-paper/5 p-5">
            <label className="grid gap-2 text-sm font-semibold">Issue a new right of <span className="num text-2xl text-brand">{issue}</span>
              <input type="range" min={100} max={1000} step={50} value={issue} onChange={(e) => setIssue(Number(e.target.value))} className="accent-[#42DEB4]" />
            </label>
            <p className="num mt-4 text-sm" data-testid="hood-math">reserved {r.reserved} ≤ funded {r.funded} − claimed 0 − withdrawn 0</p>
            <p role="status" className={`mt-3 rounded-2xl px-4 py-3 font-semibold ${r.ok ? "bg-[#0b3a2f] text-[#8af0c8]" : "bg-[#431a1d] text-[#ffb3b3]"}`}>
              {r.ok ? "Accepted: the right is fully backed and right_issued is emitted." : "Refused with InsufficientBacking: nothing changes and no event is emitted."}
            </p>
            <ul className="mt-5 grid gap-1.5 text-sm text-paper/75">
              <li>Claims work even while a pool is paused or closed.</li>
              <li>Upgrades are announced on-chain a week before they can run.</li>
              <li>The indexer rebuilds this state from events and halts on any mismatch.</li>
            </ul>
            <Link href="/circles" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-brand-ink transition hover:-translate-y-0.5">Launch app <IconArrowRight width={18} height={18} /></Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
