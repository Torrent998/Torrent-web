import { IconCheck, IconShield, IconSwap } from "../icons";

/**
 * Animated hero illustration of a funded pool and its payout rights. Every number here is
 * synthetic and the figure says so; nothing is read from a network. With reduced motion the
 * figure is static (the "before transfer" frame).
 */
const RIGHTS = [
  { id: "1", amount: "200.00", maturity: "Jan 2027", owner: "GDTF…X3M" },
  { id: "2", amount: "200.00", maturity: "Feb 2027", owner: "GDTF…X3M", to: "GBJZ…WDJ" },
  { id: "3", amount: "200.00", maturity: "Mar 2027", owner: "GC5Q…KDA" },
];

function Chip({ tone, children, className = "" }: { tone: "good" | "pending" | "neutral"; children: React.ReactNode; className?: string }) {
  return (
    <span className={`tone-${tone} inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-(--t-line)/40 bg-(--t-bg) px-2 py-0.5 text-[11px] font-semibold text-(--t-fg) ${className}`}>
      {children}
    </span>
  );
}

export function PoolVisual() {
  return (
    <figure className="mx-auto w-full max-w-[30rem]" aria-labelledby="pool-visual-caption">
      <div className="relative">
        <div className="anim-float relative rounded-[1.75rem] border border-line bg-card p-4 shadow-card sm:p-6">
          {/* header */}
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-text"><IconShield /></span>
            <div className="min-w-0">
              <p className="font-semibold leading-tight">Ajo circle</p>
              <p className="text-xs text-muted">Pool #1 · Stellar Testnet</p>
            </div>
            <Chip tone="good" className="ml-auto"><IconCheck width={12} height={12} />Fully backed</Chip>
          </div>

          {/* coverage */}
          <div className="mt-5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Funded in escrow</p>
              <p className="num text-xl font-medium sm:text-2xl">1,000.00 <span className="text-xs text-muted">TST</span></p>
            </div>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-bg-subtle" aria-hidden>
              <div className="anim-fill h-full w-[60%] rounded-l-full bg-brand" />
              <div className="anim-fill relative h-full w-[40%] overflow-hidden bg-accent/60" style={{ animationDelay: "0.6s" }}>
                <span className="anim-flow absolute inset-y-0 w-1/3 bg-paper/50 motion-reduce:hidden" />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-brand" />Reserved for rights <span className="num text-fg">600.00</span></span>
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-accent" />Unreserved <span className="num text-fg">400.00</span></span>
            </div>
          </div>

          {/* rights */}
          <ul className="mt-5 grid gap-2" aria-label="Payout rights (illustration)">
            {RIGHTS.map((r) => (
              <li key={r.id} className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-line bg-elevated px-3 py-2.5 ${r.to ? "anim-highlight" : ""}`}>
                <span className="num inline-flex size-8 items-center justify-center rounded-lg bg-bg-subtle text-xs font-medium">#{r.id}</span>
                <div className="min-w-0">
                  <p className="num text-sm font-medium">{r.amount} <span className="text-[11px] text-muted">TST · {r.maturity}</span></p>
                  <p className="relative h-4 text-[11px] text-muted">
                    {r.to ? (
                      <>
                        <span className="anim-before absolute inset-0">owner <span className="num text-fg">{r.owner}</span></span>
                        <span className="anim-mid absolute inset-0">owner <span className="num text-fg">{r.owner}</span> → <span className="num text-fg">{r.to}</span></span>
                        <span className="anim-after absolute inset-0">owner <span className="num text-fg">{r.to}</span></span>
                      </>
                    ) : <span>owner <span className="num text-fg">{r.owner}</span></span>}
                  </p>
                </div>
                {r.to ? (
                  <span className="relative inline-grid justify-items-end">
                    <Chip tone="neutral" className="anim-before col-start-1 row-start-1">Issued</Chip>
                    <Chip tone="pending" className="anim-mid col-start-1 row-start-1"><IconSwap width={12} height={12} />Both signing</Chip>
                    <Chip tone="good" className="anim-after col-start-1 row-start-1"><IconCheck width={12} height={12} />Transferred</Chip>
                  </span>
                ) : <Chip tone="neutral">Issued</Chip>}
              </li>
            ))}
          </ul>

          {/* invariant */}
          <div className="mt-5 rounded-2xl border border-dashed border-line-strong px-3 py-2.5">
            <p className="num text-[11px] leading-relaxed text-muted sm:text-xs">
              <span className="text-fg">reserved</span> 600 ≤ <span className="text-fg">funded − claimed − withdrawn</span> 1,000
              <span className="ml-1.5 inline-flex translate-y-0.5 text-brand-text"><IconCheck width={14} height={14} /></span>
            </p>
            <p className="mt-0.5 text-[11px] text-muted">Checked by the contract after every call</p>
          </div>
        </div>

        {/* floating ledger note */}
        <div className="anim-float absolute -bottom-4 -right-3 hidden rounded-2xl border border-line bg-elevated px-3 py-2 shadow-card sm:block" style={{ animationDelay: "-3s" }} aria-hidden>
          <p className="flex items-center gap-2 text-xs font-medium">
            <span className="relative flex size-2"><span className="anim-ping absolute inline-flex size-full rounded-full bg-brand" /><span className="relative inline-flex size-2 rounded-full bg-brand" /></span>
            Ledger-derived
          </p>
        </div>
      </div>

      <figcaption id="pool-visual-caption" className="mt-4 text-center text-xs text-muted">
        Illustration with synthetic numbers. Not live data.
      </figcaption>
    </figure>
  );
}
