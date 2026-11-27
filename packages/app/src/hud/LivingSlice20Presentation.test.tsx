import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ACADEMY_NOTE_BUILDING,
  ACADEMY_NOTE_IDLE,
  academyFeedbackSnapshot,
  createGameState,
  researchDetailSnapshot,
  researchProgressDetailSnapshot,
  setLivingSwitch,
  studyEffectPreviewSnapshot,
  type GameState,
} from "@second-crown/sim";
import { KingdomTab } from "../tabs/KingdomTab";
import {
  AcademyFeedbackLine,
  resolveAcademyFeedback,
} from "./AcademyFeedbackLine";
import {
  ResearchDetailExpander,
  resolveStudyEffectPreview,
} from "./ResearchDetailExpander";
import {
  ResearchProgressDetailBar,
  resolveResearchProgressDetail,
} from "./ResearchProgressDetailBar";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function escapeHtmlText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

describe("Living Realm Slice 20: research progress, study previews, and academy feedback", () => {
  it("renders ResearchProgressDetailBar with thin bar & percent when active and hides when null or off", () => {
    expect(resolveResearchProgressDetail(undefined)).toBeNull();
    expect(renderToStaticMarkup(<ResearchProgressDetailBar state={{} as GameState} />)).toBe("");

    const s = createGameState({ seed: 1, withStarterBuildings: true });
    s.meta.tick = 100;
    for (const k of Object.keys(s.flags)) if (k.startsWith("research_")) delete s.flags[k];

    // Idle research -> hides cleanly
    expect(researchProgressDetailSnapshot(s)).toBeNull();
    expect(renderToStaticMarkup(<ResearchProgressDetailBar state={s} />)).toBe("");

    // Active study -> 50% progress bar right under ResearchProgressLine
    s.flags.research_husbandry_until = 180;
    s.flags.research_husbandry_total = 160;
    const snap = researchProgressDetailSnapshot(s)!;
    expect(snap).toMatchObject({ activeId: "husbandry", percent: 50, ticksLeft: 80, totalTicks: 160 });

    const tabHtml = renderToStaticMarkup(
      <KingdomTab state={s} act={() => ({ ok: true })} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    const linePos = tabHtml.indexOf("is-research");
    const barPos = tabHtml.indexOf("sc-rpd-row");
    expect(linePos).toBeGreaterThan(-1);
    expect(barPos).toBeGreaterThan(linePos);
    expect(tabHtml).toContain('data-rpd-id="husbandry"');
    expect(tabHtml).toContain('data-rpd-percent="50"');
    expect(tabHtml).toContain("width:50%");
    expect(tabHtml).toContain("50%");
    expect(tabHtml).toContain("(~8s)");

    // Switch off -> hides cleanly
    setLivingSwitch(s, "researchProgress", false);
    expect(renderToStaticMarkup(<ResearchProgressDetailBar state={s} />)).toBe("");
  });

  it("shows optional study-effect previews from studyEffectPreviewSnapshot inside ResearchDetailExpander", () => {
    expect(resolveStudyEffectPreview(undefined, "husbandry")).toBeNull();

    const s = createGameState({ seed: 1, withStarterBuildings: true });
    s.meta.tick = 100;
    const detail = researchDetailSnapshot(s)!;
    expect(detail.nextUnlocks.length).toBeGreaterThan(0);

    const html = renderToStaticMarkup(<ResearchDetailExpander state={s} />);
    expect(html).toContain('<details class="sc-research-detail"');
    expect(html).not.toContain('open=""');
    expect(html).not.toContain(" open>");

    for (const u of detail.nextUnlocks) {
      const preview = studyEffectPreviewSnapshot(s, u.id)!;
      const joined = preview.effects.join(" · ");
      expect(html).toContain(`data-preview-id="${u.id}"`);
      expect(html).toContain(`title="${escapeHtmlText(joined)}"`);
      expect(html).toContain(escapeHtmlText(joined));
    }

    // Switch off -> omits previews cleanly while keeping unlock names
    setLivingSwitch(s, "studyPreview", false);
    const offHtml = renderToStaticMarkup(<ResearchDetailExpander state={s} />);
    expect(offHtml).not.toContain("sc-study-preview");
    expect(offHtml).toContain(detail.nextUnlocks[0].name);
  });

  it("renders quiet AcademyFeedbackLine for building/bonus/idle and hides when no Academy or off", () => {
    expect(resolveAcademyFeedback(undefined)).toBeNull();
    expect(renderToStaticMarkup(<AcademyFeedbackLine state={{} as GameState} />)).toBe("");

    const s = createGameState({ seed: 1, withStarterBuildings: false });
    s.meta.tick = 200;
    s.buildings = s.buildings.filter((b) => b.typeId !== "academy");

    // No Academy -> hides cleanly
    expect(academyFeedbackSnapshot(s)).toBeNull();
    expect(renderToStaticMarkup(<AcademyFeedbackLine state={s} />)).toBe("");

    // Academy under construction -> building note
    s.buildings.push({
      id: "acad_test_1",
      typeId: "academy",
      realmId: "player",
      level: 1,
      completesAtTick: 280,
      x: 3,
      y: 20,
    } as GameState["buildings"][number]);
    const buildingHtml = renderToStaticMarkup(<AcademyFeedbackLine state={s} />);
    expect(buildingHtml).toContain("sc-academy-feedback");
    expect(buildingHtml).toContain('data-academy-built="false"');
    expect(buildingHtml).toContain(">building<");
    expect(buildingHtml).toContain(ACADEMY_NOTE_BUILDING);

    // Finished Academy while lectern idle -> bonus active + idle note under ResearchProgressLine
    s.buildings[s.buildings.length - 1].completesAtTick = null;
    const snap = academyFeedbackSnapshot(s)!;
    expect(snap).toMatchObject({ built: true, bonusActive: true, note: ACADEMY_NOTE_IDLE });

    const tabHtml = renderToStaticMarkup(
      <KingdomTab state={s} act={() => ({ ok: true })} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    const linePos = tabHtml.indexOf("is-research");
    const acadPos = tabHtml.indexOf("sc-academy-feedback");
    expect(linePos).toBeGreaterThan(-1);
    expect(acadPos).toBeGreaterThan(linePos);
    expect(tabHtml).toContain('data-academy-built="true"');
    expect(tabHtml).toContain('data-academy-bonus="true"');
    expect(tabHtml).toContain(">bonus active<");
    expect(tabHtml).toContain(ACADEMY_NOTE_IDLE);

    // Switch off -> hides cleanly
    setLivingSwitch(s, "academyFeedback", false);
    expect(renderToStaticMarkup(<AcademyFeedbackLine state={s} />)).toBe("");
  });

  it("isolates Slice 20 styles with Dusk/Night/Parchment tokens, non-blocking elements, reduced motion, and zero forbidden selectors", () => {
    const forbidden = [
      ".sc-ledger-cell::before",
      ".sc-ledger-cell::after",
      ".sc-board",
      ".sc-chat-float",
      ".sc-admin-float",
      ".sc-theme-dock",
    ];
    for (const cssPath of [
      "./research-progress-detail.css",
      "./study-effect-preview.css",
      "./academy-feedback.css",
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
