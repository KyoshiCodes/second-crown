import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import { realmLedgerRows } from "./DiploLedger";
import { DiploLivingRows, orderDiploRows, pactLivingRow, realmPactOf } from "./DiploLivingRows";
import { RealmCard } from "./RealmCard";
import { WorldPanel } from "../WorldPanel";

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

const noop = () => undefined;
const faction = (over: Partial<{ id: string; name: string; leaderRealmId: string | null; memberRealmIds: string[]; stance: number; kind: string }>) => ({
  id: "f1",
  name: "Iron Pact",
  leaderRealmId: "rival",
  memberRealmIds: ["rival", "north"],
  stance: 0,
  kind: "pact",
  ...over,
});

describe("realmPactOf", () => {
  it("reads membership, leader and player seat from faction fields", () => {
    expect(realmPactOf(undefined, "rival")).toBeNull();
    expect(realmPactOf([], "rival")).toBeNull();
    expect(realmPactOf([faction({})], "south")).toBeNull();
    expect(realmPactOf([faction({})], "rival")).toEqual({ name: "Iron Pact", kind: "pact", leads: true, withYou: false, sworn: 2, more: 0 });
    const p = realmPactOf([faction({ memberRealmIds: ["north", "player"] }), faction({ id: "f2", name: "B" })], "north");
    expect(p).toMatchObject({ name: "Iron Pact", leads: false, withYou: true, sworn: 2, more: 1 });
  });
});

describe("pactLivingRow", () => {
  it("no pact reads unsworn; shared pact reads with you", () => {
    expect(pactLivingRow(null)).toMatchObject({ value: "No pact", sub: "unsworn", tone: "calm" });
    const row = pactLivingRow({ name: "Iron Pact", kind: "pact", leads: true, withYou: true, sworn: 3, more: 1 });
    expect(row.value).toBe("Iron Pact");
    expect(row.sub).toBe("pact · leads it · 3 sworn · with you · +1 more");
    expect(row.tone).toBe("ready");
  });
});

describe("DiploLivingRows", () => {
  const rows = realmLedgerRows({ name: "Vale", stance: "truce", peaceLeft: 101, opinion: 4, matchup: { mine: 30, theirs: 10 } });

  it("orders name, stance, pact, power from the existing row values", () => {
    expect(orderDiploRows(rows, null).map((r) => r.kind)).toEqual(["name", "stance", "pact", "power"]);
    const html = renderToStaticMarkup(<DiploLivingRows realmId="vale" stance="truce" rows={rows} pact={null} />);
    expect(inOrder(html, ["is-name", "is-stance", "is-pact", "is-power"])).toBe(true);
    expect(inOrder(html, ["Vale", "Truce 11s", "No pact", "30 vs 10"])).toBe(true);
    expect(html).toContain("sc-diplo-living-head is-truce");
    expect(html).toContain('aria-valuenow="0.75"');
  });

  it("marks a pact shared with you", () => {
    const html = renderToStaticMarkup(
      <DiploLivingRows realmId="vale" stance="friendly" rows={rows} pact={{ name: "Iron Pact", leads: false, withYou: true, sworn: 2, more: 0 }} />,
    );
    expect(html).toContain("is-friendly is-sworn");
    expect(html).toContain("Iron Pact");
    expect(html).toContain("with you");
  });
});

describe("cards keep their controls", () => {
  it("RealmCard: living rows then Declare war and Gift", () => {
    const s = createGameState({ seed: 1 });
    const realm = s.realms.find((r) => r.id !== "player")!;
    const html = renderToStaticMarkup(
      <RealmCard
        realm={realm}
        stance="wary"
        peaceLeft={0}
        opinion={0}
        mine={10}
        theirs={20}
        declareLocked={false}
        onDeclare={noop}
        onGift={noop}
        pact={realmPactOf([faction({ memberRealmIds: [realm.id] })], realm.id)}
      />,
    );
    expect(inOrder(html, ["sc-diplo-living-head", realm.name, "Wary", "Iron Pact", "10 vs 20", "Declare war", "Gift 15 gold"])).toBe(true);
  });

  it("WorldPanel: Known Crowns use living rows; buttons and pact cards stay", () => {
    const s = createGameState({ seed: 1 });
    const other = s.realms.find((r) => r.id !== "player")!;
    s.factions = [faction({ memberRealmIds: [other.id, "player"], leaderRealmId: other.id })];
    const html = renderToStaticMarkup(<WorldPanel state={s} onFoundGuild={noop} onJoin={noop} onLeave={noop} onScout={noop} />);
    expect((html.match(/sc-diplo-living-head /g) ?? []).length).toBe(s.realms.length - 1);
    expect(html).toContain("leads it · 2 sworn · with you");
    expect(html).toContain("Scout host");
    expect(html).toMatch(/>(Join|Leave)</);
  });
});

describe("diplo-living-rows.css", () => {
  it("lives outside theme.css and respects reduced motion", () => {
    const css = readCssFile("./diplo-living-rows.css");
    expect(css).toContain(".sc-diplo-living-row");
    expect(css).toContain("prefers-reduced-motion");
    expect(readCssFile("../theme.css")).not.toContain("sc-diplo-living-row");
  });
});
