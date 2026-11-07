import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UnitLivingGlyph, UnitLivingUnderlay, getUnitFamily } from "./UnitLivingGlyph";
import { UnitCard } from "./UnitCard";
import { unitStatusRows } from "./UnitStatus";

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

describe("getUnitFamily", () => {
  it("classifies units into infantry, ranged, cavalry, and command", () => {
    expect(getUnitFamily("militia")).toBe("infantry");
    expect(getUnitFamily("spearman")).toBe("infantry");
    expect(getUnitFamily("warden")).toBe("infantry");

    expect(getUnitFamily("archer")).toBe("ranged");
    expect(getUnitFamily("ranger")).toBe("ranged");
    expect(getUnitFamily("skirmisher")).toBe("ranged");

    expect(getUnitFamily("scout")).toBe("cavalry");
    expect(getUnitFamily("knight")).toBe("cavalry");
    expect(getUnitFamily("lancer")).toBe("cavalry");
    expect(getUnitFamily("outrider")).toBe("cavalry");

    expect(getUnitFamily("banner")).toBe("command");
    expect(getUnitFamily("champion")).toBe("command");
  });
});

describe("UnitLivingUnderlay", () => {
  it("renders underlay for all families with aria-hidden and phrasing content only", () => {
    for (const typeId of ["spearman", "archer", "lancer", "banner"]) {
      const html = renderToStaticMarkup(
        <UnitLivingUnderlay typeId={typeId} open={true} affordable={true} />,
      );
      expect(html).toContain("sc-unit-living-underlay");
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain("<svg");
      expect(html).not.toMatch(/<(div|dl|dt|dd|p)\b/);
    }
  });

  it("applies correct state classes for locked, drilling, ready, and short", () => {
    const locked = renderToStaticMarkup(
      <UnitLivingUnderlay typeId="militia" open={false} affordable={false} />,
    );
    expect(locked).toContain("is-locked");

    const drilling = renderToStaticMarkup(
      <UnitLivingUnderlay typeId="militia" open={true} affordable={true} drilling={true} />,
    );
    expect(drilling).toContain("is-drilling");

    const ready = renderToStaticMarkup(
      <UnitLivingUnderlay typeId="militia" open={true} affordable={true} drilling={false} />,
    );
    expect(ready).toContain("is-ready");

    const short = renderToStaticMarkup(
      <UnitLivingUnderlay typeId="militia" open={true} affordable={false} drilling={false} />,
    );
    expect(short).toContain("is-short");
  });
});

describe("UnitLivingGlyph", () => {
  it("renders living unit glyph with heraldic flairs", () => {
    const locked = renderToStaticMarkup(
      <UnitLivingGlyph typeId="archer" open={false} affordable={false} />,
    );
    expect(locked).toContain("Sealed lore");
    expect(locked).toContain("is-locked");
    expect(locked).not.toMatch(/<(div|dl|dt|dd|p)\b/);

    const drilling = renderToStaticMarkup(
      <UnitLivingGlyph typeId="lancer" open={true} affordable={true} drilling={true} />,
    );
    expect(drilling).toContain("Drilling cadre");
    expect(drilling).toContain("is-drilling");
    expect(drilling).toContain("sc-unit-glyph-sparkle");

    const ready = renderToStaticMarkup(
      <UnitLivingGlyph typeId="spearman" open={true} affordable={true} />,
    );
    expect(ready).toContain("Levy ready");
    expect(ready).toContain("is-ready");

    const short = renderToStaticMarkup(
      <UnitLivingGlyph typeId="banner" open={true} affordable={false} />,
    );
    expect(short).toContain("Stores short");
    expect(short).toContain("is-short");
  });
});

describe("UnitCard integration with living unit glyphs", () => {
  const baseStatus = unitStatusRows({
    power: 2,
    powerMax: 10,
    home: 5,
    away: 0,
    costText: "10 food",
    ticks: 40,
    qty: 1,
    open: true,
    lock: "",
    affordable: true,
    queueFull: false,
    drilling: 0,
  });

  it("renders both underlay and living glyph when status rows are present", () => {
    const html = renderToStaticMarkup(
      <UnitCard
        typeId="spearman"
        name="Spearman"
        power={2}
        cost={{ food: 10 }}
        ticks={40}
        open={true}
        lock=""
        affordable={true}
        onTrain={() => {}}
        status={baseStatus}
      />,
    );
    expect(html).toContain("sc-unit-living-underlay");
    expect(html).toContain("sc-unit-status-glyph");
    expect(html).toContain("Levy ready");
    // Crucial: inside <button>, no block tags allowed
    expect(html).not.toMatch(/<(div|dl|dt|dd|p)\b/);
  });

  it("renders underlay but omits status glyph when no status rows are present", () => {
    const html = renderToStaticMarkup(
      <UnitCard
        typeId="spearman"
        name="Spearman"
        power={2}
        cost={{ food: 10 }}
        ticks={40}
        open={true}
        lock=""
        affordable={true}
        onTrain={() => {}}
      />,
    );
    expect(html).toContain("sc-unit-living-underlay");
    expect(html).not.toContain("sc-unit-status-glyph");
    expect(html).not.toMatch(/<(div|dl|dt|dd|p)\b/);
  });
});

describe("unit-living.css isolation & accessibility", () => {
  it("theme.css is untouched and does not contain unit-living classes", () => {
    const themeCss = readCssFile("../theme.css");
    expect(themeCss).not.toContain("sc-unit-living");
    expect(themeCss).not.toContain("sc-unit-status-glyph");
    expect(themeCss).not.toContain("sc-unit-idle-breath");
  });

  it("unit-living.css includes reduced-motion guard and pointer-events: none", () => {
    const css = readCssFile("./unit-living.css");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("pointer-events: none !important");
    expect(css).toContain("@keyframes sc-unit-idle-breath");
    expect(css).toContain("@keyframes sc-unit-drilling-pulse");
  });

  it("caps the underlay glyph opacity on the wrapper so text stays readable", () => {
    const css = readCssFile("./unit-living.css");
    const rule = (sel: string): string => {
      const start = css.indexOf(`\n${sel} {`);
      if (start < 0) throw new Error(`missing rule ${sel}`);
      const open = css.indexOf("{", start);
      return css.slice(open + 1, css.indexOf("}", open));
    };
    const opacityOf = (sel: string): number => {
      const m = rule(sel).match(/opacity:\s*([\d.]+)/);
      if (!m) throw new Error(`no opacity on ${sel}`);
      return Number(m[1]);
    };
    for (const sel of [
      ".sc-unit-living-underlay",
      ".sc-unit-living-underlay.is-drilling",
      ".sc-unit-living-underlay.is-locked",
    ]) {
      const o = opacityOf(sel);
      expect(o).toBeGreaterThan(0);
      expect(o).toBeLessThanOrEqual(0.35);
    }
    // The svg itself must not carry opacity: its keyframes animate opacity up to 1.
    expect(rule(".sc-unit-living-underlay svg")).not.toMatch(/opacity/);
  });
});
