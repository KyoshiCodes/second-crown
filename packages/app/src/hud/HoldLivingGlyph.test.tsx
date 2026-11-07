import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  HoldCardUnderlay,
  HoldLivingStrip,
  resolveHoldLivingItems,
  type HoldLivingDomain,
  type HoldLivingInput,
} from "./HoldLivingGlyph";
import { JoinHoldCard } from "../JoinHoldCard";
import type { HoldView } from "../net/hold";

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

const BASE_VIEW: HoldView = {
  realmId: "join-iron-vale",
  tick: 24,
  stores: { food: "14", wood: "32.5", stone: "0.4", gold: "9" },
  militia: 2,
  training: 1,
  farms: 2,
  cottages: 1,
  lumberCamps: 1,
  stamps: [{ tick: 12, by: "sera" }],
  pending: 0,
};

const DOMAINS: HoldLivingDomain[] = ["works", "stores", "stamps", "key"];

function makeInput(overrides: Partial<HoldLivingInput> = {}): HoldLivingInput {
  return {
    view: BASE_VIEW,
    madeKey: null,
    copied: false,
    ...overrides,
  };
}

describe("resolveHoldLivingItems", () => {
  it("returns the four hold domains in deterministic order", () => {
    const items = resolveHoldLivingItems(makeInput());
    expect(items.map((item) => item.domain)).toEqual(DOMAINS);
  });

  it("maps works state across training (busy), standing works (active), and empty yards (calm)", () => {
    expect(resolveHoldLivingItems(makeInput())[0]).toEqual({
      domain: "works",
      state: "busy",
      flair: "Drilling +1",
    });

    const standing = resolveHoldLivingItems(makeInput({ view: { ...BASE_VIEW, training: 0 } }))[0];
    expect(standing).toEqual({
      domain: "works",
      state: "active",
      flair: "Yards active",
    });

    const quiet = resolveHoldLivingItems(
      makeInput({
        view: { ...BASE_VIEW, training: 0, militia: 0, farms: 0, cottages: 0, lumberCamps: 0 },
      }),
    )[0];
    expect(quiet).toEqual({
      domain: "works",
      state: "calm",
      flair: "Yards quiet",
    });
  });

  it("maps stores state across stocked vaults and bare stores", () => {
    expect(resolveHoldLivingItems(makeInput())[1]).toEqual({
      domain: "stores",
      state: "active",
      flair: "3/4 stocked",
    });

    const bare = resolveHoldLivingItems(
      makeInput({
        view: { ...BASE_VIEW, stores: { food: "0", wood: "0.8", stone: "0", gold: "0.2" } },
      }),
    )[1];
    expect(bare).toEqual({
      domain: "stores",
      state: "calm",
      flair: "Vaults bare",
    });
  });

  it("maps stamps state across single, multiple, and empty stamps", () => {
    expect(resolveHoldLivingItems(makeInput())[2]).toEqual({
      domain: "stamps",
      state: "active",
      flair: "1 stamped",
    });

    const twoStamps = resolveHoldLivingItems(
      makeInput({
        view: {
          ...BASE_VIEW,
          stamps: [
            { tick: 4, by: "ann" },
            { tick: 9, by: "bo" },
          ],
        },
      }),
    )[2];
    expect(twoStamps).toEqual({
      domain: "stamps",
      state: "active",
      flair: "2 stamped",
    });

    const unstamped = resolveHoldLivingItems(makeInput({ view: { ...BASE_VIEW, stamps: [] } }))[2];
    expect(unstamped).toEqual({
      domain: "stamps",
      state: "calm",
      flair: "Unstamped",
    });
  });

  it("maps key state across uncopied, copied, and joined-with-key without ever repeating the secret key", () => {
    const secret = "crown-secret-9921";
    const uncopied = resolveHoldLivingItems(makeInput({ madeKey: secret, copied: false }))[3];
    expect(uncopied).toEqual({ domain: "key", state: "warn", flair: "Copy key" });
    expect(uncopied.flair).not.toContain(secret);

    const copied = resolveHoldLivingItems(makeInput({ madeKey: secret, copied: true }))[3];
    expect(copied).toEqual({ domain: "key", state: "active", flair: "Key copied" });
    expect(copied.flair).not.toContain(secret);

    const warded = resolveHoldLivingItems(makeInput({ madeKey: null, copied: false }))[3];
    expect(warded).toEqual({ domain: "key", state: "calm", flair: "Key warded" });
  });

  it("is pure and does not mutate HoldView", () => {
    const snapshot: HoldView = {
      ...BASE_VIEW,
      stores: { ...BASE_VIEW.stores },
      stamps: BASE_VIEW.stamps.map((s) => ({ ...s })),
    };
    const before = JSON.stringify(snapshot);
    resolveHoldLivingItems({ view: snapshot, madeKey: "once-key", copied: false });
    expect(JSON.stringify(snapshot)).toBe(before);
  });
});

