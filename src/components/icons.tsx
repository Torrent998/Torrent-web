import type { SVGProps } from "react";

/** Minimal stroke icon set (24px grid, currentColor). Decorative by default. */
type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, focusable: false, ...p,
});

export const IconShield = (p: P) => <svg {...base(p)}><path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.3 7.5 9.5 4.4-1.2 7.5-4.9 7.5-9.5V6L12 3Z" /><path d="m8.8 12 2.2 2.2 4.3-4.4" /></svg>;
export const IconLedger = (p: P) => <svg {...base(p)}><rect x="4" y="3.5" width="16" height="17" rx="2.5" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>;
export const IconStatus = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>;
export const IconKey = (p: P) => <svg {...base(p)}><circle cx="8" cy="15" r="4" /><path d="m11 12 8.5-8.5M16 7l2.5 2.5M14 9l2 2" /></svg>;
export const IconSwap = (p: P) => <svg {...base(p)}><path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" /></svg>;
export const IconReplay = (p: P) => <svg {...base(p)}><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.6" /><path d="M4 4v4.6h4.6" /></svg>;
export const IconArrowRight = (p: P) => <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const IconExternal = (p: P) => <svg {...base(p)}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>;
export const IconSun = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></svg>;
export const IconMoon = (p: P) => <svg {...base(p)}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>;
export const IconMenu = (p: P) => <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
export const IconClose = (p: P) => <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>;
export const IconCheck = (p: P) => <svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
export const IconPlus = (p: P) => <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>;
export const IconUsers = (p: P) => <svg {...base(p)}><circle cx="9" cy="8.5" r="3.5" /><path d="M2.5 19.5c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.8c1.8.6 3 2.2 3.5 4.7" /></svg>;
export const IconAlert = (p: P) => <svg {...base(p)}><path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" /><path d="M12 10v4M12 17h.01" /></svg>;
export const IconGithub = (p: P) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable={false} {...p}>
    <path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
);
