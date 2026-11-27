import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  WAR_PHASE_START,
  createGameState,
  getCulture,
  joinSide,
  maybeWhisper,
  realmRelationshipSummary,
  setLivingSwitch,
  type GameState,
} from "@second-crown/sim";
import {
  RELATIONSHIP_STANCE_LABEL,
  RealmRelationshipCard,
  listRealmRelationships,
} from "./RealmRelationshipCard";
import { WorldTab } from "../tabs/WorldTab";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("RealmRelationshipCard World tab presentation", () => {
  it("hides cleanly when state is partial, list is empty, or living_relationship_summary is off", () => {
    expect(listRealmRelationships(undefined)).toEqual([]);
    expect(listRealmRelationships({} as GameState)).toEqual([]);
    expect(renderToStaticMarkup(<RealmRelationshipCard state={undefined} />)).toBe("");

    const s = createGameState({ seed: 1 });
    s.flags.fog_seen = JSON.stringify([s.board.homeProvinceId]);
    expect(realmRelationshipSummary(s)).toEqual([]);
    expect(listRealmRelationships(s)).toEqual([]);
    expect(renderToStaticMarkup(<RealmRelationshipCard state={s} />)).toBe("");

    // Seen hold populates the list, and turning the switch off hides it cleanly
    const npcHold = s.board.provinces.find(
      (p) => p.node === "hold" && p.occupantRealmId && p.occupantRealmId !== "player",
    )!;
    s.flags.fog_seen = JSON.stringify([s.board.homeProvinceId, npcHold.id]);
    expect(listRealmRelationships(s).length).toBeGreaterThan(0);

    setLivingSwitch(s, "relationshipSummary", false);
    expect(realmRelationshipSummary(s)).toEqual([]);
    expect(renderToStaticMarkup(<RealmRelationshipCard state={s} />)).toBe("");
  });

  it("renders one calm row per known realm under the whispers fold with name, culture, stance, last interaction, and next action", () => {
    const s = createGameState({ seed: 1 });
    s.wars = [];
    s.meta.tick = 1000;
    s.flags.fog_seen = JSON.stringify(s.board.provinces.map((p) => p.id));

    const npcHolds = s.board.provinces.filter(
      (p) => p.node === "hold" && p.occupantRealmId && p.occupantRealmId !== "player",
    );
    const allyRealmId = npcHolds[0].occupantRealmId!;
    const foeRealmId = npcHolds[1].occupantRealmId!;
    const peaceRealmId = npcHolds[2].occupantRealmId!;
    const tradeWhisperRealmId = npcHolds[3].occupantRealmId!;

    // Joined NPC war -> foeRealmId in war ("fight locked"), allyRealmId in pact ("riding together")
    const npcWar = {
      id: `war_npc_${allyRealmId}_${foeRealmId}_980`,
      attackerRealmId: allyRealmId,
      defenderRealmId: foeRealmId,
      startedTick: 980,
      status: "active" as const,
    };
    s.wars.push(npcWar);
    joinSide(s, npcWar.id, "attacker");

    // Peace lock + trade on a third realm
    s.flags[`peace_player_${peaceRealmId}`] = 2000;
    const peaceName = s.realms.find((r) => r.id === peaceRealmId)!.name;
    s.flags.world_log = JSON.stringify([
      { tick: 950, id: "trade", text: `${peaceName} trades caravans with Your Crown` },
    ]);

    // Real whisper to player (step until tradeWhisperRealmId or any non-war realm reaches player)
    for (let p = 3; p < 120; p += 1) {
      const w = maybeWhisper(s, p * 100);
      if (w && w.toRealmId === "player" && w.fromRealmId === tradeWhisperRealmId) break;
    }

    const expectedRows = realmRelationshipSummary(s);
    expect(expectedRows.length).toBeGreaterThanOrEqual(4);

    const worldHtml = renderToStaticMarkup(<WorldTab state={s} act={() => {}} worldLog={[]} />);
    const foldPos = worldHtml.indexOf("Realm Whispers &amp; Caravans");
    const relPos = worldHtml.indexOf("sc-rel-card");
    expect(foldPos).toBeGreaterThan(-1);
    expect(relPos).toBeGreaterThan(foldPos);

    for (const row of expectedRows) {
      const cultureLabel = getCulture(row.culture)?.name ?? row.culture;
      expect(worldHtml).toContain(`data-rel-realm="${row.realmId}"`);
      expect(worldHtml).toContain(row.name);
      expect(worldHtml).toContain(`(${cultureLabel})`);
      expect(worldHtml).toContain(RELATIONSHIP_STANCE_LABEL[row.stance]);
      expect(worldHtml).toContain(`Last: ${row.lastInteraction ?? "none yet"}`);
      expect(worldHtml).toContain(`Next: ${row.nextPossible ?? "—"}`);
    }

    // Before clash, enemy row shows fight locked; once clash opens, enemy row switches to can fight
    expect(worldHtml).toContain('data-rel-next="fight locked"');
    s.meta.tick = 980 + WAR_PHASE_START.clash + 10;
    const clashHtml = renderToStaticMarkup(<RealmRelationshipCard state={s} />);
    expect(clashHtml).toContain('data-rel-next="can fight"');
  });

  it("keeps relationship-summary.css isolated, non-blocking, theme-compatible, and reduced-motion safe", () => {
    const css = readTextFile("./relationship-summary.css");
    expect(css).toContain(':root[data-chrome="dusk"]');
    expect(css).toContain(':root[data-chrome="night"]');
    expect(css).toContain(':root[data-chrome="parchment"]');
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");

    for (const forbidden of [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ]) {
      expect(css).not.toContain(forbidden);
    }
  });
});
