"use client";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { AskUser } from "@/lib/wallet/types";
import { btn, btnGhost, input, label } from "./ui";

const Ctx = createContext<AskUser | null>(null);
type Req = Parameters<AskUser>[0];

/** Modal that asks the user to paste text (signature / signed XDR). Used by the manual wallet adapter. */
export function AskProvider({ children }: { children: ReactNode }) {
  const [req, setReq] = useState<Req | null>(null);
  const [text, setText] = useState("");
  const resolver = useRef<((v: string | null) => void) | null>(null);
  const ask = useCallback<AskUser>((r) => new Promise((resolve) => { resolver.current?.(null); resolver.current = resolve; setText(""); setReq(r); }), []);
  const done = (v: string | null) => { resolver.current?.(v); resolver.current = null; setReq(null); };
  return (
    <Ctx.Provider value={ask}>
      {children}
      {req && (
        <div role="dialog" aria-modal="true" aria-labelledby="ask-title" className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4 backdrop-blur-sm">
          <form className="grid w-full max-w-xl gap-4 rounded-3xl border border-line bg-card p-6 shadow-card" onSubmit={(e) => { e.preventDefault(); if (text.trim()) done(text); }}>
            <h2 id="ask-title" className="text-lg font-semibold">{req.title}</h2>
            <p className="text-sm">{req.instructions}</p>
            {req.context && <pre className="num max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-line bg-bg-subtle p-3 text-xs">{req.context}</pre>}
            <label className={label}>{req.label}<textarea autoFocus className={`${input} num h-24`} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} /></label>
            <div className="flex flex-wrap gap-2"><button className={btn} disabled={!text.trim()}>Continue</button><button type="button" className={btnGhost} onClick={() => done(null)}>Cancel</button></div>
          </form>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useAsk(): AskUser {
  const v = useContext(Ctx);
  if (!v) throw new Error("AskProvider missing");
  return v;
}
