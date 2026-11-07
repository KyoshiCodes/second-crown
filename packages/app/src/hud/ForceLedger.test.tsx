import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ForceLedger, ledgerActionState, ledgerEta } from "./ForceLedger";
import { ForceCard } from "./ForceCard";
import { forceStatusRows } from "./ForceStatus";

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("ledger helpers", () => {
  it("ETA prefers the status row, else seconds, else Posted", () => {
    expect(ledgerEta(undefined)).toBe("Posted");
    expect(ledgerEta(4)).toBe("4s");
    expect(ledgerEta(4, { kind: "eta", label: "ETA", value: "gathering · 4s", tone: "calm" })).toBe("gathering · 4s");
  });

  it("action state reads only the existing action prop", () => {
    expect(ledgerActionState()).toBe("none");
    expect(ledgerActionState({ label: "Recall", onClick: () => {} })).toBe("ready");
    expect(ledgerActionState({ label: "Recall", disabled: true, onClick: () => {} })).toBe("locked");
  });
});

describe("ForceLedger", () => {
  it("stacks name, destination, ETA, action in that order", () => {
    const html = renderToStaticMarkup(
      <ForceLedger name="Scout" captain="Ada" dest="2,3" detail="from 1,1" seconds={5} action={{ label: "Recall", onClick: () => {} }} />,
    );
    const order = ["is-name", "is-dest", "is-eta", "is-action"].map((k) => html.indexOf(k));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toContain("Capt. Ada");
    expect(html).toContain("→ 2,3");
    expect(html).toContain("5s");
    expect(html).toContain("state-ready");
    expect(html).toContain("Recall");
  });

  it("shows None when no action and Posted when not moving", () => {
    const html = renderToStaticMarkup(<ForceLedger name="Host" dest="1,1" />);
    expect(html).toContain("state-none");
    expect(html).toContain("Posted");
    expect(html).not.toContain("<button");
  });
});

describe("ForceCard with ledger", () => {
  it("keeps the Sally button and shows ETA once", () => {
    const rows = forceStatusRows({ power: 4, powerMax: 4, seconds: 3, risk: { value: "High", tone: "danger" } });
    const html = renderToStaticMarkup(
      <ForceCard tone="hostile" name="Host" dest="1,1" seconds={3} status={rows} action={{ label: "Sally (5 militia)", onClick: () => {} }} />,
    );
    expect(html).toContain("sc-force-ledger");
    expect(html).toContain("Sally (5 militia)");
    expect(html.match(/is-eta/g)?.length).toBe(1);
    expect(html).toContain("sc-force-row is-power");
    expect(html).toContain("sc-force-row is-risk");
  });

  it("keeps a disabled Recall disabled", () => {
    const html = renderToStaticMarkup(
      <ForceCard tone="gather" name="Gather wood" dest="1,1" seconds={2} action={{ label: "Recall", disabled: true, onClick: () => {} }} />,
    );
    expect(html).toContain("state-locked");
    expect(html).toMatch(/<button[^>]*disabled/);
  });
});

describe("force-ledger.css", () => {
  it("lives outside theme.css and respects reduced motion", () => {
    const css = readCssFile("./force-ledger.css");
    expect(css).toContain(".sc-force-ledger");
    expect(css).toContain("prefers-reduced-motion");
    expect(readCssFile("../theme.css")).not.toContain("sc-force-ledger");
  });
});
