import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, RESEARCH } from "@second-crown/sim";
import {
  AcademyPace,
  AcademyPaceGlyphPip,
  academyRateOn,
  nextAcademyUnlock,
} from "./AcademyPace";

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

function bare() {
  const s = createGameState({ seed: 1 });
  s.buildings = [];
  for (const k of Object.keys(s.flags)) if (k.startsWith("research_")) delete s.flags[k];
  return s;
}

function withAcademy() {
  const s = bare();
  s.buildings = [{ typeId: "academy", completesAtTick: null } as (typeof s.buildings)[number]];
  return s;
}

describe("AcademyPace", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<AcademyPace state={undefined} />)).toBe("");
  });

  it("shows base rate and the first academy study at base length without an Academy", () => {
    const s = bare();
    expect(academyRateOn(s)).toBe(false);
    expect(nextAcademyUnlock(s)?.id).toBe("husbandry");
    const html = renderToStaticMarkup(<AcademyPace state={s} />);
    expect(html).toContain("no Academy, base rate");
    expect(html).toContain("Husbandry");
    expect(html).toContain(`(${Math.ceil(RESEARCH.husbandry.ticks / 10)}s)`);
    expect(html).toContain('data-academy="off"');
    expect(html).toContain("sc-academy-pace-glyph");
  });

  it("shows the Academy rate from the sim when an Academy is finished", () => {
    const s = withAcademy();
    expect(academyRateOn(s)).toBe(true);
    const html = renderToStaticMarkup(<AcademyPace state={s} />);
    expect(html).toContain("new studies 20% shorter");
    expect(html).toContain(`(${Math.ceil(Math.ceil(RESEARCH.husbandry.ticks * 0.8) / 10)}s)`);
    expect(html).toContain('data-academy="on"');
    expect(html).toContain('class="sc-academy-pace-aura"');
  });

  it("skips known studies and studies the Academy cannot open, and shows the keep gate", () => {
    const s = withAcademy();
    for (const id of ["husbandry", "forestry", "masonry"]) s.flags[`research_${id}`] = 1;
    const next = nextAcademyUnlock(s);
    expect(next?.id).toBe("logistics");
    expect(next?.keepReady).toBe(false);
    const html = renderToStaticMarkup(<AcademyPace state={s} />);
    expect(html).toContain("Logistics");
    expect(html).toContain("needs Keep II");
    expect(html).toContain('data-keep-ready="false"');
  });

  it("says every academy study is known when only non-academy studies remain", () => {
    const s = withAcademy();
    for (const id of Object.keys(RESEARCH)) if (id !== "siege") s.flags[`research_${id}`] = 1;
    expect(nextAcademyUnlock(s)).toBeNull();
    const html = renderToStaticMarkup(<AcademyPace state={s} />);
    expect(html).toContain("every academy study known");
    expect(html).toContain('data-all-known="true"');
  });
});

describe("AcademyPaceGlyphPip Living Treatment", () => {
  it("renders base rate glyph with quiet slate foundation and no aura", () => {
    const html = renderToStaticMarkup(<AcademyPaceGlyphPip on={false} />);
    expect(html).toContain("sc-academy-pace-glyph-wrap");
    expect(html).toContain("is-off");
    expect(html).toContain('data-academy="off"');
    expect(html).toContain('style="width:16px;height:16px;pointer-events:none"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("sc-academy-pace-aura");
    expect(html).not.toContain("sc-academy-pace-star");
  });

  it("renders active Academy pace glyph with radiant aura, colonnade, and apex beacon star", () => {
    const html = renderToStaticMarkup(
      <AcademyPaceGlyphPip on={true} nextId="husbandry" keepReady={true} />
    );
    expect(html).toContain("is-on");
    expect(html).toContain('data-academy="on"');
    expect(html).toContain('data-next-id="husbandry"');
    expect(html).toContain('class="sc-academy-pace-aura"');
    expect(html).toContain("sc-academy-pace-star");
  });

  it("renders master academy laurel wreath when all academy studies are known", () => {
    const html = renderToStaticMarkup(<AcademyPaceGlyphPip allKnown={true} />);
    expect(html).toContain("is-all-known");
    expect(html).toContain('data-all-known="true"');
    expect(html).toContain("sc-academy-pace-star");
  });
});

describe("Academy pace styles and CSS isolation", () => {
  it("enforces pointer-events: none !important and provides living keyframes", () => {
    const css = readCssFile("./academy-pace.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-academy-pace-float");
    expect(css).toContain("@keyframes sc-academy-pace-breathe");
    expect(css).toContain("@keyframes sc-academy-pace-twinkle");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("does not leak into theme.css", () => {
    const theme = readCssFile("./theme.css");
    expect(theme).not.toContain("sc-academy-pace");
  });
});
