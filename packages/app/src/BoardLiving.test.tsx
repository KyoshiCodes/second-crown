import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, isProvinceSeen, revealProvince } from "@second-crown/sim";
import {
  BoardLiving,
  BoardLight,
  boardGridToWorld,
  resolveBoardLightPhase,
  resolveBoardLight,
  BOARD_DAY_CYCLE_TICKS,
  TERRAIN_PULSE_COLORS,
} from "./BoardLiving";
import { OverworldAtlas } from "./OverworldAtlas";

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

function fresh() {
  return createGameState({ seed: 1 });
}

describe("boardGridToWorld", () => {
  it("converts grid coordinates to isometric canvas coordinates", () => {
    const origin = boardGridToWorld(0, 0);
    expect(origin.wx).toBe(236);
    expect(origin.wy).toBe(56);

    const stepX = boardGridToWorld(1, 0);
    expect(stepX.wx).toBe(236 + 22);
    expect(stepX.wy).toBe(56 + 11);

    const stepY = boardGridToWorld(0, 1);
    expect(stepY.wx).toBe(236 - 22);
    expect(stepY.wy).toBe(56 + 11);
  });
});

describe("BoardLiving component", () => {
  it("renders nothing when visible is false or state is undefined", () => {
    const s = fresh();
    expect(renderToStaticMarkup(<BoardLiving state={undefined} selectedId="prov-1" visible={true} />)).toBe("");
    expect(renderToStaticMarkup(<BoardLiving state={s} selectedId="prov-1" visible={false} />)).toBe("");
  });

  it("renders base container and svg when visible", () => {
    const s = fresh();
    const html = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible={true} />);
    expect(html).toContain('class="sc-board-living"');
    expect(html).toContain('viewBox="0 0 560 360"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('style="pointer-events:none"');
  });

  it("renders keep glow for player home hold", () => {
    const s = fresh();
    const html = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible={true} />);
    expect(html).toContain("sc-board-living-keeps");
    expect(html).toContain("sc-board-keep-group is-player");
    expect(html).toContain("sc-board-keep-hearth-glow");
    expect(html).toContain("sc-board-keep-light");
    expect(html).toContain("sc-board-keep-beacon-ray");
  });

  it("renders keep glow for seen rival holds", () => {
    const s = fresh();
    // Add a rival hold on a seen province
    const rivalProv = s.board.provinces.find((p) => p.id !== s.board.homeProvinceId)!;
    rivalProv.occupantRealmId = "rival";
    revealProvince(s, rivalProv.id);

    const html = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible={true} />);
    expect(html).toContain("sc-board-keep-group is-rival");
    expect(html).toContain("url(#sc-board-hearth-rival)");
  });

  it("renders terrain pulse when a province is selected", () => {
    const s = fresh();
    const homeId = s.board.homeProvinceId;
    const homeProv = s.board.provinces.find((p) => p.id === homeId)!;

    const html = renderToStaticMarkup(<BoardLiving state={s} selectedId={homeId} visible={true} />);
    expect(html).toContain("sc-board-living-terrain");
    expect(html).toContain(`data-terrain="${homeProv.terrain}"`);
    expect(html).toContain("sc-board-terrain-diamond");
    expect(html).toContain("sc-board-terrain-aura");
    expect(html).toContain("sc-board-terrain-ring");
  });

  it("applies distinct terrain colors for different terrain types", () => {
    const s = fresh();
    // Find provinces with different terrains
    const terrains = ["plain", "wood", "peak", "shore", "sand"] as const;
    for (const t of terrains) {
      const p = s.board.provinces.find((pr) => pr.terrain === t);
      if (p) {
        revealProvince(s, p.id);
        const html = renderToStaticMarkup(<BoardLiving state={s} selectedId={p.id} visible={true} />);
        const color = TERRAIN_PULSE_COLORS[t];
        expect(html).toContain(`data-terrain="${t}"`);
        expect(html).toContain(color.stroke);
      }
    }
  });

  it("renders soft fog drift clouds over unseen territories", () => {
    const s = fresh();
    const html = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible={true} />);
    expect(html).toContain("sc-board-living-fog");
    expect(html).toContain("sc-board-fog-cloud");
    expect(html).toContain("sc-board-fog-puff");
    expect(html).toContain("url(#sc-board-fog-grad)");
  });

  it("renders status overlay tether underlay when a province is selected", () => {
    const s = fresh();
    const homeId = s.board.homeProvinceId;
    const html = renderToStaticMarkup(<BoardLiving state={s} selectedId={homeId} visible={true} />);
    expect(html).toContain("sc-board-living-status-tether");
    expect(html).toContain("sc-board-status-tether");
  });

  it("renders living terrain glyphs on seen peaks, woods, and shores while gating unseen tiles", () => {
    const s = fresh();
    const candidates = s.board.provinces.filter(
      (p) => !isProvinceSeen(s, p.id) && p.node !== "hold"
    );
    const pPeak = candidates[0]!;
    const pWood = candidates[1]!;
    const pShore = candidates[2]!;
    const pUnseenPeak = candidates[candidates.length - 1]!;

    pPeak.terrain = "peak";
    pWood.terrain = "wood";
    pShore.terrain = "shore";
    pUnseenPeak.terrain = "peak";

    const beforeHtml = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible={true} />);
    expect(beforeHtml).not.toContain(`data-province-id="${pPeak.id}"`);
    expect(beforeHtml).not.toContain(`data-province-id="${pWood.id}"`);
    expect(beforeHtml).not.toContain(`data-province-id="${pShore.id}"`);
    expect(beforeHtml).not.toContain(`data-province-id="${pUnseenPeak.id}"`);

    revealProvince(s, pPeak.id);
    revealProvince(s, pWood.id);
    revealProvince(s, pShore.id);

    const html = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible={true} />);
    expect(html).toContain("sc-board-living-terrain-glyphs");
    expect(html).toContain("sc-board-glyph-peak");
    expect(html).toContain("sc-board-peak-ridge");
    expect(html).toContain("sc-board-peak-mist");
    expect(html).toContain("sc-board-peak-glint");
    expect(html).toContain("sc-board-glyph-wood");
    expect(html).toContain("sc-board-wood-bough");
    expect(html).toContain("sc-board-wood-mote");
    expect(html).toContain("sc-board-glyph-shore");
    expect(html).toContain("sc-board-shore-ripple");
    expect(html).toContain("sc-board-shore-glint");
    expect(html).not.toContain(`data-province-id="${pUnseenPeak.id}"`);
  });

  it("renders living structure glyphs on seen camps and stocked/depleted node piles", () => {
    const s = fresh();
    const candidates = s.board.provinces.filter(
      (p) => !isProvinceSeen(s, p.id) && p.node !== "hold"
    );
    // Pick spaced-apart provinces so a player outpost's +1 neighbor vision doesn't reveal pUnseenField
    const pHostileCamp = candidates[0]!;
    const pPlayerOutpost = candidates[1]!;
    const pWoodcut = candidates[2]!;
    const pDryQuarry = candidates[3]!;
    const pUnseenField = candidates[candidates.length - 1]!;

    pHostileCamp.node = "camp";
    pHostileCamp.occupantRealmId = null;

    pPlayerOutpost.node = "none";
    pPlayerOutpost.occupantRealmId = "player";

    pWoodcut.node = "woodcut";
    pDryQuarry.node = "quarry";
    s.flags[`node_stock_${pDryQuarry.id}`] = 0;

    pUnseenField.node = "field";

    revealProvince(s, pHostileCamp.id);
    revealProvince(s, pPlayerOutpost.id);
    revealProvince(s, pWoodcut.id);
    revealProvince(s, pDryQuarry.id);

    const beforeSnap = JSON.stringify(s);
    const html = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible={true} />);
    expect(JSON.stringify(s)).toBe(beforeSnap);

    expect(html).toContain("sc-board-living-structures");
    expect(html).toContain("sc-board-glyph-camp is-hostile");
    expect(html).toContain("sc-board-glyph-camp is-player");
    expect(html).toContain("sc-board-camp-ember");
    expect(html).toContain("sc-board-camp-smoke");
    expect(html).toContain("sc-board-glyph-node is-woodcut is-stocked");
    expect(html).toContain("sc-board-node-gleam");
    expect(html).toContain("sc-board-node-mote");
    expect(html).toContain("sc-board-glyph-node is-quarry is-dry");
    expect(html).toContain("sc-board-node-dry");
    expect(html).not.toContain(`data-province-id="${pUnseenField.id}"`);
  });
});