describe("HoldLivingStrip and HoldCardUnderlay markup", () => {
  it("renders aria-hidden phrasing-only spans and SVGs with glow, pulse, and drift layers", () => {
    const html = renderToStaticMarkup(<HoldLivingStrip {...makeInput({ madeKey: "secret-x" })} />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("sc-hold-living-glow");
    expect(html).toContain("sc-hold-living-pulse");
    expect(html).toContain("sc-hold-living-drift");
    expect(html).not.toContain("secret-x");
    for (const domain of DOMAINS) {
      expect(html).toContain(`data-hold-domain="${domain}"`);
    }
    expect(html).not.toMatch(/<(?:div|p|section|article|button)\b/);
  });

  it("renders distinct corner watermark SVGs for works, stores, stamps, and key variants", () => {
    const workSvgs = ["militia", "farms", "cottages", "lumberCamps"].map((variant) =>
      renderToStaticMarkup(<HoldCardUnderlay domain="works" variant={variant} />),
    );
    expect(new Set(workSvgs).size).toBe(4);

    const storeSvgs = ["food", "wood", "stone", "gold"].map((variant) =>
      renderToStaticMarkup(<HoldCardUnderlay domain="stores" variant={variant} />),
    );
    expect(new Set(storeSvgs).size).toBe(4);

    const stampSvg = renderToStaticMarkup(<HoldCardUnderlay domain="stamps" variant="stamp" />);
    const keySvg = renderToStaticMarkup(<HoldCardUnderlay domain="key" variant="key" state="warn" />);
    expect(stampSvg).not.toBe(keySvg);
    expect(keySvg).toContain('aria-hidden="true"');
    expect(keySvg).not.toMatch(/<(?:div|p|section|article|button)\b/);
  });
});

describe("JoinHoldCard integration and CSS isolation", () => {
  it("mounts HoldLivingStrip under HoldStatusStack and corner watermarks on works, stores, stamps, and key cards", () => {
    const secret = "hold-secret-774";
    const html = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} intentLines={[]} initialView={BASE_VIEW} initialMadeKey={secret} />,
    );

    const stackIdx = html.indexOf("sc-holdstat");
    const stripIdx = html.indexOf("sc-hold-living-strip");
    const actionsIdx = html.indexOf('aria-label="Hold actions"');
    expect(stackIdx).toBeGreaterThan(-1);
    expect(stripIdx).toBeGreaterThan(stackIdx);
    expect(stripIdx).toBeLessThan(actionsIdx);

    expect(html.match(/data-hold-underlay="works"/g)?.length).toBe(4);
    expect(html.match(/data-hold-underlay="stores"/g)?.length).toBe(4);
    expect(html.match(/data-hold-underlay="stamps"/g)?.length).toBe(1);
    expect(html.match(/data-hold-underlay="key"/g)?.length).toBe(1);

    // Ensure the secret key only appears inside <code class="sc-hold-key-value"> once, never leaked into living glyphs
    expect(html.match(new RegExp(secret, "g"))?.length).toBe(1);
  });

  it("renders zero living hold glyphs before joining a hold", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} />);
    expect(html).not.toContain("sc-hold-living-strip");
    expect(html).not.toContain("sc-hold-living-underlay");
  });

  it("isolates styles in hold-living.css with pointer-events: none, subtle watermark opacity, and reduced-motion support", () => {
    const css = readCssFile("./hold-living.css");
    const themeCss = readCssFile("../theme.css");

    expect(themeCss).not.toContain("sc-hold-living");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");

    // Check watermark underlay wrapper opacity stays low so card text is never obscured
    const underlayBlock = /\.sc-hold-living-underlay\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? "";
    const wrapperOpacity = Number(/opacity:\s*([0-9.]+)/.exec(underlayBlock)?.[1] ?? "1");
    expect(wrapperOpacity).toBeLessThanOrEqual(0.3);

    const watermarkKeyframe = /@keyframes\s+sc-hold-watermark-breathe\s*\{([\s\S]*?)\}\s*\}/.exec(css)?.[0] ?? "";
    const keyframeOpacities = [...watermarkKeyframe.matchAll(/opacity:\s*([0-9.]+)/g)].map((m) => Number(m[1]));
    expect(keyframeOpacities.length).toBeGreaterThan(0);
    for (const op of keyframeOpacities) {
      expect(op).toBeLessThanOrEqual(0.55);
    }
  });
});
