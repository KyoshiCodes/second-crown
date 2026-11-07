import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, revealProvince, type Province } from "@second-crown/sim";
import {
  BoardLiving,
  boardGridToWorld,
  TERRAIN_PULSE_COLORS,
  CANVAS_W,
  CANVAS_H,
} from "./BoardLiving";

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
});

describe("Board living styling and CSS isolation", () => {
  it("enforces pointer-events: none !important on all layers", () => {
    const css = readCssFile("./board-living.css");
    expect(css).toContain("pointer-events: none !important;");
  });

  it("provides keyframe animations for terrain pulse, keep glow, and fog drift", () => {
    const css = readCssFile("./board-living.css");
    expect(css).toContain("@keyframes sc-board-terrain-pulse");
    expect(css).toContain("@keyframes sc-board-terrain-aura-breathe");
    expect(css).toContain("@keyframes sc-board-keep-breathe");
    expect(css).toContain("@keyframes sc-board-keep-flicker");
    expect(css).toContain("@keyframes sc-board-fog-drift");
    expect(css).toContain("@keyframes sc-board-fog-swell");
    expect(css).toContain("@keyframes sc-board-tether-flow");
  });

  it("provides prefers-reduced-motion accessibility overrides", () => {
    const css = readCssFile("./board-living.css");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important;");
  });

  it("does not leak into theme.css", () => {
    const theme = readCssFile("./theme.css");
    expect(theme).not.toContain("sc-board-living");
    expect(theme).not.toContain("sc-board-terrain");
    expect(theme).not.toContain("sc-board-keep");
    expect(theme).not.toContain("sc-board-fog");
  });
});
