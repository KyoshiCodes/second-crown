import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LedgerCard, ledgerKindLabel, ledgerRows } from "./LedgerCard";

describe("LedgerCard living rows", () => {
  it("builds Time and Entry rows from the entry's own values", () => {
    const rows = ledgerRows(100, "Save written · tick 100", "save_written");
    expect(rows).toEqual([
      { kind: "time", label: "Time", value: "t100", sub: "save written" },
      { kind: "text", label: "Entry", value: "Save written · tick 100" },
    ]);
  });

  it("omits the kind tag when no kind is given", () => {
    expect(ledgerRows(5, "x")[0]?.sub).toBeUndefined();
    expect(ledgerKindLabel(undefined)).toBe("");
  });

  it("renders stacked rows, keeps kind and the time/text hooks", () => {
    const html = renderToStaticMarkup(
      <ul>
        <LedgerCard tick={80} text="Oath sworn in the hall" kind="crown" />
      </ul>
    );
    expect(html).toContain('class="sc-ledger-card is-living ');
    expect(html).toContain('data-kind="crown"');
    expect(html).toContain("sc-ledger-card-row is-time");
    expect(html).toContain("sc-ledger-card-row is-text");
    expect(html).toContain('<span class="sc-ledger-card-time">t80</span>');
    expect(html).toContain('<span class="sc-ledger-card-text">Oath sworn in the hall</span>');
    expect(html).toContain("sc-quill-pip");
  });

  it("prefers a full entry over loose props", () => {
    const html = renderToStaticMarkup(
      <ul>
        <LedgerCard entry={{ tick: 7, kind: "war", text: "Border war" }} tick={1} text="ignored" />
      </ul>
    );
    expect(html).toContain("t7");
    expect(html).toContain("Border war");
    expect(html).not.toContain("ignored");
  });
});
