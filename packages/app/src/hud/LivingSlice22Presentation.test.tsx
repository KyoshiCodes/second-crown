import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  STAFFING_NOTE_ASSIGN,
  STAFFING_NOTE_SHORT,
  STAFFING_NOTE_SPARE,
  createGameState,
  jobSummarySnapshot,
  setLivingSwitch,
  staffingPressureSnapshot,
  type CitizenJobId,
  type GameState,
} from "@second-crown/sim";
import { PeoplePanel } from "../PeoplePanel";
import { KingdomTab } from "../tabs/KingdomTab";
import { JobSummaryExpander, resolveJobSummary } from "./JobSummaryExpander";
import {
  StaffingPressureLine,
  resolveStaffingPressure,
} from "./StaffingPressureLine";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function bareState(): GameState {
  const s = createGameState({ seed: 1, now: 1, withStarterBuildings: false });
  s.buildings = [];
  s.citizens = [];
  return s;
}

describe("Living Realm Slice 22: job summary and staffing pressure", () => {
  it("renders a collapsed-by-default JobSummaryExpander in PeoplePanel from jobSummarySnapshot and hides when null or off", () => {
    expect(resolveJobSummary(undefined)).toBeNull();
    expect(renderToStaticMarkup(<JobSummaryExpander state={{} as GameState} />)).toBe("");

    const empty = bareState();
    expect(jobSummarySnapshot(empty)).toBeNull();
    expect(renderToStaticMarkup(<JobSummaryExpander state={empty} />)).toBe("");

    const s = bareState();
    s.buildings.push({
      id: "farm_s22",
      typeId: "farm",
      realmId: "player",
      x: 4,
      y: 4,
      level: 1,
      completesAtTick: null,
    } as GameState["buildings"][number]);
    s.citizens.push(
      { id: "c1", realmId: "player", job: "farmer", tile: { x: 4, y: 4 } },
      { id: "c2", realmId: "player", job: "unassigned", tile: null },
    );

    const snap = jobSummarySnapshot(s)!;
    expect(snap.idle).toBe(1);
    expect(snap.byJob[0]).toMatchObject({ id: "farmer", count: 1 });

    const html = renderToStaticMarkup(
      <PeoplePanel state={s} act={() => ({ ok: true })} />,
    );
    expect(html).toContain('<details class="sc-job-summary"');
    expect(html).not.toContain('open=""');
    expect(html).not.toContain(" open>");
    expect(html).toContain('data-job-summary-idle="1"');
    expect(html).toContain(">Idle 1<");
    expect(html).toContain(`${snap.byJob[0].name} 1`);
    expect(html).toContain("Farm 4,4");

    setLivingSwitch(s, "jobSummary", false);
    expect(renderToStaticMarkup(<JobSummaryExpander state={s} />)).toBe("");
  });

  it("renders StaffingPressureLine in KingdomTab across assign/short/spare states and hides when balanced or off", () => {
    expect(resolveStaffingPressure(undefined)).toBeNull();
    expect(renderToStaticMarkup(<StaffingPressureLine state={{} as GameState} />)).toBe("");

    const balanced = bareState();
    expect(staffingPressureSnapshot(balanced)).toBeNull();
    expect(renderToStaticMarkup(<StaffingPressureLine state={balanced} />)).toBe("");

    // Empty building + idle villager -> ASSIGN
    const s = bareState();
    s.buildings.push({
      id: "farm_p22",
      typeId: "farm",
      realmId: "player",
      x: 2,
      y: 3,
      level: 1,
      completesAtTick: null,
    } as GameState["buildings"][number]);
    s.citizens.push({
      id: "c_idle",
      realmId: "player",
      job: "unassigned" as CitizenJobId,
      tile: null,
    });
    const assignTab = renderToStaticMarkup(
      <KingdomTab state={s} act={() => ({ ok: true })} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    const decreePos = assignTab.indexOf("sc-decree-effects-line");
    const staffPos = assignTab.indexOf("sc-staffing-pressure-line");
    expect(decreePos).toBeGreaterThan(-1);
    expect(staffPos).toBeGreaterThan(decreePos);
    expect(assignTab).toContain('data-staffing-empty="1"');
    expect(assignTab).toContain('data-staffing-idle="1"');
    expect(assignTab).toContain("1 empty · 1 idle");
    expect(assignTab).toContain(STAFFING_NOTE_ASSIGN);

    // Empty building, no idle villagers -> SHORT
    s.citizens = [];
    const shortHtml = renderToStaticMarkup(<StaffingPressureLine state={s} />);
    expect(shortHtml).toContain("1 empty");
    expect(shortHtml).toContain(STAFFING_NOTE_SHORT);

    // Idle villager, no empty buildings -> SPARE
    s.buildings = [];
    s.citizens.push({ id: "c_spare", realmId: "player", job: "unassigned", tile: null });
    const spareHtml = renderToStaticMarkup(<StaffingPressureLine state={s} />);
    expect(spareHtml).toContain("1 idle");
    expect(spareHtml).toContain(STAFFING_NOTE_SPARE);

    setLivingSwitch(s, "staffingPressure", false);
    expect(renderToStaticMarkup(<StaffingPressureLine state={s} />)).toBe("");
  });

  it("isolates Slice 22 styles with Dusk/Night/Parchment tokens, non-blocking pips, reduced motion, and zero forbidden selectors", () => {
    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const cssPath of [
      "./job-summary.css",
      "./staffing-pressure.css",
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
