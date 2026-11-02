"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";

export type AsyncState<T> = { status: "loading" } | { status: "error"; error: ApiError } | { status: "ready"; data: T };

/** Loads on mount and on `reload()`; keeps the previous data out of view while reloading (no stale money shown as fresh). */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): [AsyncState<T>, () => void] {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  const seq = useRef(0);
  const run = useCallback(() => {
    const mine = ++seq.current;
    setState({ status: "loading" });
    fn().then(
      (data) => { if (mine === seq.current) setState({ status: "ready", data }); },
      (e: unknown) => { if (mine === seq.current) setState({ status: "error", error: e instanceof ApiError ? e : new ApiError(0, "UNKNOWN", "Something went wrong.") }); },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  const invalidate = useCallback(() => { seq.current += 1; }, []);
  useEffect(() => { run(); return invalidate; }, [run, invalidate]);
  return [state, run];
}
