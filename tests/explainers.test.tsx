import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CircleStory, STORY, TradeExplainer, UnderTheHood, WhoFor, invariantCheck, slotOwner, tradePlan } from "@/components/landing/explainers";

const setReducedMotion = (reduce: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({ matches: reduce && q.includes("reduce"), media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() })) as unknown as typeof window.matchMedia;
};
afterEach(() => { vi.useRealTimers(); });

describe("savings-circle story", () => {
  it("slot ownership swaps Feb and Mar only from the swap step on", () => {
    expect([0, 1, 2, 3].map((s) => slotOwner(s, 2))).toEqual(["A", "B", "C", "D"]);
    expect([0, 1, 2, 3].map((s) => slotOwner(s, 3))).toEqual(["A", "C", "B", "D"]);
  });
  it("steps through contributions, issuance, the swap and claims with the invariant shown", async () => {
    setReducedMotion(true);
    render(<CircleStory />);
    expect(screen.getByTestId("paid-A")).toHaveTextContent("paying");
    expect(within(screen.getByTestId("slot-Jan")).getByText("not issued")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /rights are issued per payout slot/i }));
    expect(screen.getByTestId("story-invariant")).toHaveTextContent("reserved 400 ≤ funded 400");
    await userEvent.click(screen.getByRole("button", { name: /swaps slots/i }));
    expect(within(screen.getByTestId("slot-Feb")).getByText("Chidi")).toBeInTheDocument();
    expect(screen.getByText(/four signatures in total/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next step" }));
    expect(screen.getByTestId("story-invariant")).toHaveTextContent("reserved 200 ≤ funded 400 − claimed 200");
    expect(screen.getAllByText("paid")).toHaveLength(2);
  });
  it("autoplays unless the visitor prefers reduced motion, and can be paused", async () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    render(<CircleStory />);
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(4200); });
    expect(screen.getByText(`Step 2 of ${STORY.length}: ${STORY[1]!.title}`)).toBeInTheDocument();
    vi.useRealTimers();
  });
  it("does not autoplay with reduced motion", () => {
    setReducedMotion(true);
    render(<CircleStory />);
    expect(screen.getByRole("button", { name: "Play" })).toHaveAttribute("aria-pressed", "false");
  });
});

describe("trade your payout date", () => {
  it("explains a swap as two two-signature transfers with unchanged amounts", () => {
    const p = tradePlan(3, 0);
    expect(p.swap).toBe(true);
    expect(p.lines.join(" ")).toMatch(/Dayo proposes the Apr right to Ada.*Ada proposes the Jan right to Dayo.*earlier.*no interest, no new money/);
    expect(tradePlan(1, 1).swap).toBe(false);
  });
  it("updates as the visitor picks slots", async () => {
    render(<TradeExplainer />);
    expect(screen.getByTestId("trade-plan")).toHaveTextContent(/Bola proposes the Feb right to Ada/);
    await userEvent.selectOptions(screen.getByLabelText(/rather be paid in/i), "3");
    expect(screen.getByTestId("trade-plan")).toHaveTextContent(/Bola is now paid in Apr, later/);
    await userEvent.click(screen.getByLabelText(/Dayo/));
    expect(screen.getByTestId("trade-plan")).toHaveTextContent(/Pick a different slot/);
  });
});

describe("who it is for and under the hood", () => {
  it("lists the audiences without any user counts or partner names", () => {
    const { container } = render(<WhoFor />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(4);
    expect(container.textContent).not.toMatch(/\d+[,.]?\d*\s*(users|members joined|partners|k\+)/i);
  });
  it("the invariant demo accepts backed issuance and refuses the rest", () => {
    expect(invariantCheck(600)).toMatchObject({ reserved: 1000, ok: true });
    expect(invariantCheck(650).ok).toBe(false);
    render(<UnderTheHood />);
    const slider = screen.getByRole("slider");
    expect(screen.getByRole("status")).toHaveTextContent(/Accepted/);
    act(() => { slider.focus(); });
    // jsdom range inputs: set the value through the change event
    act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(slider, "900"); slider.dispatchEvent(new Event("input", { bubbles: true })); slider.dispatchEvent(new Event("change", { bubbles: true })); });
    expect(screen.getByTestId("hood-math")).toHaveTextContent("reserved 1300 ≤ funded 1000");
    expect(screen.getByRole("status")).toHaveTextContent(/InsufficientBacking/);
    expect(screen.getByRole("link", { name: /launch app/i })).toHaveAttribute("href", "/circles");
  });
});
