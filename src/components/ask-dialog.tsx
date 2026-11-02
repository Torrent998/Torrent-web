"use client";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { AskUser } from "@/lib/wallet/types";
import { btn, btnGhost, input } from "./ui";

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
        <div role="dialog" aria-modal="true" aria-labelledby="ask-title" className="fixed inset-0 z-10 grid place-items-center bg-black/60 p-4">
          <form className="grid w-full max-w-xl gap-3 rounded-lg bg-card p-4" onSubmit={(e) => { e.preventDefault(); if (text.trim()) done(text); }}>
            <h2 id="ask-title" className="text-lg font-semibold">{req.title}</h2>
            <p className="text-sm">{req.instructions}</p>
            {req.context && <pre className="num max-h-40 overflow-auto whitespace-pre-wrap break-words rounded border border-line p-2 text-sm">{req.context}</pre>}
            <label className="grid gap-1">{req.label}<textarea autoFocus className={`${input} num h-24`} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} /></label>
            <div className="flex gap-2"><button className={btn} disabled={!text.trim()}>Continue</button><button type="button" className={btnGhost} onClick={() => done(null)}>Cancel</button></div>
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