describe("OverworldAtlas living terrain and structure glyphs", () => {
  it("renders living glyphs on seen peaks, woods, shores, camps, and stocked node piles while preserving pan and fog", () => {
    const s = fresh();
    const candidates = s.board.provinces.filter(
      (p) => !isProvinceSeen(s, p.id) && p.node !== "hold"
    );
    const [pPeak, pWood, pShore, pCamp, pLogs] = candidates;
    const pUnseenShore = candidates[candidates.length - 1]!;
    // Ensure no other province is shore so only pShore (seen) and pUnseenShore (unseen) are shore
    for (const p of s.board.provinces) {
      if (p.terrain === "shore") p.terrain = "plain";
    }
    pPeak.terrain = "peak";
    pPeak.node = "none";
    pWood.terrain = "wood";
    pWood.node = "none";
    pShore.terrain = "shore";
    pShore.node = "none";
    pCamp.terrain = "hill";
    pCamp.node = "camp";
    pLogs.terrain = "wood";
    pLogs.node = "woodcut";
    pUnseenShore.terrain = "shore";
    pUnseenShore.node = "none";

    revealProvince(s, pPeak.id);
    revealProvince(s, pWood.id);
    revealProvince(s, pShore.id);
    revealProvince(s, pCamp.id);
    revealProvince(s, pLogs.id);

    const html = renderToStaticMarkup(<OverworldAtlas state={s} selectedId={null} />);
    expect(html).toContain('transform="translate(0 0)"');
    expect(html).toContain("sc-atlas-glyph-peak");
    expect(html).toContain("sc-atlas-glyph-wood");
    expect(html).toContain("sc-atlas-glyph-shore");
    expect(html).toContain("sc-atlas-camp-smoke");
    expect(html).toContain("sc-atlas-pile-glint");

    // Only one seen shore -> exactly one shore glyph group (unseen shore stays hidden under fog)
    const shoreMatches = html.match(/sc-atlas-glyph-shore/g);
    expect(shoreMatches?.length).toBe(1);
  });
});

