import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  createGameState,
  economyYieldsSnapshot,
  joinSide,
  maybeWhisper,
  relationshipHistorySnapshot,
  setLivingSwitch,
  storageCap,
  type GameState,
} from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import { nextLastInspected } from "../game/useGameEngine";
import { KingdomTab } from "../tabs/KingdomTab";
import { WorldTab } from "../tabs/WorldTab";
import {
  EconomyYieldsLine,
  formatEconomyYieldEntries,
  resolveEconomyYields,
} from "./EconomyYieldsLine";
import {
  RealmRelationshipCard,
  listRealmRelationshipHistory,
} from "./RealmRelationshipCard";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("Living Realm Slice 17: last-inspected tracking, relationship history, and economy yields", () => {
  it("tracks lastInspectedProvinceId cleanly and renders both selected and last-inspected highlights non-blocking", () => {
    expect(nextLastInspected(null, "p1", null)).toBeNull();
    expect(nextLastInspected("p1", "p1", null)).toBeNull();
    expect(nextLastInspected("p1", "p2", null)).toBe("p1");
    expect(nextLastInspected("p2", null, "p1")).toBe("p2");
    expect(nextLastInspected(null, "p3", "p2")).toBe("p2");

    const s = createGameState({ seed: 1 });
    const home = s.board.homeProvinceId;
    const other = s.board.provinces.find((p) => p.id !== home)!;
    const last = nextLastInspected(other.id, home, null);
    expect(last).toBe(other.id);

    const html = renderToStaticMarkup(
      <BoardLiving state={s} selectedId={home} lastInspectedId={last} visible />,
    );
    expect(html).toContain("sc-fb-layer");
    expect(html).toContain('style="pointer-events:none"');
    expect(html).toContain(`data-fb-selected="${home}"`);
    expect(html).toContain(`data-fb-inspected="${other.id}"`);
  });

  it("renders a collapsed-by-default 'Recent' expander under relationship rows from relationshipHistorySnapshot", () => {
    const s = createGameState({ seed: 1 });
    s.wars = [];
    s.meta.tick = 1000;
    s.flags.fog_seen = JSON.stringify(s.board.provinces.map((p) => p.id));

    const npcHolds = s.board.provinces.filter(
      (p) => p.node === "hold" && p.occupantRealmId && p.occupantRealmId !== "player",
    );
    const allyRealmId = npcHolds[0].occupantRealmId!;
    const foeRealmId = npcHolds[1].occupantRealmId!;
    const npcWar = {
      id: `war_npc_${allyRealmId}_${foeRealmId}_980`,
      attackerRealmId: allyRealmId,
      defenderRealmId: foeRealmId,
      startedTick: 980,
      status: "active" as const,
    };
    s.wars.push(npcWar);
    joinSide(s, npcWar.id, "attacker");

    for (let p = 3; p < 120; p += 1) {
      const w = maybeWhisper(s, p * 100);
      if (w && w.toRealmId === "player") break;
    }

    const foeHistory = relationshipHistorySnapshot(s, foeRealmId);
    expect(foeHistory.length).toBeGreaterThan(0);
    expect(listRealmRelationshipHistory(s, foeRealmId)).toEqual(foeHistory);
    expect(listRealmRelationshipHistory(undefined, foeRealmId)).toEqual([]);

    const worldHtml = renderToStaticMarkup(<WorldTab state={s} act={() => {}} worldLog={[]} />);
    expect(worldHtml).toContain("sc-rel-history");
    expect(worldHtml).not.toContain("<details class=\"sc-rel-history\" open");
    expect(worldHtml).toContain(`Recent (${foeHistory.length})`);
    expect(worldHtml).toContain(`data-history-kind="${foeHistory[0].kind}"`);
    expect(worldHtml).toContain(`data-history-tick="${foeHistory[0].tick}"`);

    // Switching living_relationship_history off omits all recent expanders calmly
    setLivingSwitch(s, "relationshipHistory", false);
    expect(relationshipHistorySnapshot(s, foeRealmId)).toEqual([]);
    const noHistHtml = renderToStaticMarkup(<RealmRelationshipCard state={s} />);
    expect(noHistHtml).toContain("sc-rel-card");
    expect(noHistHtml).not.toContain("sc-rel-history");
  });

  it("renders non-zero net yields on EconomyYieldsLine without cluttering when all rates are zero", () => {
    expect(resolveEconomyYields(undefined)).toBeNull();
    expect(renderToStaticMarkup(<EconomyYieldsLine state={undefined} />)).toBe("");

    // Zero buildings & zero army upkeep -> all rates zero -> hides cleanly
    const idle = createGameState({ seed: 1, withStarterBuildings: false });
    const zeroYields = economyYieldsSnapshot(idle)!;
    expect(formatEconomyYieldEntries(zeroYields)).toEqual([]);
    expect(renderToStaticMarkup(<EconomyYieldsLine state={idle} />)).toBe("");

    // With starter buildings + army upkeep -> shows non-zero rates & upkeep even when pressure is all ok
    const active = createGameState({ seed: 1, withStarterBuildings: true });
    for (const res of ["food", "wood", "stone", "gold"] as const) {
      active.resources[res] = String(Math.floor(storageCap(active, res) * 0.5));
    }
    active.units.push({
      id: "u_test_militia",
      realmId: "player",
      typeId: "militia",
      count: "20",
      armyId: null,
    } as GameState["units"][number]);

    const yields = economyYieldsSnapshot(active)!;
    expect(yields.foodUpkeep).toBeGreaterThan(0);

    const html = renderToStaticMarkup(
      <KingdomTab state={active} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    expect(html).not.toContain("sc-econ-status-line");
    expect(html).toContain("sc-yields-line");
    expect(html).toContain("Net /s:");
    expect(html).toContain("(upkeep -");

    setLivingSwitch(active, "economyYields", false);
    expect(resolveEconomyYields(active)).toBeNull();
    expect(renderToStaticMarkup(<EconomyYieldsLine state={active} />)).toBe("");
  });

  it("keeps relationship-history.css and economy-yields-status.css isolated, non-blocking, theme-compatible, and reduced-motion safe", () => {
    for (const file of ["./relationship-history.css", "./economy-yields-status.css"]) {
      const css = readTextFile(file);
      expect(css, file).toContain(':root[data-chrome="dusk"]');
      expect(css, file).toContain(':root[data-chrome="night"]');
      expect(css, file).toContain(':root[data-chrome="parchment"]');
      expect(css, file).toContain("pointer-events: none !important;");
      expect(css, file).toContain("@media (prefers-reduced-motion: reduce)");

      for (const forbidden of [
        ".sc-ledger-cell::before",
        ".sc-ledger-cell::after",
        ".sc-board",
        ".sc-chat-float",
        ".sc-admin-float",
        ".sc-theme-dock",
      ]) {
        expect(css, `${file} should not contain ${forbidden}`).not.toContain(forbidden);
      }
    }
  });
});
