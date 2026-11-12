"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { IconAlert } from "@/components/icons";
import { ApiClient } from "@/lib/api/client";
import type { WalletAdapter } from "@/lib/wallet/types";

export interface Session {
  client: ApiClient;
  token: string | null;
  /** False until the stored session has been read on the client (avoids a server/client mismatch). */
  ready: boolean;
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

export function resolveApiBaseUrl(baseUrl?: string): string {
  const configured = baseUrl?.trim() || process.env["NEXT_PUBLIC_API_BASE_URL"]?.trim();
  if (configured) return configured;
  if (process.env["NODE_ENV"] === "production") {
    throw new Error(
      "Configuration error: NEXT_PUBLIC_API_BASE_URL is not set. Set NEXT_PUBLIC_API_BASE_URL at build time for production deployments.",
    );
  }
  return "http://localhost:3001";
}

export function SessionProvider({ children, baseUrl, client, networkPassphrase }: { children: ReactNode; baseUrl?: string; client?: ApiClient; networkPassphrase?: string }) {
  // The server cannot see sessionStorage, so start signed out and read it after mount.
  const [creds, setCreds] = useState<{ token: string | null; address: string | null }>({ token: null, address: null });
  const [ready, setReady] = useState(false);
  const [wallet, setWallet] = useState<WalletAdapter | null>(null);
  const tokenRef = useRef<string | null>(null);
  useEffect(() => {
    const c = load();
    tokenRef.current = c.token;
    setCreds(c);
    setReady(true);
  }, []);
  const { api, configError } = useMemo(() => {
    if (client) return { api: client, configError: null };
    try {
      return {
        api: new ApiClient({ baseUrl: resolveApiBaseUrl(baseUrl), getToken: () => tokenRef.current }),
        configError: null,
      };
    } catch (err) {
      return {
        api: null,
        configError: err instanceof Error ? err.message : String(err),
      };
    }
  }, [client, baseUrl]);
  const persist = useCallback((token: string | null, address: string | null) => {
    tokenRef.current = token;
    setCreds({ token, address });
    try { if (token) window.sessionStorage.setItem(KEY, JSON.stringify({ token, address })); else window.sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  }, []);

  const value = useMemo<Session | null>(() => {
    if (!api) return null;
    return {
      client: api, token: creds.token, ready, address: creds.address, wallet, networkPassphrase: networkPassphrase ?? DEFAULT_PASSPHRASE,
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
    };
  }, [api, creds, ready, wallet, networkPassphrase, persist]);

  if (configError || !value) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div role="alert" className="tone-bad flex gap-3 rounded-3xl border border-(--t-line)/50 bg-(--t-bg) p-5 text-(--t-fg)">
          <IconAlert className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold">Configuration error</p>
            <p className="mt-0.5 text-fg">{configError}</p>
            <p className="num mt-1 break-all text-xs opacity-80">CONFIG_MISSING_NEXT_PUBLIC_API_BASE_URL</p>
          </div>
        </div>
      </div>
    );
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): Session {
  const v = useContext(Ctx);
  if (!v) throw new Error("SessionProvider missing");
  return v;
}
