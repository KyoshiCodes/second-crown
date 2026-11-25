import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { LedgerPanel, ledgerSummary } from "./LedgerPanel";

function stubStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe("LedgerPanel fold", () => {
  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  it("summarises count and newest entry", () => {
    expect(ledgerSummary([])).toBe("No entries yet");
    expect(ledgerSummary([{ text: "Oath sworn" }])).toBe("1 entry · Oath sworn");
    expect(ledgerSummary([{ text: "Border war" }, { text: "Older" }])).toBe("2 entries · Border war");
    const long = ledgerSummary([{ text: "x".repeat(80) }]);
    expect(long.endsWith("…")).toBe(true);
    expect(long.length).toBeLessThan(70);
  });

  it("renders inside a crown-ledger fold with the title always visible", () => {
    const open = renderToStaticMarkup(<LedgerPanel state={undefined} />);
    expect(open).toContain('data-fold="crown-ledger"');
    expect(open).toContain("Ledger of Crowns");
    expect(open).toContain('aria-expanded="true"');
    expect(open).toContain("sc-ledger-card-empty");

    stubStorage({ "sc-fold:crown-ledger": "0" });
    const closed = renderToStaticMarkup(<LedgerPanel state={undefined} />);
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).toContain("Ledger of Crowns");
    expect(closed).toContain("No entries yet");
    expect(closed).not.toContain("sc-ledger-card-empty");
  });

  it("folds after first visit (noisy)", () => {
    stubStorage({ "sc-fold-seen:crown-ledger": "1" });
    const html = renderToStaticMarkup(<LedgerPanel state={undefined} />);
    expect(html).toContain('aria-expanded="false"');
  });
});
