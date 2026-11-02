"use client";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { ApiClient } from "@/lib/api/client";

export interface Session {
  client: ApiClient;
  token: string | null;
  address: string | null;
  setCredentials(token: string | null, address: string | null): void;
}
const Ctx = createContext<Session | null>(null);

const KEY = "torrent.session.v1";
/**
 * The bearer token and your PUBLIC Stellar address are kept in sessionStorage only (cleared when the
 * tab closes). This app never asks for, receives or stores a secret key or seed phrase.
 */
function load(): { token: string | null; address: string | null } {
  try {
    const raw = typeof window === "undefined" ? null : window.sessionStorage.getItem(KEY);
    if (raw) { const v = JSON.parse(raw) as { token?: string; address?: string }; return { token: v.token ?? null, address: v.address ?? null }; }
  } catch { /* storage unavailable: start signed out */ }
  return { token: null, address: null };
}

export function SessionProvider({ children, baseUrl, client }: { children: ReactNode; baseUrl?: string; client?: ApiClient }) {
  const [creds, setCreds] = useState(load);
  const value = useMemo<Session>(() => ({
    token: creds.token, address: creds.address,
    client: client ?? new ApiClient({ baseUrl: baseUrl ?? process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:3001", getToken: () => creds.token }),
    setCredentials(token, address) {
      setCreds({ token, address });
      try { if (token) window.sessionStorage.setItem(KEY, JSON.stringify({ token, address })); else window.sessionStorage.removeItem(KEY); } catch { /* ignore */ }
    },
  }), [creds, baseUrl, client]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): Session {
  const v = useContext(Ctx);
  if (!v) throw new Error("SessionProvider missing");
  return v;
}
