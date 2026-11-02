"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { ApiClient } from "@/lib/api/client";
import type { WalletAdapter } from "@/lib/wallet/types";

export interface Session {
  client: ApiClient;
  token: string | null;
  address: string | null;
  /** Wallet for signing; null after a page reload until the user reconnects. */
  wallet: WalletAdapter | null;
  networkPassphrase: string;
  /** Wallet-signature login: challenge -> wallet signs -> session token. */
  signIn(wallet: WalletAdapter): Promise<void>;
  /** Reconnect a wallet to an existing session (must be the same address). */
  attachWallet(wallet: WalletAdapter): Promise<void>;
  signOut(): Promise<void>;
}
const Ctx = createContext<Session | null>(null);

const KEY = "torrent.session.v2";
const DEFAULT_PASSPHRASE = "Test SDF Network ; September 2015";
/**
 * The bearer token and your PUBLIC address are kept in sessionStorage only (cleared when the tab
 * closes). This app never asks for, receives or stores a secret key or seed phrase.
 */
function load(): { token: string | null; address: string | null } {
  try {
    const raw = typeof window === "undefined" ? null : window.sessionStorage.getItem(KEY);
    if (raw) { const v = JSON.parse(raw) as { token?: string; address?: string }; return { token: v.token ?? null, address: v.address ?? null }; }
  } catch { /* storage unavailable: start signed out */ }
  return { token: null, address: null };
}

export function SessionProvider({ children, baseUrl, client, networkPassphrase }: { children: ReactNode; baseUrl?: string; client?: ApiClient; networkPassphrase?: string }) {
  const [creds, setCreds] = useState(load);
  const [wallet, setWallet] = useState<WalletAdapter | null>(null);
  const tokenRef = useRef<string | null>(creds.token);
  const api = useMemo(
    () => client ?? new ApiClient({ baseUrl: baseUrl ?? process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:3001", getToken: () => tokenRef.current }),
    [client, baseUrl],
  );
  const persist = useCallback((token: string | null, address: string | null) => {
    tokenRef.current = token;
    setCreds({ token, address });
    try { if (token) window.sessionStorage.setItem(KEY, JSON.stringify({ token, address })); else window.sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  }, []);

  const value = useMemo<Session>(() => ({
    client: api, token: creds.token, address: creds.address, wallet, networkPassphrase: networkPassphrase ?? DEFAULT_PASSPHRASE,
    async signIn(w) {
      const { address } = await w.connect();
      const ch = await api.authChallenge(address);
      const sig = await w.signMessage(ch.message);
      const res = await api.authLogin(ch.challengeId, sig);
      setWallet(w);
      persist(res.token, res.address);
    },
    async attachWallet(w) {
      const { address } = await w.connect();
      if (address !== creds.address) throw new Error("That wallet is for a different address than this session.");
      setWallet(w);
    },
    async signOut() {
      try { if (tokenRef.current) await api.logout(); } catch { /* session may already be gone */ }
      setWallet(null); persist(null, null);
    },
  }), [api, creds, wallet, networkPassphrase, persist]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): Session {
  const v = useContext(Ctx);
  if (!v) throw new Error("SessionProvider missing");
  return v;
}
