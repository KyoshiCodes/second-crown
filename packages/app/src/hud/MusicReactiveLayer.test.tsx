import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  applyMusicReactiveAttributes,
  clearMusicReactiveAttributes,
  MusicReactiveLayer,
  resolveMusicReactiveState,
  resolveMusicTrackProfile,
  type MusicReactiveState,
} from "./MusicReactiveLayer";

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

function readBlock(css: string, selector: string): string {
  const idx = css.indexOf(selector);
  expect(idx).toBeGreaterThanOrEqual(0);
  const open = css.indexOf("{", idx);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close);
}

function readOpacityVar(block: string, varName: string): number {
  const match = block.match(new RegExp(`${varName}:\\s*([0-9.]+)`));
  expect(match).not.toBeNull();
  return Number(match![1]);
}

describe("MusicReactiveLayer", () => {
  it("resolves idle, playing tracks (All We Know vs Holding On), and Realm fallback safely", () => {
    expect(
      resolveMusicReactiveState({
        mode: "off",
        lofiStatus: "playing",
        trackName: "All We Know",
      }),
    ).toEqual({
      playing: false,
      mode: "off",
      profile: "idle",
      tone: "none",
      trackName: "",
    });

    for (const status of ["idle", "blocked", "missing"] as const) {
      expect(
        resolveMusicReactiveState({
          mode: "lofi",
          lofiStatus: status,
          trackName: "Holding On",
        }).playing,
      ).toBe(false);
    }

    expect(
      resolveMusicReactiveState({
        mode: "lofi",
        lofiStatus: "playing",
        trackName: "All We Know",
      }),
    ).toEqual({
      playing: true,
      mode: "lofi",
      profile: "all-we-know",
      tone: "gold",
      trackName: "All We Know",
    });

    expect(resolveMusicTrackProfile("01 - All We Know.ogg", "/audio/01%20-%20All%20We%20Know.ogg")).toBe("all-we-know");
    expect(resolveMusicTrackProfile("lofi-a", "/audio/lofi-a.ogg")).toBe("all-we-know");
    expect(resolveMusicTrackProfile("Track 1", "/audio/track-1.ogg", 0, 2)).toBe("all-we-know");

    expect(
      resolveMusicReactiveState({
        mode: "lofi",
        lofiStatus: "playing",
        trackName: "Holding On",
      }),
    ).toEqual({
      playing: true,
      mode: "lofi",
      profile: "holding-on",
      tone: "slate",
      trackName: "Holding On",
    });

    expect(resolveMusicTrackProfile("02 - Holding On.ogg", "/audio/02%20-%20Holding%20On.ogg")).toBe("holding-on");
    expect(resolveMusicTrackProfile("lofi-b", "/audio/lofi-b.ogg")).toBe("holding-on");
    expect(resolveMusicTrackProfile("Track 2", "/audio/track-2.ogg", 1, 2)).toBe("holding-on");

    expect(
      resolveMusicReactiveState({
        mode: "lofi",
        lofiStatus: "playing",
        trackName: "Morning Coffee",
      }),
    ).toEqual({
      playing: true,
      mode: "lofi",
      profile: "ambient",
      tone: "neutral",
      trackName: "Morning Coffee",
    });

    expect(
      resolveMusicReactiveState({
        mode: "bed",
        lofiStatus: "idle",
        trackName: "",
      }),
    ).toEqual({
      playing: true,
      mode: "bed",
      profile: "ambient",
      tone: "neutral",
      trackName: "Realm",
    });
  });

  it("syncs and clears documentElement dataset attributes cleanly", () => {
    const mockRoot = { dataset: {} as Record<string, string | undefined> };
    const state: MusicReactiveState = {
      playing: true,
      mode: "lofi",
      profile: "all-we-know",
      tone: "gold",
      trackName: "All We Know",
    };

    applyMusicReactiveAttributes(mockRoot, state);
    expect(mockRoot.dataset.musicReactive).toBe("playing");
    expect(mockRoot.dataset.musicTrack).toBe("all-we-know");

    applyMusicReactiveAttributes(mockRoot, {
      playing: false,
      mode: "off",
      profile: "idle",
      tone: "none",
      trackName: "",
    });
    expect(mockRoot.dataset.musicReactive).toBe("idle");
    expect(mockRoot.dataset.musicTrack).toBe("idle");

    clearMusicReactiveAttributes(mockRoot);
    expect(mockRoot.dataset.musicReactive).toBeUndefined();
    expect(mockRoot.dataset.musicTrack).toBeUndefined();
  });

  it("renders purely decorative aria-hidden markup with pointer-events: none", () => {
    const idleHtml = renderToStaticMarkup(
      <MusicReactiveLayer
        stateOverride={{
          playing: false,
          mode: "off",
          profile: "idle",
          tone: "none",
          trackName: "",
        }}
      />,
    );
    expect(idleHtml).toContain("sc-music-reactive-layer is-idle track-idle tone-none");
    expect(idleHtml).toContain('data-music-reactive="idle"');
    expect(idleHtml).toContain('aria-hidden="true"');
    expect(idleHtml).toContain("pointer-events:none");

    const goldHtml = renderToStaticMarkup(
      <MusicReactiveLayer
        stateOverride={{
          playing: true,
          mode: "lofi",
          profile: "all-we-know",
          tone: "gold",
          trackName: "All We Know",
        }}
      />,
    );
    expect(goldHtml).toContain("sc-music-reactive-layer is-playing track-all-we-know tone-gold");
    expect(goldHtml).toContain('data-music-reactive="playing"');
    expect(goldHtml).toContain('data-music-track="all-we-know"');
    expect(goldHtml).toContain('class="sc-music-reactive-wash"');
    expect(goldHtml).toContain('class="sc-music-reactive-vignette"');

    const slateHtml = renderToStaticMarkup(
      <MusicReactiveLayer
        stateOverride={{
          playing: true,
          mode: "lofi",
          profile: "holding-on",
          tone: "slate",
          trackName: "Holding On",
        }}
      />,
    );
    expect(slateHtml).toContain("sc-music-reactive-layer is-playing track-holding-on tone-slate");
    expect(slateHtml).toContain('data-music-track="holding-on"');
    expect(slateHtml).toContain('data-music-tone="slate"');
  });

  it("enforces isolated CSS, Dusk/Night/Parchment theme tokens, intensity hierarchy, and click immunity", () => {
    const css = readCssFile("./music-reactive.css");
    const softenCss = readCssFile("./living-glyph-soften.css");
    const appShellTsx = readCssFile("../AppShell.tsx");

    expect(css).toContain("pointer-events: none !important;");
    expect(css).not.toContain(".sc-tab.active::after");
    expect(css).not.toContain(".sc-ledger-cell::before");

    // Distinct palettes and cadences between All We Know (warmer gold) and Holding On (cooler slate)
    const goldBlock = readBlock(css, ':root[data-chrome="dusk"][data-music-track="all-we-know"]');
    const slateBlock = readBlock(css, ':root[data-chrome="dusk"][data-music-track="holding-on"]');
    expect(goldBlock).toContain("228, 178, 72");
    expect(slateBlock).toContain("126, 158, 196");
    expect(goldBlock).not.toBe(slateBlock);

    // Explicitly respects all 3 themes across all track profiles
    for (const theme of ["dusk", "night", "parchment"] as const) {
      expect(css).toContain(`:root[data-chrome="${theme}"]`);
      for (const track of ["all-we-know", "holding-on", "ambient"] as const) {
        const block = readBlock(css, `[data-chrome="${theme}"][data-music-track="${track}"]`);
        const bg = readOpacityVar(block, "--sc-music-bg-opacity");
        const chrome = readOpacityVar(block, "--sc-music-chrome-opacity");
        const strip = readOpacityVar(block, "--sc-music-strip-opacity");
        const card = readOpacityVar(block, "--sc-music-card-opacity");
        // Resource strip and selected cards pulse slightly stronger than board bg & chrome
        expect(strip).toBeGreaterThan(bg);
        expect(strip).toBeGreaterThan(chrome);
        expect(card).toBeGreaterThan(bg);
        expect(card).toBeGreaterThan(chrome);
      }
    }

    // Target surface coverage
    expect(css).toContain(".sc-map-canvas-container > div::after");
    expect(css).toContain(".sc-chrome::after");
    expect(css).toContain(".sc-resource-bar.sc-ledger::after");
    expect(css).toContain(".sc-resource-bar .sc-ledger-cell::after");
    expect(css).toContain(".sc-inspect-card::after");
    expect(css).toContain(".sc-atlas-card.is-selected::after");

    // Accessibility reduced-motion override
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important;");

    // Registered in living-glyph-soften.css and mounted in AppShell.tsx
    expect(softenCss).toContain(".sc-shell .sc-music-reactive-layer");
    expect(appShellTsx).toContain("MusicReactiveLayer");
  });
});
