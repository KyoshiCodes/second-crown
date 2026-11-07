import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import {
  WarLivingGlyph,
  WarLivingUnderlay,
  getWarForceEmblem,
  resolveWarForceLiving,
} from "./WarLivingGlyph";
import { ForceCard, type ForceTone } from "./ForceCard";
import { forceStatusRows } from "./ForceStatus";
import { WarRoom } from "../WarRoom";

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

const TONES: ForceTone[] = ["hostile", "scout", "gather", "garrison"];

describe("getWarForceEmblem and resolveWarForceLiving", () => {
  it("maps the four War Room force tones to warband, cloak, cart, and tent", () => {
    expect(getWarForceEmblem("hostile")).toBe("warband");
    expect(getWarForceEmblem("scout")).toBe("cloak");
    expect(getWarForceEmblem("gather")).toBe("cart");
    expect(getWarForceEmblem("garrison")).toBe("tent");
    expect(getWarForceEmblem("warband")).toBe("warband");
    expect(getWarForceEmblem("cloak")).toBe("cloak");
    expect(getWarForceEmblem("cart")).toBe("cart");
    expect(getWarForceEmblem("tent")).toBe("tent");
  });

  it("resolves readable flairs for warbands, cloaks, carts, and tents without mutating input", () => {
    const input = { tone: "hostile" as const, riskTone: "danger", moving: true };
    const snap = JSON.stringify(input);
    expect(resolveWarForceLiving(input)).toEqual({
      emblem: "warband",
      isDanger: true,
      moving: true,
      flair: "Warband march",
    });
    expect(JSON.stringify(input)).toBe(snap);

    expect(resolveWarForceLiving({ tone: "hostile", moving: false }).flair).toBe("Warband host");
    expect(resolveWarForceLiving({ tone: "scout", moving: true }).flair).toBe("Cloak outrider");
    expect(resolveWarForceLiving({ tone: "scout", moving: false }).flair).toBe("Cloak watch");
    expect(resolveWarForceLiving({ tone: "gather", loaded: true }).flair).toBe("Cart laden");
    expect(resolveWarForceLiving({ tone: "gather", empty: true }).flair).toBe("Cart empty");
    expect(resolveWarForceLiving({ tone: "gather" }).flair).toBe("Supply cart");
    expect(resolveWarForceLiving({ tone: "garrison", riskTone: "calm" }).flair).toBe("Pavilion tent");
    expect(resolveWarForceLiving({ tone: "garrison", riskTone: "danger" }).flair).toBe("Tent under threat");
  });
});

describe("WarLivingUnderlay and WarLivingGlyph markup", () => {
  it("renders phrasing-only aria-hidden spans and distinct SVGs for warband, cloak, cart, and tent", () => {
    const underlays = TONES.map((tone) => renderToStaticMarkup(<WarLivingUnderlay tone={tone} />));
    expect(new Set(underlays).size).toBe(4);
    for (const html of underlays) {
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain("sc-war-living-underlay");
      expect(html).not.toMatch(/<(?:div|p|section|article|button)\b/);
    }

    const badges = TONES.map((tone) => renderToStaticMarkup(<WarLivingGlyph tone={tone} moving={true} />));
    expect(new Set(badges).size).toBe(4);
    for (const html of badges) {
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain("sc-war-glow-layer");
      expect(html).toContain("sc-war-drift-layer");
      expect(html).toContain("sc-war-pulse-layer");
      expect(html).not.toMatch(/<(?:div|p|section|article|button)\b/);
    }
  });

  it("differentiates laden vs empty gather carts and moving vs danger classes", () => {
    const ladenCart = renderToStaticMarkup(<WarLivingGlyph tone="gather" loaded={true} moving={true} />);
    const emptyCart = renderToStaticMarkup(<WarLivingGlyph tone="gather" empty={true} moving={true} />);
    expect(ladenCart).not.toBe(emptyCart);
    expect(ladenCart).toContain("Cart laden");
    expect(emptyCart).toContain("Cart empty");

    const emptyUnderlay = renderToStaticMarkup(<WarLivingUnderlay tone="gather" empty={true} />);
    expect(emptyUnderlay).toContain("is-empty");

    const alertTent = renderToStaticMarkup(<WarLivingGlyph tone="garrison" riskTone="danger" />);
    expect(alertTent).toContain("emblem-tent");
    expect(alertTent).toContain("is-danger");
    expect(alertTent).toContain("Tent under threat");
  });
});

