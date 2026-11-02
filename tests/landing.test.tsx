import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import Home from "@/app/page";
import { share } from "@/components/coverage-panel";
import { Reveal } from "@/components/landing/reveal";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { THEME_KEY, ThemeToggle } from "@/components/site/theme-toggle";
import { FAQS, FEATURES, REPOS, STEPS } from "@/lib/site";

const REPO_URLS = [
  "https://github.com/Torrent998/Torrent-contracts",
  "https://github.com/Torrent998/Torrent-indexer",
  "https://github.com/Torrent998/Torrent-api",
  "https://github.com/Torrent998/Torrent-web",
];

describe("Landing page", () => {
  it("has one h1 with the value proposition and a primary Launch app CTA into the app", () => {
    render(<Home />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/funded before they exist/i);
    const ctas = screen.getAllByRole("link", { name: /launch app/i });
    expect(ctas.length).toBeGreaterThan(0);
    for (const a of ctas) expect(a).toHaveAttribute("href", "/circles");
  });

  it("renders every section as a labelled landmark with an anchor id", () => {
    const { container } = render(<Home />);
    for (const id of ["how-it-works", "features", "safety", "open-source", "faq"]) {
      const el = container.querySelector(`#${id}`);
      expect(el, id).not.toBeNull();
      expect(el).toHaveAttribute("aria-labelledby", `${id}-title`);
    }
  });

  it("how it works lists the four on-chain steps with their real contract calls", () => {
    render(<Home />);
    const list = screen.getByRole("heading", { name: /four steps/i }).closest("section")!;
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(STEPS.map((s) => s.title)).toEqual(["Create a circle", "Fund the pool", "Issue payout rights", "Transfer or claim"]);
    const calls = Array.from(list.querySelectorAll("code")).map((c) => c.textContent).join(" ");
    for (const call of ["create_pool", "deposit", "issue_right", "propose_transfer", "accept_transfer", "claim"]) expect(calls).toContain(call);
  });

  it("shows all features", () => {
    render(<Home />);
    for (const f of FEATURES) expect(screen.getByRole("heading", { name: f.title })).toBeInTheDocument();
  });

  it("is honest about status: Testnet only, not audited, no Mainnet, backing invariant shown", () => {
    render(<Home />);
    const safety = document.getElementById("safety")!;
    expect(within(safety).getByText("Stellar Testnet only")).toBeInTheDocument();
    expect(within(safety).getByText("Not audited")).toBeInTheDocument();
    expect(within(safety).getByText(/^Not available$/)).toBeInTheDocument();
    expect(within(safety).getByText(/reserved ≤ funded − claimed − withdrawn/)).toBeInTheDocument();
  });

  it("links the four real repositories", () => {
    render(<Home />);
    const section = document.getElementById("open-source")!;
    const hrefs = within(section).getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(REPOS.map((r) => r.url)).toEqual(REPO_URLS);
    for (const u of REPO_URLS) expect(hrefs).toContain(u);
  });

  it("FAQ uses native disclosure widgets", () => {
    const { container } = render(<Home />);
    expect(container.querySelectorAll("#faq details")).toHaveLength(FAQS.length);
    expect(screen.getByText(FAQS[0]!.q)).toBeInTheDocument();
  });

  it("labels the hero illustration as synthetic", () => {
    render(<Home />);
    expect(screen.getByText(/Illustration with synthetic numbers\. Not live data\./)).toBeInTheDocument();
  });

  it("makes no claims that do not exist: no app stores, users, partners, audits passed or Mainnet launch", () => {
    const { container } = render(<><Home /><SiteFooter /></>);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/app store|google play|testimonial|trusted by|partners?\b|audited by|live on mainnet|\d+\s*(k|\+)?\s*users/i);
  });
});

describe("SiteHeader", () => {
  afterEach(() => { pathname = "/"; });
  it("on the landing page shows section links and Launch app", () => {
    pathname = "/";
    render(<SiteHeader />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "How it works" })).toHaveAttribute("href", "/#how-it-works");
    expect(screen.getByRole("link", { name: /launch app/i })).toHaveAttribute("href", "/circles");
  });
  it("inside the app shows app navigation with the current page marked", () => {
    pathname = "/circles/cir_1";
    render(<SiteHeader />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Circles" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: /launch app/i })).not.toBeInTheDocument();
  });
  it("mobile menu toggles with aria-expanded", async () => {
    render(<SiteHeader />);
    const btn = screen.getByRole("button", { name: /open menu/i });
    expect(btn).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(btn);
    expect(screen.getByRole("button", { name: /close menu/i })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "Mobile" })).toBeInTheDocument();
  });
});

describe("ThemeToggle", () => {
  afterEach(() => { document.documentElement.removeAttribute("data-theme"); window.localStorage.clear(); });
  it("pins the opposite theme and remembers it", async () => {
    document.documentElement.setAttribute("data-theme", "light");
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button", { name: /switch to dark theme/i }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(window.localStorage.getItem(THEME_KEY)).toBe("dark");
    expect(screen.getByRole("button", { name: /switch to light theme/i })).toBeInTheDocument();
  });
});

describe("Reveal", () => {
  it("shows content immediately where IntersectionObserver is unavailable", () => {
    render(<Reveal><p>visible</p></Reveal>);
    expect(screen.getByText("visible").parentElement).toHaveAttribute("data-shown", "true");
  });
});

describe("coverage share", () => {
  it("computes percentages on integers and handles zero funding", () => {
    expect(share("6000000000", "10000000000")).toBe(60);
    expect(share("1", "3")).toBe(33.3);
    expect(share("5", "0")).toBe(0);
    expect(share("0", "10")).toBe(0);
  });
});
