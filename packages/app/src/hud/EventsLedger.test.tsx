import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EventsLedger, eventLedgerRows, eventRewardTone, questLedgerRows } from "./EventsLedger";
import { EventCard } from "./EventCard";
import { QuestCard } from "./QuestCard";

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function inOrder(html: string, keys: string[]): boolean {
  const idx = keys.map((k) => html.indexOf(k));
  return idx.every((i) => i >= 0) && idx.every((v, i) => i === 0 || v > idx[i - 1]);
}

describe("row helpers", () => {
  it("event rows read title, tick and effect text only", () => {
    const rows = eventLedgerRows({ id: "harvest", title: "Bountiful harvest", body: "+25 food", tickLabel: "500" });
    expect(rows.map((r) => r.kind)).toEqual(["name", "progress", "reward"]);
    expect(rows[0].value).toBe("Bountiful harvest");
    expect(rows[1].value).toBe("Resolved");
    expect(rows[1].sub).toBe("t500");
    expect(rows[2].value).toBe("+25 food");
    expect(rows[2].tone).toBe("ready");
  });

  it("event with choices awaits a choice; spoilage reads as loss", () => {
    const rows = eventLedgerRows({ id: "spoil", title: "Spoilage", body: "lost 3 food", tickLabel: "1", choiceCount: 2 });
    expect(rows[1].value).toBe("Awaiting choice · 2");
    expect(rows[1].fill).toBe(0);
    expect(eventRewardTone("spoil")).toBe("loss");
    expect(rows[2].tone).toBe("loss");
  });

  it("quest rows follow status", () => {
    const open = questLedgerRows({ name: "Q", hint: "h", gold: 5, status: "open", statusLabel: "In progress" });
    expect(open[1].value).toBe("0/1");
    expect(open[2].value).toBe("5 gold");
    const claimed = questLedgerRows({ name: "Q", hint: "h", gold: 5, status: "claimed", statusLabel: "Claimed" });
    expect(claimed[1].fill).toBe(1);
    expect(claimed[2].value).toBe("+5 gold taken");
  });
});

describe("EventsLedger", () => {
  it("renders rows with bars and slots", () => {
    const html = renderToStaticMarkup(
      <EventsLedger rows={[{ kind: "progress", label: "Progress", value: "1/1", tone: "ready", fill: 1, slot: <button>Go</button> }]} />,
    );
    expect(html).toContain("sc-events-ledger-row is-progress tone-ready");
    expect(html).toContain("width:100%");
    expect(html).toContain("<button>Go</button>");
  });
});

describe("EventCard with ledger", () => {
  it("stacks name, progress, reward and keeps choice buttons", () => {
    const html = renderToStaticMarkup(
      <EventCard
        event={{ tick: 500, id: "tribute", text: "A merchant pays tribute — +10 gold" }}
        latest
        choices={[{ id: "a", label: "Accept", onPick: () => {} }, { id: "b", label: "Refuse", disabled: true, onPick: () => {} }]}
      />,
    );
    expect(inOrder(html, ["is-name", "is-progress", "is-reward"])).toBe(true);
    expect(html).toContain("A merchant pays tribute");
    expect(html).toContain("+10 gold");
    expect(html).toContain("Accept");
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Refuse/);
  });
});

describe("QuestCard with ledger", () => {
  it("keeps the Claim button when ready", () => {
    const html = renderToStaticMarkup(
      <QuestCard id="q" name="First steps" hint="Build a farm" gold={20} complete claimed={false} onClaim={() => {}} />,
    );
    expect(inOrder(html, ["is-name", "is-progress", "is-reward"])).toBe(true);
    expect(html).toContain("Claim 20 gold");
    expect(html).toContain("Build a farm");
    expect(html).toContain("1/1");
  });

  it("has no button while open or claimed", () => {
    for (const [complete, claimed] of [[false, false], [true, true]] as const) {
      const html = renderToStaticMarkup(
        <QuestCard id="q" name="Q" hint="h" gold={20} complete={complete} claimed={claimed} onClaim={() => {}} />,
      );
      expect(html).not.toContain("<button");
    }
  });
});

describe("events-living.css", () => {
  it("lives outside theme.css and respects reduced motion", () => {
    const css = readCssFile("./events-living.css");
    expect(css).toContain(".sc-events-ledger");
    expect(css).toContain("prefers-reduced-motion");
    expect(readCssFile("../theme.css")).not.toContain("sc-events-ledger");
  });
});
