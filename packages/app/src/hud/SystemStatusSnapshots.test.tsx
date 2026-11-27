import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  createGameState,
  economyPressureSnapshot,
  researchProgressSnapshot,
  courtStatusSnapshot,
  boardFeedbackSnapshot,
  setLivingSwitch,
  storageCap,
  type GameState,
} from "@second-crown/sim";
import { BoardLiving } from "../BoardLiving";
import { KingdomTab } from "../tabs/KingdomTab";
import { EconomyPressureLine, resolveEconomyPressure } from "./EconomyPressureLine";
import { ResearchProgressLine, resolveResearchProgress } from "./ResearchProgressLine";
import { CourtStatusLine, resolveCourtStatus } from "./CourtStatusLine";
import { BoardFeedbackLayer, resolveBoardFeedback } from "./BoardFeedbackLayer";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function makeAllOkEconomy(s: GameState) {
  for (const res of ["food", "wood", "stone", "gold"] as const) {
    const cap = storageCap(s, res);
    s.resources[res] = String(Math.floor(cap * 0.5));
  }
}

describe("Living Realm Slice 16: Economy, Research, Court, and Board Feedback status", () => {
  it("hides EconomyPressureLine when partial, off, or all ok, and shows calm pips under pressure on KingdomTab", () => {
    expect(resolveEconomyPressure(undefined)).toBeNull();
    expect(renderToStaticMarkup(<EconomyPressureLine state={undefined} />)).toBe("");

    const s = createGameState({ seed: 1, withStarterBuildings: true });
    s.meta.tick = 100;
    makeAllOkEconomy(s);
    const okSnap = economyPressureSnapshot(s)!;
    expect(okSnap).toEqual({
      foodPressure: "ok",
      woodPressure: "ok",
      stonePressure: "ok",
      goldPressure: "ok",
      fullStores: [],
      bareFood: false,
    });
    expect(renderToStaticMarkup(<EconomyPressureLine state={s} />)).toBe("");

    // Bare food (high) + high wood fill (low pressure)
    s.resources.food = "0";
    s.resources.wood = String(storageCap(s, "wood"));
    const html = renderToStaticMarkup(
      <KingdomTab state={s} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    expect(html).toContain("sc-econ-status-line");
    expect(html).toContain("food bare");
    expect(html).toContain("wood ample");
    expect(html).toContain("full: wood");

    setLivingSwitch(s, "economyStatus", false);
    expect(resolveEconomyPressure(s)).toBeNull();
    expect(renderToStaticMarkup(<EconomyPressureLine state={s} />)).toBe("");
  });

  it("renders ResearchProgressLine for active and idle studies on KingdomTab and hides when off", () => {
    expect(resolveResearchProgress(undefined)).toBeNull();

    const s = createGameState({ seed: 1, withStarterBuildings: true });
    s.meta.tick = 100;
    s.flags.research_husbandry_until = 180;
    s.flags.research_husbandry_total = 160;
    s.flags.research_forestry = 1;

    const activeSnap = researchProgressSnapshot(s)!;
    expect(activeSnap.active?.id).toBe("husbandry");
    expect(activeSnap.completedCount).toBe(1);

    const html = renderToStaticMarkup(
      <KingdomTab state={s} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    expect(html).toContain("sc-sys-status-line is-research");
    expect(html).toContain(`Studying <strong>${activeSnap.active!.name}</strong>`);
    expect(html).toContain("(~8s left)");
    expect(html).toContain("1 known");
    expect(html).toContain("sc-sys-bar-fill");

    // Idle lectern shows completed count and next available study if any
    delete s.flags.research_husbandry_until;
    delete s.flags.research_husbandry_total;
    const idleHtml = renderToStaticMarkup(<ResearchProgressLine state={s} />);
    expect(idleHtml).toContain("Research: 1 known");

    setLivingSwitch(s, "researchStatus", false);
    expect(resolveResearchProgress(s)).toBeNull();
    expect(renderToStaticMarkup(<ResearchProgressLine state={s} />)).toBe("");
  });

  it("renders CourtStatusLine on KingdomTab and hides with no court or switch off", () => {
    expect(resolveCourtStatus(undefined)).toBeNull();

    const s = createGameState({ seed: 1 });
    s.meta.tick = 500;
    s.flags.decree_muster_until = 900;

    const snap = courtStatusSnapshot(s)!;
    expect(snap.activeDecrees).toEqual(["muster"]);
    expect(snap.lastDecree?.id).toBe("muster");

    const html = renderToStaticMarkup(
      <KingdomTab state={s} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    expect(html).toContain("sc-sys-status-line is-court");
    expect(html).toContain(`Court: 1 active · ${snap.openSlots} open`);
    expect(html).toContain(`last: ${snap.lastDecree!.name} (active)`);

    // No player character -> returns null
    const noCourt = createGameState({ seed: 1 });
    noCourt.characters = noCourt.characters.filter((c) => c.realmId !== "player");
    expect(courtStatusSnapshot(noCourt)).toBeNull();
    expect(renderToStaticMarkup(<CourtStatusLine state={noCourt} />)).toBe("");

    setLivingSwitch(s, "courtStatus", false);
    expect(renderToStaticMarkup(<CourtStatusLine state={s} />)).toBe("");
  });

  it("renders non-blocking BoardFeedbackLayer highlights & pending march ETA in BoardLiving", () => {
    expect(resolveBoardFeedback(undefined)).toBeNull();

    const s = createGameState({ seed: 1 });
    s.meta.tick = 400;
    const home = s.board.homeProvinceId;
    const other = s.board.provinces.find((p) => p.id !== home)!;

    // Empty when nothing selected, inspected, or marching
    expect(resolveBoardFeedback(s, {})).toBeNull();
    expect(
      renderToStaticMarkup(<svg><BoardFeedbackLayer state={s} selectedId={null} /></svg>),
    ).toBe("<svg></svg>");

    // Active selection + distinct last inspected + pending player march
    s.flags.marches_json = JSON.stringify([
      {
        id: "m1",
        realmId: "player",
        fromId: home,
        toId: other.id,
        arrivesTick: 490,
        kind: "node",
        levy: 5,
        purpose: "scout",
      },
    ]);
    const simFb = boardFeedbackSnapshot(s, {
      selectedProvinceId: home,
      lastInspectedProvinceId: other.id,
    })!;
    expect(simFb.pendingMarch?.arrivesInTicks).toBe(90);

    const html = renderToStaticMarkup(
      <BoardLiving state={s} selectedId={home} lastInspectedId={other.id} visible />,
    );
    expect(html).toContain("sc-fb-layer");
    expect(html).toContain('style="pointer-events:none"');
    expect(html).toContain(`data-fb-selected="${home}"`);
    expect(html).toContain("sc-fb-selected-rim");
    expect(html).toContain(">Home<");
    expect(html).toContain(`data-fb-inspected="${other.id}"`);
    expect(html).toContain("sc-fb-inspected-rim");
    expect(html).toContain('data-fb-march="m1"');
    expect(html).toContain("scout · ~9s");

    setLivingSwitch(s, "boardFeedback", false);
    expect(
      renderToStaticMarkup(
        <svg><BoardFeedbackLayer state={s} selectedId={home} lastInspectedId={other.id} /></svg>,
      ),
    ).toBe("<svg></svg>");
  });

  it("keeps all three dedicated CSS files isolated, non-blocking, theme-compatible, and reduced-motion safe", () => {
    for (const file of [
      "./economy-pressure-status.css",
      "./research-court-status.css",
      "./board-feedback-status.css",
    ]) {
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