describe("ForceCard and WarRoom integration", () => {
  it("mounts WarLivingUnderlay and WarLivingGlyph beneath ForceLedger and ForceStatus while keeping buttons intact", () => {
    const rows = forceStatusRows({ power: 5, powerMax: 10, seconds: 4, risk: { value: "Low", tone: "calm" } });
    const html = renderToStaticMarkup(
      <ForceCard
        tone="scout"
        name="Scout"
        captain="Ada"
        dest="2,3"
        seconds={4}
        status={rows}
        action={{ label: "Recall", onClick: () => {} }}
      />,
    );

    const ledgerIdx = html.indexOf("sc-force-ledger");
    const statusIdx = html.indexOf("sc-force-status");
    const glyphIdx = html.indexOf("sc-war-status-glyph");
    expect(ledgerIdx).toBeGreaterThan(-1);
    expect(statusIdx).toBeGreaterThan(ledgerIdx);
    expect(glyphIdx).toBeGreaterThan(statusIdx);
    expect(html).toContain('data-war-underlay="cloak"');
    expect(html).toContain('data-war-emblem="cloak"');
    expect(html).toContain("Cloak outrider");
    expect(html).toContain(">Recall</button>");
  });

  it("renders living emblem under ForceLedger even when status rows are omitted", () => {
    const html = renderToStaticMarkup(<ForceCard tone="garrison" name="Garrison" dest="1,1" />);
    expect(html).toContain("sc-force-ledger");
    expect(html).not.toContain("sc-force-status");
    expect(html).toContain('data-war-emblem="tent"');
    expect(html).toContain("Pavilion tent");
  });

  it("renders living tent glyphs on posted garrisons in WarRoom without mutating GameState", () => {
    const s = createGameState({ seed: 2 });
    const targetId = s.board.provinces.find((p) => p.id !== s.board.homeProvinceId)!.id;
    s.flags["garrisons_json"] = JSON.stringify([{ provinceId: targetId, force: { militia: 4 } }]);
    s.flags["culture_rival"] = "western";
    const before = JSON.stringify(s);

    const html = renderToStaticMarkup(
      <WarRoom state={s} act={() => {}} rivalOp={0} playerOp={0} battleSnap={null} setBattleSnap={() => {}} />,
    );
    expect(JSON.stringify(s)).toBe(before);
    expect(html).toContain('data-war-emblem="tent"');
    expect(html).toContain("Pavilion tent");
  });
});

describe("war-living.css isolation, corner confinement, and accessibility", () => {
  it("keeps theme.css, force-card.css, force-ledger.css, and force-status.css free of war-living classes", () => {
    for (const path of ["../theme.css", "./force-card.css", "./force-ledger.css", "./force-status.css"]) {
      const otherCss = readCssFile(path);
      expect(otherCss).not.toContain("sc-war-living");
      expect(otherCss).not.toContain("sc-war-status-glyph");
    }
  });

  it("enforces pointer-events: none, corner-confined 34x34 watermark with radial mask, low opacity, and reduced-motion guard", () => {
    const css = readCssFile("./war-living.css");
    expect(css).toContain(".sc-force-card:has(> .sc-war-living-underlay)");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("radial-gradient");

    const underlayBlock = /\.sc-war-living-underlay\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? "";
    expect(underlayBlock).toContain("width: 34px;");
    expect(underlayBlock).toContain("height: 34px;");
    expect(underlayBlock).not.toContain("inset: 0");
    const wrapperOpacity = Number(/opacity:\s*([0-9.]+)/.exec(underlayBlock)?.[1] ?? "1");
    expect(wrapperOpacity).toBeLessThanOrEqual(0.3);

    for (const kf of ["sc-war-underlay-breathe", "sc-war-underlay-drift", "sc-war-underlay-danger"]) {
      const block = new RegExp(`@keyframes\\s+${kf}\\s*\\{([\\s\\S]*?)\\}\\s*\\}`).exec(css)?.[0] ?? "";
      const opacities = [...block.matchAll(/opacity:\s*([0-9.]+)/g)].map((m) => Number(m[1]));
      expect(opacities.length).toBeGreaterThan(0);
      for (const op of opacities) {
        expect(op).toBeLessThanOrEqual(0.55);
      }
    }
  });
});
