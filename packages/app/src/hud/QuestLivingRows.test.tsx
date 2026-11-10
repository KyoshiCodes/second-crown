import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import { questLedgerRows } from "./EventsLedger";
import { QuestLivingRows, orderQuestRows } from "./QuestLivingRows";
import { QuestCard } from "./QuestCard";
import { QuestPanel } from "../QuestPanel";

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const base = { name: "Raise a chapel", hint: "Place a Chapel", gold: 20 };

describe("orderQuestRows", () => {
  it("puts name, progress, reward in order regardless of input order", () => {
    const rows = questLedgerRows({ ...base, status: "open", statusLabel: "In progress" });
    expect(orderQuestRows([rows[2], rows[0], rows[1]]).map((r) => r.kind)).toEqual(["name", "progress", "reward"]);
  });
});

describe("QuestLivingRows", () => {
  it("stacks name, progress, reward using the existing row values", () => {
    const rows = questLedgerRows({ ...base, status: "open", statusLabel: "In progress" });
    const html = renderToStaticMarkup(
      <QuestLivingRows questId="raise_chapel" status="open" motif="sanctum" rows={rows} />,
    );
    const order = ["is-name", "is-progress", "is-reward"].map((c) => html.indexOf(`sc-quest-living-row ${c}`));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    for (const r of rows) expect(html).toContain(r.value);
    expect(html).toContain("Place a Chapel");
    expect(html).toContain("In progress");
    expect(html).toContain("is-open seal-sanctum");
    expect(html).toContain("sanctum · unsealed");
    expect(html).toContain('style="width:0%"');
    expect(html).toContain("sc-quest-living-row is-progress tone-busy");
  });

  it("claimed quest reads as sealed with a full meter", () => {
    const rows = questLedgerRows({ ...base, status: "claimed", statusLabel: "Claimed" });
    const html = renderToStaticMarkup(
      <QuestLivingRows questId="raise_chapel" status="claimed" motif="sanctum" rows={rows} />,
    );
    expect(html).toContain("sanctum · sealed");
    expect(html).toContain("+20 gold taken");
    expect(html).toContain('aria-valuenow="1"');
  });
});

describe("QuestCard living head", () => {
  it("renders chip + rows, keeps Claim in the reward row and glyph after them", () => {
    const html = renderToStaticMarkup(
      <QuestCard id="first_victory" name="Win a field" hint="Win any war." gold={25} complete claimed={false} onClaim={() => {}} />,
    );
    const head = html.indexOf("sc-quest-living-head");
    const chip = html.indexOf("sc-quest-living-chip");
    const reward = html.indexOf("sc-quest-living-row is-reward");
    const btn = html.indexOf("sc-quest-btn");
    const glyph = html.indexOf("sc-events-status-glyph");
    expect(head).toBeGreaterThan(0);
    expect(chip).toBeGreaterThan(head);
    expect(html.indexOf("sc-scroll-pip")).toBeGreaterThan(chip);
    expect(btn).toBeGreaterThan(reward);
    expect(glyph).toBeGreaterThan(btn);
    expect(html).toContain("Claim 25 gold");
    expect(html).toContain("valor · seal lit");
  });

  it("QuestPanel renders living rows without mutating GameState", () => {
    const state = createGameState({ seed: 42 });
    const before = JSON.stringify(state);
    const html = renderToStaticMarkup(<QuestPanel state={state} act={() => {}} />);
    expect(JSON.stringify(state)).toBe(before);
    expect(html).toContain("sc-quest-living-head");
    expect(html).toContain("· unsealed");
  });
});

describe("quest-living-rows.css", () => {
  it("lives outside theme.css and respects reduced motion", () => {
    const css = readCssFile("./quest-living-rows.css");
    expect(css).toContain(".sc-quest-living-head");
    expect(css).toContain("prefers-reduced-motion");
    expect(readCssFile("../theme.css")).not.toContain("sc-quest-living");
  });
});
