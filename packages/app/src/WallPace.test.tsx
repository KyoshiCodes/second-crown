import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, wallHp } from "@second-crown/sim";
import { WallPace, WallPaceGlyphPip, nextWallChange } from "./WallPace";

type B = ReturnType<typeof createGameState>["buildings"][number];

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
  return s;
}

function site(id: string, typeId: string, completesAtTick: number | null, realmId = "player"): B {
  return { id, typeId, realmId, x: 0, y: 0, level: 1, completesAtTick } as B;
}

describe("WallPace", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<WallPace state={undefined} />)).toBe("");
  });

  it("shows the sim wall HP and no change when nothing is queued", () => {
    const s = bare();
    s.buildings = [site("w", "walls", null)];
    expect(nextWallChange(s)).toBeNull();
    const html = renderToStaticMarkup(<WallPace state={s} />);
    expect(html).toContain(`wall HP ${wallHp(s, "player")}`);
    expect(html).toContain("no change queued");
    expect(html).toContain('data-wall="steady"');
    expect(html).toContain("sc-wall-pace-glyph");
  });

  it("names the earliest wall section under construction", () => {
    const s = bare();
    const t = s.meta.tick;
    s.buildings = [site("a", "walls", t + 300), site("b", "walls", t + 120), site("c", "farm", t + 10)];
    expect(nextWallChange(s)).toEqual({ ticks: 120, source: "walls" });
    const html = renderToStaticMarkup(<WallPace state={s} />);
    expect(html).toContain("next change in <strong>12s</strong>: a wall section finishes");
    expect(html).toContain('data-wall="walls"');
    expect(html).toContain('class="sc-wall-pace-aura"');
    expect(html).toContain("is-source-walls");
  });

  it("picks the gate when it lands first and ignores rival works", () => {
    const s = bare();
    const t = s.meta.tick;
    s.buildings = [site("a", "walls", t + 300), site("g", "gate", t + 50), site("r", "walls", t + 5, "rival")];
    expect(nextWallChange(s)).toEqual({ ticks: 50, source: "gate" });
    const html = renderToStaticMarkup(<WallPace state={s} />);
    expect(html).toContain("the gate finishes");
    expect(html).toContain("is-source-gate");
  });
});

describe("WallPaceGlyphPip Living Treatment", () => {
  it("renders steady rate glyph with quiet slate stone curtain wall and no aura", () => {
    const html = renderToStaticMarkup(<WallPaceGlyphPip rising={false} />);
    expect(html).toContain("sc-wall-pace-glyph-wrap");
    expect(html).toContain("is-steady");
    expect(html).toContain('data-wall="steady"');
    expect(html).toContain('style="width:16px;height:16px;pointer-events:none"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("sc-wall-pace-aura");
    expect(html).not.toContain("sc-wall-pace-star");
  });

  it("renders rising wall glyph with amber aura, fortified rampart, and apex star", () => {
    const html = renderToStaticMarkup(
      <WallPaceGlyphPip rising={true} source="walls" hp={100} />
    );
    expect(html).toContain("is-rising");
    expect(html).toContain("is-source-walls");
    expect(html).toContain('data-wall="walls"');
    expect(html).toContain('data-source="walls"');
    expect(html).toContain('data-hp="100"');
    expect(html).toContain('class="sc-wall-pace-aura"');
    expect(html).toContain("sc-wall-pace-star");
  });

  it("renders distinct gatehouse architecture when source is gate", () => {
    const html = renderToStaticMarkup(
      <WallPaceGlyphPip rising={true} source="gate" hp={50} />
    );
    expect(html).toContain("is-source-gate");
    expect(html).toContain('data-source="gate"');
  });
});

describe("Wall pace styles and CSS isolation", () => {
  it("enforces pointer-events: none !important and provides living keyframes", () => {
    const css = readCssFile("./wall-pace.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-wall-pace-float");
    expect(css).toContain("@keyframes sc-wall-pace-breathe");
    expect(css).toContain("@keyframes sc-wall-pace-twinkle");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("does not leak into theme.css", () => {
    const theme = readCssFile("./theme.css");
    expect(theme).not.toContain("sc-wall-pace");
  });
});
