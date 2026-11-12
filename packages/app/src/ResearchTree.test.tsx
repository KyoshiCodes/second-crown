import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, RESEARCH, researchRequires, researchTier } from "@second-crown/sim";
import { ResearchBar } from "./ResearchBar";
import { nextResearch } from "./ResearchHint";
import { studyLedgerRows, studyStatus } from "./hud/StudyLedger";
import { getResearchDiscipline } from "./hud/AcademyLivingGlyph";

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: {
      getBuiltinModule?: (id: string) => {
        readFileSync: (path: URL, encoding: string) => string;
      };
    };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

type State = ReturnType<typeof createGameState>;

const TIER_TWO = (Object.keys(RESEARCH) as (keyof typeof RESEARCH)[]).filter((id) => researchTier(id) === 2);

function realm(keep: number): State {
  const s = createGameState({ seed: 1 });
  s.buildings.push({ id: "ac", typeId: "academy", realmId: "player", x: 6, y: 6, level: 1, completesAtTick: null });
  const k = s.buildings.find((b) => b.typeId === "keep" && b.realmId === "player");
  if (k) {
    k.level = keep;
    k.completesAtTick = null;
  } else {
    s.buildings.push({ id: "keep_t", typeId: "keep", realmId: "player", x: 3, y: 3, level: keep, completesAtTick: null });
  }
  return s;
}

function card(html: string, id: string): string {
  const start = html.indexOf(`data-study="${id}"`);
  expect(start).toBeGreaterThan(-1);
  const next = html.indexOf("data-study=", start + 1);
  return html.slice(start, next === -1 ? undefined : next);
}

const act = () => undefined;

describe("research tree on the lectern", () => {
  it("has six deeper studies, each building on a first study", () => {
    expect(TIER_TWO).toHaveLength(6);
    for (const id of TIER_TWO) expect(researchTier(researchRequires(id) ?? "")).toBe(1);
  });

  it("shows two tiers with their own headings and known counts", () => {
    const s = realm(3);
    s.flags.research_husbandry = 1;
    const html = renderToStaticMarkup(<ResearchBar state={s} act={act} />);
    expect(html).toContain('data-research-tier="1"');
    expect(html).toContain('data-research-tier="2"');
    expect(html).toContain("First studies");
    expect(html).toContain("Deeper studies");
    expect(html).toContain("1 of 10 known");
    expect(html).toContain("0 of 6 known");
    expect(html.indexOf("First studies")).toBeLessThan(html.indexOf("Deeper studies"));
  });

  it("seals a deeper study and disables its Study button until the first study is known", () => {
    const s = realm(3);
    const sealed = card(renderToStaticMarkup(<ResearchBar state={s} act={act} />), "crop_rotation");
    expect(sealed).toContain("is-locked");
    expect(sealed).toContain("Builds on <strong>Husbandry</strong>");
    expect(sealed).toContain("study it first");
    expect(sealed).toMatch(/data-need="study" data-met="no"/);
    expect(sealed).toMatch(/<button[^>]*disabled/);

    s.flags.research_husbandry = 1;
    const open = card(renderToStaticMarkup(<ResearchBar state={s} act={act} />), "crop_rotation");
    expect(open).toContain("is-open");
    expect(open).toContain("· known");
    expect(open).not.toMatch(/<button[^>]*disabled/);
    expect(open).toContain("Study crop rotation");
  });

  it("keeps the Cancel control on a deeper study that is underway", () => {
    const s = realm(3);
    s.flags.research_drill = 1;
    s.flags.research_quartermastery_until = s.meta.tick + 100;
    s.flags.research_quartermastery_total = 240;
    const html = card(renderToStaticMarkup(<ResearchBar state={s} act={act} />), "quartermastery");
    expect(html).toContain("is-studying");
    expect(html).toContain(">Cancel</button>");
    expect(html).not.toContain("Study quartermastery");
  });

  it("first studies carry no Builds on line", () => {
    const html = card(renderToStaticMarkup(<ResearchBar state={realm(3)} act={act} />), "husbandry");
    expect(html).not.toContain("Builds on");
    expect(html).toContain('data-tier="1"');
  });

  it("the next-study hint never calls a deeper study ready before its first study", () => {
    const s = realm(3);
    for (const id of Object.keys(RESEARCH)) {
      if (researchTier(id) === 1 && id !== "husbandry") s.flags[`research_${id}`] = 1;
    }
    // Husbandry is the only first study left; crop rotation must wait behind it.
    expect(nextResearch(s)).toEqual({ id: "husbandry", ready: true });
    s.flags.research_husbandry = 1;
    expect(nextResearch(s)).toEqual({ id: "crop_rotation", ready: true });
  });

  it("studyStatus and the ledger rows read the prerequisite", () => {
    expect(studyStatus({ done: false, ticksLeft: 0, hallOk: true, keepOk: true })).toBe("open");
    expect(studyStatus({ done: false, ticksLeft: 0, hallOk: true, keepOk: true, prereqOk: false })).toBe("locked");
    const rows = studyLedgerRows({
      name: "Cartography",
      status: "locked",
      ticksLeft: 0,
      seconds: 24,
      effect: "x",
      halls: ["watchtower", "academy"],
      keepNeed: 3,
      hallOk: true,
      keepOk: false,
      prereq: "Surveying",
      prereqOk: false,
    });
    expect(rows[0].sub).toBe("needs Surveying · needs Keep III");
  });

  it("every deeper study has a real discipline emblem group", () => {
    expect(getResearchDiscipline("crop_rotation")).toBe("agronomy");
    expect(getResearchDiscipline("timber_framing")).toBe("agronomy");
    expect(getResearchDiscipline("fortification")).toBe("masonry");
    expect(getResearchDiscipline("supply_trains")).toBe("cartography");
    expect(getResearchDiscipline("cartography")).toBe("cartography");
    expect(getResearchDiscipline("quartermastery")).toBe("tactics");
  });

  it("styles live in research-tree.css, scoped to the tree classes", () => {
    const css = readCssFile("./research-tree.css");
    expect(css).toContain(".sc-research-tree-tier");
    expect(css).toContain(".sc-research-tree-link");
    for (const sel of css.match(/^[^@{}\n][^{}\n]*\{/gm) ?? []) expect(sel).toContain(".sc-research-tree-");
  });
});
