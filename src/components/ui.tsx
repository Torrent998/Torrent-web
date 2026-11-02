"use client";
import type { ReactNode } from "react";
import type { ApiError } from "@/lib/api/client";
import type { Tone } from "@/features/view";

const TONE: Record<Tone, string> = {
  neutral: "border-line", pending: "border-amber-500", good: "border-emerald-500", bad: "border-red-500", warn: "border-amber-500",
};

export function Card({ title, tone = "neutral", children }: { title?: string; tone?: Tone; children: ReactNode }) {
  return (
    <section className={`rounded-lg border-2 bg-card p-4 ${TONE[tone]}`}>
      {title && <h2 className="mb-2 text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  const c = { neutral: "bg-line", pending: "bg-amber-200 text-black", good: "bg-emerald-200 text-black", bad: "bg-red-200 text-black", warn: "bg-amber-200 text-black" }[tone];
  return <span className={`inline-block rounded px-2 py-0.5 text-sm font-medium ${c}`}>{children}</span>;
}

export function Loading({ what }: { what: string }) {
  return <p role="status" aria-live="polite" className="animate-pulse text-muted">Loading {what}…</p>;
}

export function ErrorBox({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border-2 border-red-500 bg-card p-4">
      <p className="font-semibold">{error.retryable ? "Temporarily unavailable" : "Request refused"}</p>
      <p>{error.message}</p>
      <p className="num text-sm text-muted">{error.code}{error.requestId ? ` · ${error.requestId}` : ""}</p>
      {error.retryable && onRetry && <button type="button" onClick={onRetry} className="mt-2 rounded bg-brand px-3 py-2 font-medium text-black">Retry</button>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border-2 border-dashed border-line p-4 text-muted">{children}</p>;
}

export const btn = "rounded bg-brand px-4 py-2 font-medium text-black disabled:opacity-50 min-h-11";
export const btnGhost = "rounded border-2 border-line px-4 py-2 font-medium min-h-11 disabled:opacity-50";
export const input = "w-full rounded border-2 border-line bg-bg px-3 py-2 min-h-11";
