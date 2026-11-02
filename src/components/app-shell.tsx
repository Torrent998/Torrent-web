import type { ReactNode } from "react";

/** Container for authenticated app routes. */
export function AppShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-6 sm:px-6 sm:pt-10">{children}</div>;
}
