"use client";
import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "../icons";

export type Theme = "light" | "dark";
export const THEME_KEY = "torrent.theme";

/** Runs before paint (inlined in <head>) so a pinned theme never flashes. */
export const THEME_BOOT_SCRIPT = `(function(){var d=document.documentElement;d.classList.add("js");try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")d.setAttribute("data-theme",t);}catch(e){}})();`;

function current(): Theme {
  if (typeof document === "undefined") return "light";
  const pinned = document.documentElement.getAttribute("data-theme");
  if (pinned === "light" || pinned === "dark") return pinned;
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Light/dark switch. Defaults to the OS preference; a choice is remembered per browser only. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => { setTheme(current()); }, []);
  const next: Theme = theme === "dark" ? "light" : "dark";
  function toggle() {
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* storage unavailable: theme still applies for this page */ }
    setTheme(next);
  }
  return (
    <button type="button" onClick={toggle} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}
      className="inline-flex size-10 items-center justify-center rounded-full border border-line text-fg transition hover:border-line-strong hover:bg-bg-subtle">
      {theme === "dark" ? <IconSun /> : <IconMoon />}
    </button>
  );
}
