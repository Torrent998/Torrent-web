"use client";
import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Fades content in as it scrolls into view. Content is never hidden without JS (the CSS only
 * applies under html.js), with reduced motion, or where IntersectionObserver is unavailable.
 */
export function Reveal({ children, delay = 0, as: Tag = "div", className = "" }: { children: ReactNode; delay?: number; as?: ElementType; className?: string }) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setShown(true); io.disconnect(); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} data-reveal="" data-shown={shown ? "true" : "false"} className={className} style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}>
      {children}
    </Tag>
  );
}
