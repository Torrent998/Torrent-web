"use client";
import { useState, type ReactNode } from "react";
import { useSession } from "@/lib/session";
import { Card, btn, input } from "./ui";

/** Development sign-in: paste an API bearer token and your PUBLIC Stellar address. No secrets. */
export function SessionGate({ children }: { children: ReactNode }) {
  const s = useSession();
  const [token, setToken] = useState("");
  const [address, setAddress] = useState("");
  const addrOk = /^G[A-Z2-7]{55}$/.test(address);
  if (s.token && s.address) return <>{children}</>;
  return (
    <Card title="Sign in (development)">
      <p className="mb-3 text-muted">
        Testnet only. Paste the API token you were given and your <strong>public</strong> Stellar address (starts with G). Never paste a secret key or seed phrase here.
      </p>
      <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); if (token.length >= 16 && addrOk) s.setCredentials(token.trim(), address.trim()); }}>
        <label className="grid gap-1">API token<input className={input} type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} /></label>
        <label className="grid gap-1">Public Stellar address
          <input className={`${input} num`} value={address} onChange={(e) => setAddress(e.target.value)} aria-invalid={address !== "" && !addrOk} />
        </label>
        {address !== "" && !addrOk && <p role="alert" className="text-red-600">That is not a valid public address (56 characters starting with G).</p>}
        <button className={btn} type="submit" disabled={token.length < 16 || !addrOk}>Continue</button>
      </form>
    </Card>
  );
}
