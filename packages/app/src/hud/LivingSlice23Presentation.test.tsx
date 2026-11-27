import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  RELATIONSHIP_GIFT_RECENT,
  TRAINING_NOTE_IDLE,
  createGameState,
  relationshipDetailSnapshot,
  setLivingSwitch,
  trainingProgressSnapshot,
  unitUnlockSnapshot,
  type GameState,
} from "@second-crown/sim";
import { ArmyTab } from "../tabs/ArmyTab";
import {
  RealmRelationshipCard,
  resolveRealmRelationshipDetail,
} from "./RealmRelationshipCard";
import {
  TrainingProgressLine,
  resolveTrainingProgress,
} from "./TrainingProgressLine";
import {
  UnitUnlockExpander,
  resolveUnitUnlocks,
} from "./UnitUnlockExpander";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function bareArmyState(): GameState {
  const s = createGameState({ seed: 1, now: 1, withStarterBuildings: false });
  s.buildings = [];
  s.citizens = [];
  return s;
}

describe("Living Realm Slice 23: training progress, unit unlocks, and relationship detail", () => {
  it("renders TrainingProgressLine in ArmyTab for idle and active queues and hides with no Barracks or off", () => {
    expect(resolveTrainingProgress(undefined)).toBeNull();
    expect(renderToStaticMarkup(<TrainingProgressLine state={{} as GameState} />)).toBe("");

    const noYard = bareArmyState();
    expect(trainingProgressSnapshot(noYard)).toBeNull();
    expect(renderToStaticMarkup(<TrainingProgressLine state={noYard} />)).toBe("");

    // Add finished Barracks -> idle note
    noYard.buildings.push({
      id: "bk_23",
      typeId: "barracks",
      realmId: "player",
      x: 2,
      y: 2,
      level: 1,
      completesAtTick: null,
    } as GameState["buildings"][number]);
    noYard.meta.tick = 100;
    expect(renderToStaticMarkup(<TrainingProgressLine state={noYard} />)).toContain(TRAINING_NOTE_IDLE);

    // Active + queued job
    noYard.flags.training_json = JSON.stringify([
      {
        id: "tr_1",
        realmId: "player",
        typeId: "militia",
        count: 2,
        startedTick: 100,
        doneTick: 160,
      },
      {
        id: "tr_2",
        realmId: "player",
        typeId: "spearman",
        count: 1,
        startedTick: 160,
        doneTick: 240,
      },
    ]);
    noYard.meta.tick = 115;
    const snap = trainingProgressSnapshot(noYard)!;
    expect(snap.active?.id).toBe("tr_1");
    expect(snap.queue).toHaveLength(1);

    const armyHtml = renderToStaticMarkup(
      <ArmyTab state={noYard} act={() => ({ ok: true })} trainQty={1} setTrainQty={() => {}} />,
    );
    expect(armyHtml).toContain("sc-train-progress-line");
    expect(armyHtml).toContain('data-train-active="tr_1"');
    expect(armyHtml).toContain('data-train-queued="1"');
    expect(armyHtml).toContain(snap.active!.name);
    expect(armyHtml).toContain(`(${snap.active!.ticksLeft}t)`);
    expect(armyHtml).toContain("+1 queued");

    setLivingSwitch(noYard, "trainingProgress", false);
    expect(renderToStaticMarkup(<TrainingProgressLine state={noYard} />)).toBe("");
  });

  it("renders collapsed UnitUnlockExpander in ArmyTab from unitUnlockSnapshot and hides when null or off", () => {
    expect(resolveUnitUnlocks(undefined)).toBeNull();
    expect(renderToStaticMarkup(<UnitUnlockExpander state={{} as GameState} />)).toBe("");

    const s = bareArmyState();
    const snap = unitUnlockSnapshot(s)!;
    expect(snap.ready.length).toBeGreaterThan(0);

    const html = renderToStaticMarkup(
      <ArmyTab state={s} act={() => ({ ok: true })} trainQty={1} setTrainQty={() => {}} />,
    );
    expect(html).toContain('<details class="sc-unit-unlocks"');
    expect(html).not.toContain('open=""');
    expect(html).not.toContain(" open>");
    expect(html).toContain(`Unit unlocks · ${snap.ready.length} ready · ${snap.locked.length} locked`);
    for (const u of snap.ready) {
      expect(html).toContain(`data-unlock-unit-ready="${u.id}"`);
    }
    for (const u of snap.locked) {
      expect(html).toContain(`data-unlock-unit-locked="${u.id}"`);
      expect(html).toContain(u.requires);
    }

    setLivingSwitch(s, "unitUnlocks", false);
    expect(renderToStaticMarkup(<UnitUnlockExpander state={s} />)).toBe("");
  });

  it("renders quiet last-gift and suggestion sub-note in RealmRelationshipCard and hides when null or off", () => {
    expect(resolveRealmRelationshipDetail(undefined, "rival")).toBeNull();

    const s = createGameState({ seed: 1 });
    s.meta.tick = 400;
    const npc = s.realms.find((r) => r.id !== "player")!;
    // Ensure NPC realm appears in known summary by setting peace lock + clearing wars
    s.wars = [];
    s.flags[`peace_player_${npc.id}`] = 900;
    s.inputLog.push({
      seq: 1,
      tick: 380,
      type: "gift",
      payload: { to: npc.id },
    } as GameState["inputLog"][number]);

    const detail = relationshipDetailSnapshot(s, npc.id)!;
    expect(detail.lastGift).toBe(RELATIONSHIP_GIFT_RECENT);

    const cardHtml = renderToStaticMarkup(<RealmRelationshipCard state={s} />);
    expect(cardHtml).toContain("sc-rel-detail-note");
    expect(cardHtml).toContain(`data-rel-detail-realm="${npc.id}"`);
    expect(cardHtml).toContain(RELATIONSHIP_GIFT_RECENT);
    if (detail.suggestion) {
      expect(cardHtml).toContain(detail.suggestion);
    }

    setLivingSwitch(s, "relationshipDetail", false);
    const offHtml = renderToStaticMarkup(<RealmRelationshipCard state={s} />);
    expect(offHtml).toContain("sc-rel-card");
    expect(offHtml).not.toContain("sc-rel-detail-note");
  });

  it("isolates Slice 23 styles with Dusk/Night/Parchment tokens, non-blocking elements, reduced motion, and zero forbidden selectors", () => {
    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const cssPath of [
      "./training-progress.css",
      "./unit-unlocks.css",
      "./relationship-detail.css",
    ]) {
      const css = readTextFile(cssPath);
      expect(css, cssPath).toContain(':root[data-chrome="dusk"]');
      expect(css, cssPath).toContain(':root[data-chrome="night"]');
      expect(css, cssPath).toContain(':root[data-chrome="parchment"]');
      expect(css, cssPath).toContain("pointer-events: none !important;");
      expect(css, cssPath).toContain("@media (prefers-reduced-motion: reduce)");
      for (const token of forbidden) {
        expect(css, `${cssPath} should not contain ${token}`).not.toContain(token);
      }
    }
  });
});
