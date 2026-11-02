"use client";
import type { ReactNode } from "react";
import { AskProvider } from "@/components/ask-dialog";
import { SessionProvider } from "@/lib/session";

export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider><AskProvider>{children}</AskProvider></SessionProvider>;
}