describe("Board living styling and CSS isolation", () => {
  it("enforces pointer-events: none !important on all layers", () => {
    const css = readCssFile("./board-living.css");
    expect(css).toContain("pointer-events: none !important;");

    const atlasCss = readCssFile("./hud/atlas-terrain-glyphs.css");
    expect(atlasCss).toContain("pointer-events: none !important;");
  });

  it("provides keyframe animations for terrain pulse, terrain/structure glyphs, keep glow, and fog drift", () => {
    const css = readCssFile("./board-living.css");
    expect(css).toContain("@keyframes sc-board-terrain-pulse");
    expect(css).toContain("@keyframes sc-board-terrain-aura-breathe");
    expect(css).toContain("@keyframes sc-board-peak-shimmer");
    expect(css).toContain("@keyframes sc-board-peak-mist-drift");
    expect(css).toContain("@keyframes sc-board-wood-sway");
    expect(css).toContain("@keyframes sc-board-shore-tide");
    expect(css).toContain("@keyframes sc-board-node-pulse");
    expect(css).toContain("@keyframes sc-board-camp-ember-pulse");
    expect(css).toContain("@keyframes sc-board-camp-smoke-drift");
    expect(css).toContain("@keyframes sc-board-keep-breathe");
    expect(css).toContain("@keyframes sc-board-keep-flicker");
    expect(css).toContain("@keyframes sc-board-fog-drift");
    expect(css).toContain("@keyframes sc-board-fog-swell");
    expect(css).toContain("@keyframes sc-board-tether-flow");
  });

  it("keeps terrain and structure glyph opacities subtle so board labels and tokens stay readable", () => {
    const css = readCssFile("./board-living.css");
    const glyphKfNames = [
      "sc-board-peak-shimmer",
      "sc-board-peak-mist-drift",
      "sc-board-peak-glint-pulse",
      "sc-board-wood-sway",
      "sc-board-wood-spore-drift",
      "sc-board-shore-tide",
      "sc-board-shore-sparkle",
      "sc-board-node-pulse",
      "sc-board-node-mote-rise",
      "sc-board-camp-ember-pulse",
      "sc-board-camp-spark-flicker",
      "sc-board-camp-smoke-drift",
    ];
    for (const kf of glyphKfNames) {
      const match = css.match(new RegExp(`@keyframes\\s+${kf}\\s*\\{[\\s\\S]*?\\n\\}`));
      expect(match).not.toBeNull();
      const ops = [...(match![0].matchAll(/(?:stroke-)?opacity:\s*([0-9.]+)/g))].map((m) => Number(m[1]));
      expect(ops.length).toBeGreaterThan(0);
      for (const v of ops) {
        expect(v).toBeLessThanOrEqual(0.55);
      }
    }
  });

  it("provides prefers-reduced-motion accessibility overrides", () => {
    const css = readCssFile("./board-living.css");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important;");

    const atlasCss = readCssFile("./hud/atlas-terrain-glyphs.css");
    expect(atlasCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(atlasCss).toContain("animation: none !important;");
  });

  it("does not leak into theme.css", () => {
    const theme = readCssFile("./theme.css");
    expect(theme).not.toContain("sc-board-living");
    expect(theme).not.toContain("sc-board-terrain");
    expect(theme).not.toContain("sc-board-glyph");
    expect(theme).not.toContain("sc-board-keep");
    expect(theme).not.toContain("sc-board-fog");
    expect(theme).not.toContain("sc-atlas-terrain-glyph");
    expect(theme).not.toContain("sc-board-sky-horizon-glow");
    expect(theme).not.toContain("sc-board-celestial-beam");
    expect(theme).not.toContain("sc-board-tile-sun-rim");
    expect(theme).not.toContain("sc-board-bldg-ground-shadow");
    expect(theme).not.toContain("sc-board-keep-window-lantern");
  });
});

describe("BoardLight — richer lighting and atmosphere pass on the isometric board", () => {
  it("exports BoardLight alias pointing to BoardLiving", () => {
    expect(BoardLight).toBe(BoardLiving);
  });

  it("resolves time-of-day phases across tick cycle and explicit overrides", () => {
    const s = fresh();
    s.meta.tick = 100;
    expect(resolveBoardLightPhase(s)).toBe("dawn");
    s.meta.tick = 1000;
    expect(resolveBoardLightPhase(s)).toBe("day");
    s.meta.tick = 2200;
    expect(resolveBoardLightPhase(s)).toBe("dusk");
    s.meta.tick = 3000;
    expect(resolveBoardLightPhase(s)).toBe("night");

    // Explicit override
    (s as any).dayPhase = "dusk";
    expect(resolveBoardLightPhase(s)).toBe("dusk");
    (s as any).dayPhase = undefined;
  });

  it("resolves rich light descriptor with distinct palette and beam opacities per phase", () => {
    const s = fresh();
    s.meta.tick = 200;
    const dawnLight = resolveBoardLight(s);
    expect(dawnLight.phase).toBe("dawn");
    expect(dawnLight.isNight).toBe(false);
    expect(dawnLight.skyGradientId).toBe("sc-board-sky-dawn");
    expect(dawnLight.lanternOpacity).toBe(0.35);

    s.meta.tick = 3100;
    const nightLight = resolveBoardLight(s);
    expect(nightLight.phase).toBe("night");
    expect(nightLight.isNight).toBe(true);
    expect(nightLight.skyGradientId).toBe("sc-board-sky-night");
    expect(nightLight.lanternOpacity).toBe(0.85);
  });

  it("renders time-of-day sky horizon glow and celestial light beams", () => {
    const s = fresh();
    s.meta.tick = 1000;
    const dayHtml = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible={true} />);
    expect(dayHtml).toContain("sc-board-living-sky-light is-day");
    expect(dayHtml).toContain("sc-board-sky-horizon-glow");
    expect(dayHtml).toContain("url(#sc-board-sky-day)");
    expect(dayHtml).toContain("sc-board-celestial-beams");
    expect(dayHtml).toContain("sc-board-celestial-beam is-alt");
    expect(dayHtml).toContain("sc-board-celestial-beam is-soft");

    s.meta.tick = 3200;
    const nightHtml = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible={true} />);
    expect(nightHtml).toContain("sc-board-living-sky-light is-night");
    expect(nightHtml).toContain("url(#sc-board-sky-night)");
  });

  it("renders subtle isometric terrain facet shading on seen tiles", () => {
    const s = fresh();
    const html = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible={true} />);
    expect(html).toContain("sc-board-living-terrain-shading");
    expect(html).toContain("sc-board-tile-sun-rim");
    expect(html).toContain("sc-board-tile-bevel-shadow");
    expect(html).toContain(`data-province-id="${s.board.homeProvinceId}"`);
  });

  it("renders building foundation ground shadows and window lanterns on holds and structures", () => {
    const s = fresh();
    s.meta.tick = 3000; // Night: lanterns shine brightly
    const html = renderToStaticMarkup(<BoardLiving state={s} selectedId={null} visible={true} />);
    expect(html).toContain("sc-board-living-structure-light");
    expect(html).toContain("sc-board-bldg-ground-shadow");
    expect(html).toContain("url(#sc-board-bldg-shadow-grad)");
    expect(html).toContain("sc-board-keep-window-lantern");
    expect(html).toContain('opacity="0.85"');
  });

  it("includes keyframe animations and reduced-motion rules for the lighting pass in board-living.css", () => {
    const css = readCssFile("./board-living.css");
    expect(css).toContain("@keyframes sc-board-sky-breathe");
    expect(css).toContain("@keyframes sc-board-beam-shimmer");
    expect(css).toContain("@keyframes sc-board-rim-gleam");
    expect(css).toContain("@keyframes sc-board-lantern-glow");
    expect(css).toContain("@keyframes sc-board-lantern-bloom-pulse");

    const rmBlock = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(rmBlock).toContain(".sc-board-sky-horizon-glow");
    expect(rmBlock).toContain(".sc-board-celestial-beam");
    expect(rmBlock).toContain(".sc-board-tile-sun-rim");
    expect(rmBlock).toContain(".sc-board-keep-window-lantern");
    expect(rmBlock).toContain(".sc-board-camp-lantern-bloom");
  });
});
