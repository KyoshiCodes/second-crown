import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  FLAG_CONTEST_COOLDOWN_TICKS,
  createGameState,
  flagContestSnapshot,
  tryNpcMarch,
  type FlagContestRecord,
  type GameState,
} from "@second-crown/sim";
import { BoardFlagContests, listBoardFlagContests, listBoardFlagCooldowns } from "./BoardFlagContests";
import { resolveLivingCultureKit } from "./BoardLivingRealm";
import { BoardLiving } from "../BoardLiving";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("listBoardFlagContests, listBoardFlagCooldowns & BoardFlagContests", () => {
  it("guards partial mock GameState fixtures safely and renders empty when nothing is contested", () => {
    expect(listBoardFlagContests(undefined)).toEqual([]);
    expect(listBoardFlagContests({} as GameState)).toEqual([]);
    expect(listBoardFlagCooldowns(undefined)).toEqual([]);
    expect(listBoardFlagCooldowns({} as GameState)).toEqual([]);

    const s = createGameState({ seed: 1 });
    expect(listBoardFlagContests(s)).toEqual([]);
    expect(listBoardFlagCooldowns(s)).toEqual([]);
    const html = renderToStaticMarkup(<svg><BoardFlagContests state={s} /></svg>);
    expect(html).not.toContain("sc-flag-contest-layer");
  });

  it("renders a pulsing ring and contesting-culture seal for active contested flags in BoardLiving", () => {
    const s = createGameState({ seed: 1 });
    s.meta.tick = 1000;

    // Two player flags on non-home, non-hold provinces
    const openProvs = s.board.provinces.filter(
      (p) => p.node !== "hold" && p.id !== s.board.homeProvinceId && !p.occupantRealmId,
    );
    const flagA = openProvs[0];
    const flagB = openProvs[1];
    flagA.occupantRealmId = "player";
    flagB.occupantRealmId = "player";

    // Pick rival (Iron March) and a seeded NPC hold realm
    const npcHold = s.board.provinces.find(
      (p) => p.node === "hold" && p.occupantRealmId && p.occupantRealmId !== "player" && p.occupantRealmId !== "rival",
    )!;
    const npcId = npcHold.occupantRealmId!;
    const npcKit = resolveLivingCultureKit(s, npcId);

    // Queue real NPC marches toward each player flag
    tryNpcMarch(s, "rival", flagA.id);
    tryNpcMarch(s, npcId, flagB.id);
    const marches = JSON.parse(String(s.flags.marches_json)) as Array<{
      id: string;
      realmId: string;
      toId: string;
      arrivesTick: number;
    }>;
    const marchA = marches.find((m) => m.realmId === "rival" && m.toId === flagA.id)!;
    const marchB = marches.find((m) => m.realmId === npcId && m.toId === flagB.id)!;

    const records: FlagContestRecord[] = [
      {
        provinceId: flagA.id,
        realmId: "rival",
        marchId: marchA.id,
        sinceTick: s.meta.tick,
        untilTick: marchA.arrivesTick,
        cooldownUntil: marchA.arrivesTick + FLAG_CONTEST_COOLDOWN_TICKS,
      },
      {
        provinceId: flagB.id,
        realmId: npcId,
        marchId: marchB.id,
        sinceTick: s.meta.tick,
        untilTick: marchB.arrivesTick,
        cooldownUntil: marchB.arrivesTick + FLAG_CONTEST_COOLDOWN_TICKS,
      },
    ];
    s.flags.flag_contests_json = JSON.stringify(records);

    const snap = flagContestSnapshot(s);
    expect(snap.contests).toHaveLength(2);

    const points = listBoardFlagContests(s);
    expect(points).toHaveLength(2);
    expect(points.find((pt) => pt.provinceId === flagA.id)?.kit).toBe("iron");
    expect(points.find((pt) => pt.provinceId === flagB.id)?.kit).toBe(npcKit);

    const svgHtml = renderToStaticMarkup(<svg><BoardFlagContests state={s} /></svg>);
    expect(svgHtml).toContain("sc-flag-contest-layer");
    expect(svgHtml).toContain(`data-flag-contest="${flagA.id}"`);
    expect(svgHtml).toContain('data-contest-realm="rival"');
    expect(svgHtml).toContain('data-culture-kit="iron"');
    expect(svgHtml).toContain(`data-flag-contest="${flagB.id}"`);
    expect(svgHtml).toContain(`data-contest-realm="${npcId}"`);
    expect(svgHtml).toContain("sc-flag-contest-aura");
    expect(svgHtml).toContain("sc-flag-contest-ring");
    expect(svgHtml).toContain("sc-flag-contest-seal");

    // BoardLiving integration mounts the flag contest overlay
    const boardHtml = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible />);
    expect(boardHtml).toContain("sc-flag-contest-layer");
    expect(boardHtml).toContain(`data-flag-contest="${flagA.id}"`);
  });

  it("renders a quiet cooldown ring after arrival and prioritizes active contest over cooldown", () => {
    const s = createGameState({ seed: 1 });
    s.meta.tick = 1000;

    const flagProv = s.board.provinces.find(
      (p) => p.node !== "hold" && p.id !== s.board.homeProvinceId && !p.occupantRealmId,
    )!;
    flagProv.occupantRealmId = "player";

    tryNpcMarch(s, "rival", flagProv.id);
    const marches = JSON.parse(String(s.flags.marches_json)) as Array<{
      id: string;
      realmId: string;
      toId: string;
      arrivesTick: number;
    }>;
    const march = marches.find((m) => m.realmId === "rival" && m.toId === flagProv.id)!;

    // 1. Both an active contest and an older cooldown on the same flag -> active contest wins
    s.flags.flag_contests_json = JSON.stringify([
      {
        provinceId: flagProv.id,
        realmId: "rival",
        marchId: "ended-prev-march",
        sinceTick: 500,
        untilTick: 800,
        cooldownUntil: 1300,
      },
      {
        provinceId: flagProv.id,
        realmId: "rival",
        marchId: march.id,
        sinceTick: 1000,
        untilTick: march.arrivesTick,
        cooldownUntil: march.arrivesTick + FLAG_CONTEST_COOLDOWN_TICKS,
      },
    ]);
    expect(listBoardFlagContests(s)).toHaveLength(1);
    expect(listBoardFlagCooldowns(s)).toHaveLength(0);

    // 2. Advance tick past arrival so the flag enters cooldown rest
    s.meta.tick = march.arrivesTick + 10;
    s.flags.flag_contests_json = JSON.stringify([
      {
        provinceId: flagProv.id,
        realmId: "rival",
        marchId: march.id,
        sinceTick: 1000,
        untilTick: march.arrivesTick,
        cooldownUntil: march.arrivesTick + FLAG_CONTEST_COOLDOWN_TICKS,
      },
    ]);
    expect(listBoardFlagContests(s)).toHaveLength(0);
    expect(listBoardFlagCooldowns(s)).toHaveLength(1);

    const svgHtml = renderToStaticMarkup(<svg><BoardFlagContests state={s} /></svg>);
    expect(svgHtml).toContain(`data-flag-cooldown="${flagProv.id}"`);
    expect(svgHtml).toContain("sc-flag-cooldown-ring");
    expect(svgHtml).not.toContain(`data-flag-contest="${flagProv.id}"`);
  });

  it("keeps flag-contest-accents.css isolated, non-blocking, theme-compatible, and reduced-motion safe", () => {
    const css = readTextFile("./flag-contest-accents.css");
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
