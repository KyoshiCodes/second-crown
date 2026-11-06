import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { armyMouths, createGameState, upkeepPerTick } from "@second-crown/sim";
import { UpkeepPace, UpkeepPaceGlyphPip, nextUpkeepChange } from "./UpkeepPace";

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
  delete s.flags.training_json;
  delete s.flags.heal_json;
  return s;
}

function job(doneTick: number, count: number, typeId = "militia") {
  return { id: `j${doneTick}`, realmId: "player", typeId, count, startedTick: 0, doneTick, paid: {} };
}

describe("UpkeepPace", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<UpkeepPace state={undefined} />)).toBe("");
  });

  it("shows the sim rate and no change when nothing is queued", () => {
    const s = bare();
    expect(nextUpkeepChange(s)).toBeNull();
    const html = renderToStaticMarkup(<UpkeepPace state={s} />);
    expect(html).toContain(`${upkeepPerTick(s).toFixed(2)} food/tick`);
    expect(html).toContain(`${armyMouths(s)} mouths`);
    expect(html).toContain("no change queued");
    expect(html).toContain('data-upkeep="steady"');
    expect(html).toContain("sc-upkeep-pace-glyph");
  });

  it("names the earliest training job as the next change", () => {
    const s = bare();
    const t = s.meta.tick;
    s.flags.training_json = JSON.stringify([job(t + 200, 5, "archer"), job(t + 120, 10)]);
    expect(nextUpkeepChange(s)).toEqual({ ticks: 120, mouths: 10, typeId: "militia", source: "training" });
    const html = renderToStaticMarkup(<UpkeepPace state={s} />);
    expect(html).toContain("next change in <strong>12s</strong>: +10 militia from the barracks");
    expect(html).toContain('data-upkeep="rising"');
    expect(html).toContain('class="sc-upkeep-pace-aura"');
  });

  it("picks a healed wounded when it lands first", () => {
    const s = bare();
    const t = s.meta.tick;
    s.flags.training_json = JSON.stringify([job(t + 300, 10)]);
    s.flags.heal_json = JSON.stringify([{ doneTick: t + 50 }]);
    expect(nextUpkeepChange(s)).toEqual({ ticks: 50, mouths: 1, typeId: "militia", source: "healing" });
    const html = renderToStaticMarkup(<UpkeepPace state={s} />);
    expect(html).toContain("+1 militia from the infirmary");
    expect(html).toContain("is-source-healing");
  });

  it("ignores other realms' training", () => {
    const s = bare();
    s.flags.training_json = JSON.stringify([{ ...job(s.meta.tick + 10, 4), realmId: "rival" }]);
    expect(nextUpkeepChange(s)).toBeNull();
  });
});

describe("UpkeepPaceGlyphPip Living Treatment", () => {
  it("renders steady rate glyph with quiet granary sickle and slate grain ear with no aura", () => {
    const html = renderToStaticMarkup(<UpkeepPaceGlyphPip rising={false} />);
    expect(html).toContain("sc-upkeep-pace-glyph-wrap");
    expect(html).toContain("is-steady");
    expect(html).toContain('data-upkeep="steady"');
    expect(html).toContain('style="width:16px;height:16px;pointer-events:none"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("sc-upkeep-pace-aura");
    expect(html).not.toContain("sc-upkeep-pace-star");
  });

  it("renders rising upkeep glyph with amber aura, golden harvest sheaf, and apex star", () => {
    const html = renderToStaticMarkup(
      <UpkeepPaceGlyphPip rising={true} source="training" mouths={10} />
    );
    expect(html).toContain("is-rising");
    expect(html).toContain("is-source-training");
    expect(html).toContain('data-upkeep="rising"');
    expect(html).toContain('data-source="training"');
    expect(html).toContain('data-mouths="10"');
    expect(html).toContain('class="sc-upkeep-pace-aura"');
    expect(html).toContain("sc-upkeep-pace-star");
  });

  it("differentiates healing source on the ribbon tie", () => {
    const html = renderToStaticMarkup(
      <UpkeepPaceGlyphPip rising={true} source="healing" mouths={1} />
    );
    expect(html).toContain("is-source-healing");
    expect(html).toContain('data-source="healing"');
    expect(html).toContain('fill="#34d399"');
  });
});

describe("Upkeep pace styles and CSS isolation", () => {
  it("enforces pointer-events: none !important and provides living keyframes", () => {
    const css = readCssFile("./upkeep-pace.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-upkeep-pace-float");
    expect(css).toContain("@keyframes sc-upkeep-pace-breathe");
    expect(css).toContain("@keyframes sc-upkeep-pace-twinkle");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("does not leak into theme.css", () => {
    const theme = readCssFile("./theme.css");
    expect(theme).not.toContain("sc-upkeep-pace");
  });
});
