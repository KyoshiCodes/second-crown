import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BATTLE_NOTE_RECENT_TICKS,
  CLASH_NOTE_CLEAN,
  CLASH_NOTE_COSTLY,
  CLASH_OUTCOME_LOST,
  CLASH_OUTCOME_OTHERS,
  CLASH_OUTCOME_WON,
  clashResultSnapshot,
  createGameState,
  isProvinceSeen,
  lastBattleStory,
  setLivingSwitch,
  unitWaitingSnapshot,
  type GameState,
} from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import { WarRoom } from "../WarRoom";
import { ArmyTab } from "../tabs/ArmyTab";
import { BoardUnitWaitingLayer, resolveBoardUnitWaiting } from "./BoardUnitWaitingLayer";
import { ClashResultPanel, resolveClashResult } from "./ClashResultPanel";
import { UnitCard } from "./UnitCard";
import { UnitWaitingList, resolveUnitWaiting, resolveUnitWaitingBadge } from "./UnitWaitingList";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function emptyWarState(): GameState {
  const s = createGameState({ seed: 1, now: 1, withStarterBuildings: false });
  s.meta.tick = 2000;
  s.wars = [];
  s.flags.marches_json = "[]";
  s.flags.garrisons_json = "[]";
  delete s.flags.last_battle_json;
  s.flags.world_log = "[]";
  return s;
}

