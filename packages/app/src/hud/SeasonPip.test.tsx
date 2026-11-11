import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import {
  SeasonPip,
  SeasonalCrestPip,
  SeasonWeatherPip,
  SeasonStatusLine,
  normalizeSeason,
  SEASONS,
  SEASON_COLORS,
  SEASON_WEATHER,
} from "./SeasonPip";
import { CrownTab } from "../tabs/CrownTab";
import { ProvinceInspect } from "../ProvinceInspect";

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const noop = () => undefined;

describe("SeasonPip pure helpers", () => {
  it("normalizeSeason handles case and aliases", () => {
    expect(normalizeSeason("Spring")).toBe("Spring");
    expect(normalizeSeason("spring")).toBe("Spring");
    expect(normalizeSeason(null)).toBe("Spring");
    expect(normalizeSeason(undefined)).toBe("Spring");

    expect(normalizeSeason("Summer")).toBe("Summer");
    expect(normalizeSeason("summer")).toBe("Summer");

    expect(normalizeSeason("Autumn")).toBe("Autumn");
    expect(normalizeSeason("autumn")).toBe("Autumn");
    expect(normalizeSeason("fall")).toBe("Autumn");

    expect(normalizeSeason("Winter")).toBe("Winter");
    expect(normalizeSeason("winter")).toBe("Winter");
  });

  it("exposes themes and weather descriptors for all 4 seasons", () => {
    for (const season of SEASONS) {
      expect(SEASON_COLORS[season]).toBeDefined();
      expect(SEASON_WEATHER[season]).toBeDefined();
    }
  });

  it("SeasonalCrestPip and SeasonWeatherPip are aliases for SeasonPip", () => {
    expect(SeasonalCrestPip).toBe(SeasonPip);
    expect(SeasonWeatherPip).toBe(SeasonPip);
  });
});

describe("SeasonPip rendering", () => {
  it("renders with default 20px size, aria-hidden, and pointer-events: none", () => {
    const html = renderToStaticMarkup(<SeasonPip season="Spring" />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('pointer-events:none');
    expect(html).toContain('width:20px');
    expect(html).toContain('height:20px');
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('data-season-pip="true"');
    expect(html).toContain('data-season="spring"');
    expect(html).toContain("sc-season-glow-layer");
    expect(html).toContain("sc-season-art-base");
    expect(html).toContain("sc-season-pulse-layer");
  });

  it("renders distinct heraldic geometry for each season", () => {
    const spring = renderToStaticMarkup(<SeasonPip season="Spring" />);
    expect(spring).toContain("season-spring");
    expect(spring).toContain("Dew &amp; Sprout");

    const summer = renderToStaticMarkup(<SeasonPip season="Summer" />);
    expect(summer).toContain("season-summer");
    expect(summer).toContain("High Sun");

    const autumn = renderToStaticMarkup(<SeasonPip season="Autumn" />);
    expect(autumn).toContain("season-autumn");
    expect(autumn).toContain("Harvest Gale");

    const winter = renderToStaticMarkup(<SeasonPip season="Winter" />);
    expect(winter).toContain("season-winter");
    expect(winter).toContain("Frost &amp; Flurry");

    // All 4 seasons produce distinct markup
    const markups = new Set([spring, summer, autumn, winter]);
    expect(markups.size).toBe(4);
  });

  it("renders active readiness ring when claimed is false", () => {
    const html = renderToStaticMarkup(<SeasonPip season="Spring" claimed={false} />);
    expect(html).toContain("is-ready");
    expect(html).toContain('data-claimed="false"');
    expect(html).toContain("sc-season-ready-ring");
  });

  it("renders calm claimed state when claimed is true", () => {
    const html = renderToStaticMarkup(<SeasonPip season="Summer" claimed={true} />);
    expect(html).toContain("is-claimed");
    expect(html).toContain('data-claimed="true"');
    expect(html).not.toContain("sc-season-ready-ring");
  });

  it("scales with custom size prop", () => {
    const html = renderToStaticMarkup(<SeasonPip season="Winter" size={28} />);
    expect(html).toContain('width:28px');
    expect(html).toContain('height:28px');
  });
});

describe("SeasonStatusLine", () => {
  it("renders SeasonPip alongside status description", () => {
    const html = renderToStaticMarkup(
      <SeasonStatusLine season="Autumn" boon={{ season: "Autumn", res: "gold", amount: 20 }} claimed={false} />,
    );

    expect(html).toContain('data-season-status-line="true"');
    expect(html).toContain('data-season="autumn"');
    expect(html).toContain("is-ready");
    expect(html).toContain("sc-season-pip-wrapper");
    expect(html).toContain("Autumn: +20 gold once this season.");
  });

  it("supports custom children in SeasonStatusLine", () => {
    const html = renderToStaticMarkup(
      <SeasonStatusLine season="Spring">
        <em>Verdant Springtide awakens.</em>
      </SeasonStatusLine>,
    );

    expect(html).toContain("sc-season-pip-wrapper");
    expect(html).toContain("Verdant Springtide awakens.");
  });
});

describe("Integration in CrownTab and ProvinceInspect", () => {
  it("CrownTab Season Court card embeds living SeasonPip and SeasonStatusLine", () => {
    const s = createGameState({ seed: 1 });
    const html = renderToStaticMarkup(
      <CrownTab
        state={s}
        act={noop}
        lastEvent=""
        lastEventTick={0}
        eventLog={[]}
        ascendReady={false}
        ascendNeed={1000}
        saveNow={noop}
        exportSave={noop}
        importSaveFile={async () => {}}
        newGame={noop}
      />,
    );

    expect(html).toContain("sc-season-court-card");
    expect(html).toContain("sc-season-status-line");
    expect(html).toContain("sc-season-pip-wrapper");
    expect(html).toContain("once this season.");
  });

  it("ProvinceInspect displays living SeasonPip on the inspect season line", () => {
    const s = createGameState({ seed: 1 });
    const homeId = s.board.homeProvinceId;
    const html = renderToStaticMarkup(
      <ProvinceInspect
        state={s}
        selectedId={homeId}
        onClear={noop}
        act={noop}
      />,
    );

    expect(html).toContain("sc-inspect-season");
    expect(html).toContain("sc-season-pip-wrapper");
  });
});

describe("CSS safety and motion accessibility", () => {
  it("season-pip.css enforces pointer-events: none and respects reduced motion", () => {
    const css = readCssFile("./season-pip.css");
    expect(css).toContain("pointer-events: none !important");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toContain("sc-season-glow-pulse");
    expect(css).toContain("sc-season-ready-ring");
    expect(css).toContain("sc-season-mote-float");
    expect(css).toContain("sc-season-glint-flare");

    // Must not touch theme.css
    const themeCss = readCssFile("../theme.css");
    expect(themeCss).not.toContain("sc-season-pip");
    expect(themeCss).not.toContain("sc-season-status-line");
  });
});
