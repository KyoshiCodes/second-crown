import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { ElitePayoffPip, resolveElitePayoffBadge } from "./ElitePayoffPip";
import { RaidPressureCue, summarizeRaidPressure } from "./RaidPressureCue";
import { UnitCard } from "./UnitCard";
import { WarRoom } from "../WarRoom";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("summarizeRaidPressure & RaidPressureCue", () => {
  it("stays calm on a fresh hold before HOME_RAID_FIRST_TICK", () => {
    expect(summarizeRaidPressure(undefined).tone).toBe("calm");

    const s = createGameState({ seed: 1 });
    expect(summarizeRaidPressure(s).tone).toBe("calm");
    expect(renderToStaticMarkup(<RaidPressureCue state={s} />)).toBe("");
  });

  it("shows recovering sage state when breach recovery room is active", () => {
    const s = createGameState({ seed: 1 });
    s.flags.home_raid_breach_run = 1;
    const sum = summarizeRaidPressure(s);
    expect(sum.tone).toBe("recovering");
    expect(sum.tag).toBe("Recovery");
    expect(sum.text).toContain("Recovery room");
    expect(sum.text).toContain("5m respite");

    const html = renderToStaticMarkup(
      <WarRoom state={s} act={() => {}} rivalOp={0} playerOp={0} battleSnap={null} setBattleSnap={() => {}} />,
    );
    expect(html).toContain("sc-home-front is-raid-recovering");
    expect(html).toContain('data-raid-pressure="recovering"');
    expect(html).toContain('data-raid-pressure-cue="recovering"');
  });

  it("shows elevated amber pressure when raid window opens or a raid is inbound, unless shielded", () => {
    const s = createGameState({ seed: 1 });
    s.meta.tick = 3200;
    const dueSum = summarizeRaidPressure(s);
    expect(dueSum.tone).toBe("elevated");
    expect(dueSum.text).toContain("Raid window open");
    expect(dueSum.text).toContain("No walls yet");

    const dueHtml = renderToStaticMarkup(
      <WarRoom state={s} act={() => {}} rivalOp={0} playerOp={0} battleSnap={null} setBattleSnap={() => {}} />,
    );
    expect(dueHtml).toContain("sc-home-front is-raid-elevated");
    expect(dueHtml).toContain('data-raid-pressure="elevated"');

    const rival = s.realms.find((r) => r.id !== "player")!.id;
    s.flags.marches_json = JSON.stringify([
      {
        id: "r_in",
        realmId: rival,
        fromId: "x",
        toId: s.board.homeProvinceId,
        arrivesTick: s.meta.tick + TICKS_PER_SECOND * 10,
        kind: "hold",
        levy: 4,
      },
    ]);
    expect(summarizeRaidPressure(s).text).toContain("Raid inbound");

    s.flags.shield_until = s.meta.tick + 500;
    expect(summarizeRaidPressure(s).tone).toBe("calm");
  });
});

describe("ElitePayoffPip & UnitCard payoff roles", () => {
  it("classifies cavalry (Shock), knight (Heavy), and siege (Wall-breaker) while leaving basic infantry null", () => {
    expect(resolveElitePayoffBadge("militia")).toBeNull();
    expect(resolveElitePayoffBadge("spearman")).toBeNull();
    expect(resolveElitePayoffBadge("cavalry")).toEqual({ kind: "shock", label: "Shock", shape: "lance" });
    expect(resolveElitePayoffBadge("knight")).toEqual({ kind: "heavy", label: "Heavy", shape: "shield" });
    expect(resolveElitePayoffBadge("siege")).toEqual({ kind: "wall-ignore", label: "Wall-breaker", shape: "ram" });
  });

  it("mounts phrasing-only role pips inside UnitCard without disturbing elite classes or sim text", () => {
    for (const [typeId, name, roleKind, label, extraText] of [
      ["cavalry", "Cavalry", "shock", "Shock", "Rides down archer screens; a spear line stops it."],
      ["knight", "Knight", "heavy", "Heavy", "Six take the bandit stockade; four steady a home guard."],
      ["siege", "Siege Engine", "wall-ignore", "Wall-breaker", "Ignores camp palisades: one turns a stockade loss into a win."],
    ] as const) {
      const html = renderToStaticMarkup(
        <UnitCard
          typeId={typeId}
          name={name}
          power={20}
          cost={{ food: "100" }}
          ticks={600}
          open
          lock=""
          affordable
          tier={4}
          onTrain={() => {}}
        />,
      );
      expect(html).toContain(`sc-unit-payoff is-payoff-${roleKind}`);
      expect(html).toContain(`data-payoff-role="${roleKind}"`);
      expect(html).toContain(`data-payoff-pip="${roleKind}"`);
      expect(html).toContain(`>${label}</span>`);
      expect(html).toContain(extraText);
      expect(html).toContain('class="sc-unit-card is-ready is-elite-tier is-tier-4"');
      expect(html).not.toMatch(/<(div|p|dl)\b/);
    }

    const locked = renderToStaticMarkup(
      <UnitCard
        typeId="knight"
        name="Knight"
        power={25}
        cost={{ food: "180" }}
        ticks={1200}
        open={false}
        lock="Needs Horse lore."
        affordable={false}
        tier={3}
        onTrain={() => {}}
      />,
    );
    expect(locked).toContain("sc-payoff-pip is-heavy is-locked");
  });
});

describe("raid-payoff-accents.css isolation and safety", () => {
  const css = readTextFile("./raid-payoff-accents.css");
  const raidSrc = readTextFile("./RaidPressureCue.tsx");
  const pipSrc = readTextFile("./ElitePayoffPip.tsx");
  const themeCss = readTextFile("../theme.css");
  const payoffCss = readTextFile("./unit-payoff.css");

  it("is imported from RaidPressureCue and ElitePayoffPip and leaves theme.css and unit-payoff.css untouched", () => {
    expect(raidSrc).toContain('import "./raid-payoff-accents.css";');
    expect(pipSrc).toContain('import "./raid-payoff-accents.css";');
    expect(themeCss).not.toContain("sc-raid-pressure");
    expect(themeCss).not.toContain("sc-payoff-pip");
    expect(payoffCss).not.toContain("sc-payoff-pip");
  });

  it("supports Dusk, Night, Parchment themes, click immunity, and reduced motion", () => {
    expect(css).toContain(':root[data-chrome="dusk"]');
    expect(css).toContain(':root[data-chrome="night"]');
    expect(css).toContain(':root[data-chrome="parchment"]');
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important;");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-raid-elevated-glow");
    expect(css).toContain("@keyframes sc-raid-recover-glow");
    expect(css).toContain("@keyframes sc-payoff-pip-breathe");
  });

  it("never touches board, chat, admin, theme dock, or ledger cell selectors", () => {
    expect(css).not.toContain(".sc-board");
    expect(css).not.toContain(".sc-chat-float");
    expect(css).not.toContain(".sc-admin-float");
    expect(css).not.toContain(".sc-theme-dock");
    expect(css).not.toContain(".sc-ledger-cell");
  });
});