describe("Living Realm Slice 25: clash result panel & unit waiting visuals", () => {
  it("renders ClashResultPanel in WarRoom with forces, strengths, casualties, outcome, and note, and hides when null or stale or off", () => {
    expect(resolveClashResult(undefined)).toBeNull();
    expect(renderToStaticMarkup(<ClashResultPanel state={{} as GameState} />)).toBe("");

    const s = emptyWarState();
    expect(clashResultSnapshot(s)).toBeNull();
    expect(renderToStaticMarkup(<ClashResultPanel state={s} />)).toBe("");

    const emptyWarHtml = renderToStaticMarkup(
      <WarRoom
        state={s}
        act={() => ({ ok: true })}
        rivalOp={0}
        playerOp={0}
        battleSnap={null}
        setBattleSnap={() => {}}
      />,
    );
    expect(emptyWarHtml).not.toContain("sc-clash-result");

    const npcs = s.realms.filter((r) => r.id !== "player");
    const rival = npcs[0];
    const ally = npcs[1];

    // Stale battle (> BATTLE_NOTE_RECENT_TICKS) hides cleanly
    s.flags.world_log = JSON.stringify([
      { tick: s.meta.tick - BATTLE_NOTE_RECENT_TICKS - 1, id: "battle", text: "Old clash." },
    ]);
    s.flags.last_battle_json = JSON.stringify({
      winnerId: "player",
      loserId: rival.id,
      events: [],
      phases: [],
      forces: [
        { side: "attacker", realmId: "player", strength: 18, casualties: 0 },
        { side: "defender", realmId: rival.id, strength: 10, casualties: 5 },
      ],
    });
    expect(renderToStaticMarkup(<ClashResultPanel state={s} />)).toBe("");

    // Recent clean victory in WarRoom
    s.flags.world_log = JSON.stringify([{ tick: 1990, id: "battle", text: "Swift victory." }]);
    const wonHtml = renderToStaticMarkup(
      <WarRoom
        state={s}
        act={() => ({ ok: true })}
        rivalOp={0}
        playerOp={0}
        battleSnap={null}
        setBattleSnap={() => {}}
      />,
    );
    expect(wonHtml).toContain("sc-clash-result is-won");
    expect(wonHtml).toContain(CLASH_OUTCOME_WON);
    expect(wonHtml).toContain(CLASH_NOTE_CLEAN);
    expect(wonHtml).toContain('data-clash-side="attacker"');
    expect(wonHtml).toContain('data-clash-side="defender"');
    expect(wonHtml).toContain("pwr 18");
    expect(wonHtml).toContain("0 losses");
    expect(wonHtml).toContain("pwr 10");
    expect(wonHtml).toContain("5 losses");
    expect(wonHtml).toContain(rival.name);

    // Recent costly defeat
    s.flags.last_battle_json = JSON.stringify({
      winnerId: rival.id,
      loserId: "player",
      events: [{ round: 1, text: "Front buckled." }],
      phases: [],
      forces: [
        { side: "attacker", realmId: rival.id, strength: 22, casualties: 1 },
        { side: "defender", realmId: "player", strength: 12, casualties: 6 },
      ],
    });
    const lostHtml = renderToStaticMarkup(<ClashResultPanel state={s} story={lastBattleStory(s)} />);
    expect(lostHtml).toContain("sc-clash-result is-lost");
    expect(lostHtml).toContain(CLASH_OUTCOME_LOST);
    expect(lostHtml).toContain(CLASH_NOTE_COSTLY);
    expect(lostHtml).toContain("1 loss");
    expect(lostHtml).toContain("6 losses");
    expect(lostHtml).toContain("Blow by blow (1)");

    // Others fought (no note) & legacy battle record (forces missing)
    s.flags.last_battle_json = JSON.stringify({
      winnerId: rival.id,
      loserId: ally.id,
      events: [],
      phases: [],
    });
    const othersHtml = renderToStaticMarkup(<ClashResultPanel state={s} />);
    expect(othersHtml).toContain("sc-clash-result is-other");
    expect(othersHtml).toContain(CLASH_OUTCOME_OTHERS);
    expect(othersHtml).not.toContain("sc-clash-result-forces");
    expect(othersHtml).not.toContain("sc-clash-result-note");

    setLivingSwitch(s, "clashResult", false);
    expect(renderToStaticMarkup(<ClashResultPanel state={s} />)).toBe("");
  });

  it("renders seen-only posted & waiting marks on BoardLiving from unitWaitingSnapshot and respects fog & switch", () => {
    expect(resolveBoardUnitWaiting(undefined)).toBeNull();
    expect(renderToStaticMarkup(<BoardUnitWaitingLayer state={{} as GameState} />)).toBe("");

    const s = emptyWarState();
    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    const seenProv = s.board.provinces.find((p) => p.id !== home.id && isProvinceSeen(s, p.id))!;
    const unseenProv = s.board.provinces.find((p) => p.id !== home.id && !isProvinceSeen(s, p.id));

    s.flags.garrisons_json = JSON.stringify([
      { provinceId: seenProv.id, force: { militia: 4 } },
      ...(unseenProv ? [{ provinceId: unseenProv.id, force: { spearman: 2 } }] : []),
    ]);
    s.flags.marches_json = JSON.stringify([
      {
        id: "m_seen",
        realmId: "player",
        fromId: home.id,
        toId: seenProv.id,
        arrivesTick: 2040,
        kind: "node",
        levy: 0,
        force: { archer: 3 },
      },
      ...(unseenProv
        ? [
            {
              id: "m_fog",
              realmId: "player",
              fromId: home.id,
              toId: unseenProv.id,
              arrivesTick: 2050,
              kind: "node",
              levy: 2,
            },
          ]
        : []),
    ]);

    const html = renderToStaticMarkup(<BoardLiving visible state={s} selectedId={null} />);
    expect(html).toContain('class="sc-uw-board-layer"');
    expect(html).toContain("pointer-events:none");
    expect(html).toContain(`data-uw-state="posted" data-uw-province="${seenProv.id}"`);
    expect(html).toContain(`data-uw-state="waiting" data-uw-province="${seenProv.id}"`);
    expect(html).toContain("Posted · Militia");
    expect(html).toContain("Marching · Archer · ~4s");
    if (unseenProv) {
      expect(html).not.toContain(`data-uw-province="${unseenProv.id}"`);
    }

    setLivingSwitch(s, "unitWaiting", false);
    expect(renderToStaticMarkup(<BoardUnitWaitingLayer state={s} />)).toBe("");
  });

  it("renders UnitWaitingList in WarRoom and ArmyTab and phrasing-only badges on matching UnitCards", () => {
    expect(resolveUnitWaiting(undefined)).toBeNull();
    expect(renderToStaticMarkup(<UnitWaitingList state={{} as GameState} />)).toBe("");

    const s = emptyWarState();
    expect(unitWaitingSnapshot(s)).toBeNull();
    expect(renderToStaticMarkup(<UnitWaitingList state={s} />)).toBe("");

    // Default UnitCard without waitingState changes nothing
    const plainCardHtml = renderToStaticMarkup(
      <UnitCard
        typeId="militia"
        name="Militia"
        power={1}
        cost={{ food: 2 }}
        ticks={10}
        open={true}
        lock=""
        affordable={true}
        onTrain={() => {}}
      />,
    );
    expect(plainCardHtml).not.toContain("sc-unit-waiting-badge");
    expect(plainCardHtml).not.toContain("data-unit-waiting");
    expect(plainCardHtml).not.toContain("<div");

    const home = s.board.provinces.find((p) => p.id === s.board.homeProvinceId)!;
    const seenProv = s.board.provinces.find((p) => p.id !== home.id && isProvinceSeen(s, p.id))!;

    s.flags.garrisons_json = JSON.stringify([
      { provinceId: seenProv.id, force: { militia: 3, spearman: 2 } },
    ]);
    s.flags.marches_json = JSON.stringify([
      {
        id: "m_wait",
        realmId: "player",
        fromId: home.id,
        toId: seenProv.id,
        arrivesTick: 2025,
        kind: "hold",
        levy: 4,
      },
    ]);

    const snap = unitWaitingSnapshot(s)!;
    expect(resolveUnitWaitingBadge(snap, "militia")).toBe("both");
    expect(resolveUnitWaitingBadge(snap, "spearman")).toBe("posted");
    expect(resolveUnitWaitingBadge(snap, "archer")).toBeNull();

    const armyHtml = renderToStaticMarkup(
      <ArmyTab state={s} act={() => ({ ok: true })} trainQty={1} setTrainQty={() => {}} />,
    );
    expect(armyHtml).toContain("sc-uw-list");
    expect(armyHtml).toContain('data-uw-kind="posted"');
    expect(armyHtml).toContain('data-uw-kind="waiting"');
    expect(armyHtml).toContain("sc-unit-waiting-badge is-both");
    expect(armyHtml).toContain("Posted · Marching");
    expect(armyHtml).toContain("sc-unit-waiting-badge is-posted");
    expect(armyHtml).toContain(`${seenProv.x},${seenProv.y}`);
    expect(armyHtml).toContain("~3s (25t)");

    const warHtml = renderToStaticMarkup(
      <WarRoom
        state={s}
        act={() => ({ ok: true })}
        rivalOp={0}
        playerOp={0}
        battleSnap={null}
        setBattleSnap={() => {}}
      />,
    );
    expect(warHtml).toContain("sc-uw-list is-compact");
    expect(warHtml).toContain('data-uw-unit="militia"');
    expect(warHtml).toContain('data-uw-unit="spearman"');

    setLivingSwitch(s, "unitWaiting", false);
    const offArmyHtml = renderToStaticMarkup(
      <ArmyTab state={s} act={() => ({ ok: true })} trainQty={1} setTrainQty={() => {}} />,
    );
    expect(offArmyHtml).not.toContain("sc-uw-list");
    expect(offArmyHtml).not.toContain("sc-unit-waiting-badge");
  });

  it("isolates Slice 25 styles with Dusk/Night/Parchment tokens, non-blocking pips, reduced motion, and zero forbidden selectors", () => {
    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const cssPath of [
      "./clash-result.css",
      "./unit-waiting-board.css",
      "./unit-waiting-list.css",
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
