"use client";
import type { ReactNode } from "react";
import type { ApiError } from "@/lib/api/client";
import type { Tone } from "@/features/view";
import { IconAlert } from "./icons";

/** Tone drives both the accent rail of a card and the status chip colors (see globals.css). */
export function Card({ title, tone = "neutral", description, actions, children, className = "" }: {
  title?: string; tone?: Tone; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`tone-${tone} relative overflow-hidden rounded-3xl border border-line bg-card p-5 shadow-card sm:p-6 ${className}`}>
      {tone !== "neutral" && <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-(--t-line)" />}
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            {title && <h2 className="text-lg font-semibold tracking-tight">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`tone-${tone} inline-flex items-center gap-1.5 rounded-full border border-(--t-line)/40 bg-(--t-bg) px-2.5 py-0.5 text-sm font-semibold text-(--t-fg)`}>
      <span aria-hidden className="size-1.5 rounded-full bg-(--t-line)" />
      {children}
    </span>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-text">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h1>
        {description && <div className="mt-2 max-w-2xl text-muted">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Loading({ what }: { what: string }) {
  return (
    <div role="status" aria-live="polite" className="rounded-3xl border border-line bg-card p-5 sm:p-6">
      <p className="text-sm text-muted">Loading {what}…</p>
      <div aria-hidden className="mt-3 grid animate-pulse gap-2">
        <span className="h-3 w-2/3 rounded-full bg-bg-subtle" />
        <span className="h-3 w-1/2 rounded-full bg-bg-subtle" />
      </div>
    </div>
  );
}

export function ErrorBox({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  return (
    <div role="alert" className="tone-bad flex gap-3 rounded-3xl border border-(--t-line)/50 bg-(--t-bg) p-5 text-(--t-fg)">
      <IconAlert className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold">{error.retryable ? "Temporarily unavailable" : "Request refused"}</p>
        <p className="mt-0.5 text-fg">{error.message}</p>
        <p className="num mt-1 break-all text-xs opacity-80">{error.code}{error.requestId ? ` · ${error.requestId}` : ""}</p>
        {error.retryable && onRetry && <button type="button" onClick={onRetry} className={`${btn} mt-3`}>Retry</button>}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line-strong bg-bg-subtle/60 p-5 text-center text-sm text-muted">{children}</p>;
}

export const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 py-2 font-semibold text-brand-ink transition hover:bg-brand-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-brand";
export const btnGhost = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-card px-4 py-2 font-semibold transition hover:bg-bg-subtle active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-card";
export const input = "w-full min-h-11 text-base font-normal rounded-xl border border-line-strong bg-bg px-3.5 py-2 transition placeholder:text-muted/70 hover:border-muted focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20 aria-[invalid=true]:border-(--bad-line)";
export const label = "grid gap-1.5 text-sm font-medium";
