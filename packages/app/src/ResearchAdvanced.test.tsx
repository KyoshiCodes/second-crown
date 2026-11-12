import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, RESEARCH, researchRequires, tryStartResearch } from "@second-crown/sim";
import { ResearchBar } from "./ResearchBar";
import {
  StudyLeadsLine,
  StudyNeedsRow,
  TierMeter,
  keepNumeral,
  studyLeadsTo,
  studyNeeds,
  studyProgressText,
} from "./ResearchAdvanced";

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

function realm(keep: number, academy = true): State {
  const s = createGameState({ seed: 1 });
  if (academy) {
    s.buildings.push({ id: "ac", typeId: "academy", realmId: "player", x: 6, y: 6, level: 1, completesAtTick: null });
  }
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

describe("studyNeeds", () => {
  it("lists Keep, first study, then hall, each with its own state", () => {
    expect(
      studyNeeds({
        prereq: "Surveying",
        prereqOk: false,
        halls: ["Watchtower", "Academy"],
        keepNeed: 3,
        keepNow: 1,
      }),
    ).toEqual([
      { kind: "keep", label: "Keep III", met: false, detail: "yours is Keep I" },
      { kind: "study", label: "Surveying", met: false, detail: "study it first" },
      { kind: "hall", label: "Watchtower or Academy", met: false, detail: "build one" },
    ]);
  });

  it("names the hall the player already has and skips gates that do not apply", () => {
    expect(
      studyNeeds({ prereqOk: true, halls: ["Farm", "Granary", "Academy"], hallBuilt: "Academy", keepNeed: 0, keepNow: 1 }),
    ).toEqual([{ kind: "hall", label: "Academy", met: true, detail: "built" }]);
  });

  it("uses the same numerals as the rest of the lectern", () => {
    expect([1, 2, 3].map(keepNumeral)).toEqual(["I", "II", "III"]);
    expect(studyNeeds({ prereqOk: true, halls: [], keepNeed: 2, keepNow: 0 })[0].detail).toBe("no Keep yet");
  });
});

describe("studyLeadsTo", () => {
  it("is the reverse of the sim's researchRequires", () => {
    expect(studyLeadsTo("husbandry")).toEqual(["crop_rotation"]);
    expect(studyLeadsTo("drill")).toEqual(["quartermastery"]);
    expect(studyLeadsTo("siege")).toEqual([]);
    for (const id of Object.keys(RESEARCH)) {
      for (const next of studyLeadsTo(id)) expect(researchRequires(next)).toBe(id);
    }
  });
});

describe("studyProgressText", () => {
  it("gives percent, time left, and total while studying", () => {
    expect(
      studyProgressText({ status: "studying", ticksLeft: 100, ticksTotal: 240, ticksBase: 300, ticksPerSecond: 10 }),
    ).toEqual({ value: "58% · 10s left", sub: "of 24s" });
  });

  it("never reads 100% while time remains", () => {
    const t = studyProgressText({ status: "studying", ticksLeft: 1, ticksTotal: 240, ticksBase: 300, ticksPerSecond: 10 });
    expect(t?.value).toBe("99% · 1s left");
  });

  it("says what the Academy saves before a study starts", () => {
    expect(
      studyProgressText({ status: "open", ticksLeft: 0, ticksTotal: 144, ticksBase: 180, ticksPerSecond: 10 }),
    ).toEqual({ value: "Not started", sub: "14s to study · Academy saves 4s" });
    expect(
      studyProgressText({ status: "locked", ticksLeft: 0, ticksTotal: 180, ticksBase: 180, ticksPerSecond: 10 }),
    ).toEqual({ value: "Not started", sub: "18s to study" });
  });

  it("leaves a known study alone", () => {
    expect(studyProgressText({ status: "known", ticksLeft: 0, ticksTotal: 144, ticksBase: 180, ticksPerSecond: 10 })).toBeNull();
  });
});

describe("small pieces", () => {
  it("StudyNeedsRow marks each gate met or unmet", () => {
    const html = renderToStaticMarkup(
      <StudyNeedsRow
        needs={[
          { kind: "keep", label: "Keep II", met: true, detail: "reached" },
          { kind: "study", label: "Drill", met: false, detail: "study it first" },
        ]}
      />,
    );
    expect(html).toContain('data-study-needs="unmet"');
    expect(html).toMatch(/data-need="keep" data-met="yes"/);
    expect(html).toMatch(/data-need="study" data-met="no"/);
    expect(renderToStaticMarkup(<StudyNeedsRow needs={[]} />)).toBe("");
  });

  it("StudyLeadsLine and TierMeter render plain values", () => {
    expect(renderToStaticMarkup(<StudyLeadsLine leads={[{ name: "Crop rotation", known: true }]} />)).toContain(
      "<strong>Crop rotation</strong> (known)",
    );
    expect(renderToStaticMarkup(<StudyLeadsLine leads={[]} />)).toBe("");
    const meter = renderToStaticMarkup(<TierMeter known={3} total={10} />);
    expect(meter).toContain('aria-valuenow="3"');
    expect(meter).toContain("width:30%");
  });
});

describe("advanced research cards on the lectern", () => {
  it("a sealed deeper study lists every gate once, with what is missing", () => {
    const s = realm(1);
    const c = card(renderToStaticMarkup(<ResearchBar state={s} act={act} />), "cartography");
    expect(c).toContain('data-study-needs="unmet"');
    expect(c).toMatch(/data-need="keep" data-met="no"[^]*<strong>Keep III<\/strong>[^]*yours is Keep I/);
    expect(c).toMatch(/data-need="study" data-met="no"[^]*<strong>Surveying<\/strong>/);
    expect(c).toMatch(/data-need="hall" data-met="yes"[^]*<strong>Academy<\/strong>/);
    // The old "needs ..." words under the name are replaced by the checklist.
    expect(c).not.toContain("needs Surveying");
    expect(c).toMatch(/<button[^>]*disabled/);
  });

  it("with no hall, the checklist names the buildings by their real names", () => {
    const s = realm(1, false);
    const c = card(renderToStaticMarkup(<ResearchBar state={s} act={act} />), "forestry");
    expect(c).toMatch(/data-need="hall" data-met="no"/);
    expect(c).toContain("<strong>Lumber Camp or Sawmill or Academy</strong>");
    expect(c).toContain("18s to study");
    expect(c).not.toContain("Academy saves");
  });

  it("the checklist agrees with the sim on when a study may start", () => {
    const s = realm(3);
    s.flags.research_surveying = 1;
    s.resources.gold = "500";
    s.resources.wood = "500";
    const c = card(renderToStaticMarkup(<ResearchBar state={s} act={act} />), "cartography");
    expect(c).toContain('data-study-needs="met"');
    expect(c).not.toMatch(/<button[^>]*disabled/);
    expect(tryStartResearch(s, "cartography")).toBe(true);
  });

  it("short cost chips say how much the stores hold", () => {
    const s = realm(1);
    s.resources.food = "7.9";
    s.resources.wood = "50";
    const c = card(renderToStaticMarkup(<ResearchBar state={s} act={act} />), "husbandry");
    expect(c).toMatch(/is-short" data-res="food">20 food<span class="sc-research-adv-have">have 7<\/span>/);
    expect(c).toMatch(/data-res="wood">12 wood<\/span>/);
    expect(c).toContain("Short 13 food.");
  });

  it("an active study shows percent and total, and drops the checklist", () => {
    const s = realm(3);
    s.flags.research_drill = 1;
    s.flags.research_quartermastery_until = s.meta.tick + 100;
    s.flags.research_quartermastery_total = 240;
    const c = card(renderToStaticMarkup(<ResearchBar state={s} act={act} />), "quartermastery");
    expect(c).toContain("58% · 10s left");
    expect(c).toContain("of 24s");
    expect(c).not.toContain("data-study-needs");
    expect(c).toContain(">Cancel</button>");
  });

  it("first studies point at the deeper study they lead to", () => {
    const s = realm(3);
    s.flags.research_husbandry = 1;
    const html = renderToStaticMarkup(<ResearchBar state={s} act={act} />);
    expect(card(html, "husbandry")).toContain("Leads to <strong>Crop rotation</strong>");
    expect(card(html, "siege")).not.toContain("Leads to");
    expect(card(html, "crop_rotation")).not.toContain("Leads to");
  });

  it("each tier heading carries a known meter", () => {
    const s = realm(3);
    s.flags.research_husbandry = 1;
    const html = renderToStaticMarkup(<ResearchBar state={s} act={act} />);
    expect((html.match(/sc-research-adv-tiermeter"/g) ?? []).length).toBe(2);
    expect(html).toContain("width:10%");
  });

  it("rendering changes nothing in the save", () => {
    const s = realm(2);
    const before = JSON.stringify(s);
    renderToStaticMarkup(<ResearchBar state={s} act={act} />);
    expect(JSON.stringify(s)).toBe(before);
  });

  it("styles live in research-advanced.css, scoped to the advanced classes", () => {
    const css = readCssFile("./research-advanced.css");
    for (const sel of css.match(/^[^@{}\n][^{}\n]*\{/gm) ?? []) expect(sel).toContain(".sc-research-adv-");
  });
});
