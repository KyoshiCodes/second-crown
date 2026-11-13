import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { GameState } from "@second-crown/sim";
import { BoardBanners, resolveBannerRealmColors } from "./BoardBanners";
import { BoardLiving } from "../BoardLiving";
import { OverworldAtlas } from "../OverworldAtlas";

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

function createBannerMockState(opts?: { weather?: string; posted?: boolean }): GameState {
  const flags: Record<string, string | number> = {
    fog_seen: JSON.stringify(["p_home", "p_outpost", "p_silk", "p_camp_ash"]),
  };
  if (opts?.weather) {
    flags.weather = opts.weather;
  }
  if (opts?.posted) {
    flags["garrison_p_outpost"] = 4;
  }
  return {
    meta: { tick: 400 },
    buildings: [],
    board: {
      homeProvinceId: "p_home",
      provinces: [
        { id: "p_home", x: 2, y: 2, terrain: "plain", node: "hold", occupantRealmId: "player" },
        { id: "p_outpost", x: 3, y: 2, terrain: "plain", node: "none", occupantRealmId: "player" },
        { id: "p_silk", x: 4, y: 3, terrain: "hill", node: "hold", occupantRealmId: "k_silk" },
        { id: "p_camp_ash", x: 5, y: 2, terrain: "waste", node: "camp", occupantRealmId: "k_ash" },
        { id: "p_hidden", x: 6, y: 4, terrain: "peak", node: "hold", occupantRealmId: "k_veil" },
      ],
    },
    flags,
    season: { current: "summer" },
  } as unknown as GameState;
}

describe("BoardBanners & living keep/outpost realm banners (bakeoff/gemini-keep-banners)", () => {
  it("resolves distinct realm colors for player, rival, k_silk, k_ash, k_veil, and custom realms", () => {
    const player = resolveBannerRealmColors("player", true);
    const rival = resolveBannerRealmColors("rival");
    const silk = resolveBannerRealmColors("k_silk");
    const ash = resolveBannerRealmColors("k_ash");
    const veil = resolveBannerRealmColors("k_veil");
    const custom = resolveBannerRealmColors("custom_barony");

    expect(player.pennant).toBe("#1d4ed8");
    expect(player.accent).toBe("#fbbf24");
    expect(silk.pennant).toBe("#0f766e");
    expect(ash.pennant).toBe("#c2410c");
    expect(veil.pennant).toBe("#7c3aed");
    expect(rival.pennant).toBe("#991b1b");
    expect(custom.pennant).toMatch(/^#[0-9a-f]{6}$/i);

    const uniquePennants = new Set([player.pennant, rival.pennant, silk.pennant, ash.pennant, veil.pennant]);
    expect(uniquePennants.size).toBe(5);
  });

  it("renders fluttering keep banners and outpost flags for seen tiles only", () => {
    const state = createBannerMockState({ posted: true });
    const html = renderToStaticMarkup(
      <svg>
        <BoardBanners state={state} />
      </svg>,
    );

    expect(html).toContain("sc-board-living-banners");
    expect(html).toContain("sc-board-keep-banner");
    expect(html).toContain("sc-board-outpost-flag");
    expect(html).toContain("sc-board-banner-cloth");
    expect(html).toContain("sc-board-banner-ribbon");
    expect(html).toContain("sc-board-flag-cloth");

    // Seen realms rendered with their heraldic colors
    expect(html).toContain('data-realm="player"');
    expect(html).toContain('data-realm="k_silk"');
    expect(html).toContain('data-realm="k_ash"');
    expect(html).toContain("#0f766e"); // k_silk pennant
    expect(html).toContain("#c2410c"); // k_ash pennant

    // Unseen hold is hidden by fog
    expect(html).not.toContain('data-realm="k_veil"');
  });

  it("marks storm weather on BoardBanners for faster banner whip", () => {
    const stormState = createBannerMockState({ weather: "storm" });
    const html = renderToStaticMarkup(
      <svg>
        <BoardBanners state={stormState} />
      </svg>,
    );
    expect(html).toContain("is-storm");
    expect(html).toContain('data-weather="storm"');
  });

  it("integrates BoardBanners into the BoardLiving overlay", () => {
    const state = createBannerMockState();
    const html = renderToStaticMarkup(<BoardLiving state={state} selectedId={null} visible={true} />);
    expect(html).toContain("sc-board-living-banners");
    expect(html).toContain("sc-board-keep-banner");
    expect(html).toContain("sc-board-outpost-flag");
  });

  it("renders realm-colored fluttering banners and flags on OverworldAtlas keeps and camps", () => {
    const state = createBannerMockState();
    const html = renderToStaticMarkup(<OverworldAtlas state={state} selectedId={null} />);
    expect(html).toContain("sc-atlas-keep-banner-cloth");
    expect(html).toContain("sc-atlas-keep-banner-ribbon");
    expect(html).toContain('data-realm="k_silk"');
    expect(html).toContain('data-realm="k_ash"');
    expect(html).toContain("#0f766e");
    expect(html).toContain("#c2410c");
  });

  it("enforces isolated CSS, pointer-events: none, fill-box transform origins, and reduced-motion guards", () => {
    const bannersCss = readCssFile("./board-banners.css");
    const keepsCss = readCssFile("./atlas-keeps.css");
    const campsCss = readCssFile("./atlas-camps.css");
    const themeCss = readCssFile("../theme.css");

    for (const css of [bannersCss, keepsCss, campsCss]) {
      expect(css).toContain("pointer-events: none !important");
      expect(css).toContain("transform-box: fill-box");
      expect(css).toContain("@media (prefers-reduced-motion: reduce)");
      expect(css).toContain("animation: none !important");
    }

    expect(bannersCss).toContain("@keyframes sc-board-banner-flutter");
    expect(bannersCss).toContain("@keyframes sc-board-flag-flutter");
    expect(bannersCss).toContain("@keyframes sc-board-ribbon-wave");

    expect(themeCss).not.toContain("sc-board-living-banners");
    expect(themeCss).not.toContain("sc-board-keep-banner");
    expect(themeCss).not.toContain("sc-board-outpost-flag");
    expect(themeCss).not.toContain("sc-atlas-keep-banner-cloth");
  });
});
