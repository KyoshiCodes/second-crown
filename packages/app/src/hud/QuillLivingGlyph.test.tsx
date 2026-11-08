import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LedgerCard } from "./LedgerCard";
import {
  QuillLivingGlyph,
  QuillLivingUnderlay,
  resolveQuillDescriptor,
} from "./QuillLivingGlyph";

function readFile(relativePath: string): string {
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

describe("resolveQuillDescriptor", () => {
  it("resolves war descriptor with crimson rubrication and pulse motion", () => {
    const desc = resolveQuillDescriptor("war_declared");
    expect(desc.tone).toBe("war");
    expect(desc.motion).toBe("pulse");
    expect(desc.color).toBe("#ef4444");
    expect(desc.label).toBe("Martial rubric");
    expect(desc.flair).toContain("rubricated in crimson");
  });

  it("resolves victory descriptor with golden illumination and drift motion", () => {
    const desc = resolveQuillDescriptor("victory");
    expect(desc.tone).toBe("victory");
    expect(desc.motion).toBe("drift");
    expect(desc.color).toBe("#facc15");
    expect(desc.label).toBe("Triumph entry");
    expect(desc.flair).toContain("gilded illumination");
  });

  it("resolves crown descriptor with royal court script and drift motion", () => {
    const desc = resolveQuillDescriptor("crown");
    expect(desc.tone).toBe("crown");
    expect(desc.motion).toBe("drift");
    expect(desc.color).toBe("#818cf8");
    expect(desc.label).toBe("Royal script");
    expect(desc.flair).toContain("royal court script");
  });

  it("resolves save descriptor with archive seal and pulse motion", () => {
    const desc = resolveQuillDescriptor("save_written");
    expect(desc.tone).toBe("save");
    expect(desc.motion).toBe("pulse");
    expect(desc.color).toBe("#38bdf8");
    expect(desc.label).toBe("Chronicle seal");
    expect(desc.flair).toContain("chronicle recorded");
  });

  it("resolves calm fallback for unclassified or undefined kinds", () => {
    const desc = resolveQuillDescriptor(undefined);
    expect(desc.tone).toBe("calm");
    expect(desc.motion).toBe("drift");
    expect(desc.color).toBe("#e3b341");
    expect(desc.label).toBe("Scribe quill");
    expect(desc.flair).toContain("iron-gall script");
  });
});

describe("QuillLivingGlyph and QuillLivingUnderlay components", () => {
  it("renders 14x14 living quill with glow, pulse, and drift layers", () => {
    const html = renderToStaticMarkup(<QuillLivingGlyph kind="war" tick={42} />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('class="sc-quill-living-glyph motion-pulse tone-war"');
    expect(html).toContain('width="14"');
    expect(html).toContain('height="14"');
    expect(html).toContain("sc-ledger-glow-layer");
    expect(html).toContain("sc-ledger-pulse-layer");
    expect(html).toContain("sc-ledger-drift-layer");
    expect(html).toContain("Martial rubric");
    expect(html).toContain("rubricated in crimson");
  });

  it("renders 34x34 underlay watermark with aria-hidden", () => {
    const html = renderToStaticMarkup(<QuillLivingUnderlay kind="victory" />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('class="sc-quill-living-underlay tone-victory kind-victory"');
    expect(html).toContain('width="34"');
    expect(html).toContain('height="34"');
  });

  it("mounts underlay and living glyph inside LedgerCard alongside rows", () => {
    const html = renderToStaticMarkup(
      <ul>
        <LedgerCard tick={100} text="Grand alliance sworn" kind="crown" />
      </ul>
    );
    expect(html).toContain("sc-quill-living-underlay");
    expect(html).toContain("sc-quill-living-glyph");
    expect(html).toContain("sc-ledger-card-rows");
    expect(html).toContain("sc-quill-pip");
    expect(html).toContain("Grand alliance sworn");
    expect(html).toContain("Royal script");
  });
});

describe("LedgerCard living styling isolation & invariants", () => {
  it("enforces pointer-events: none on decorative layers in ledger-living.css", () => {
    const css = readFile("./ledger-living.css");
    expect(css).toContain(".sc-quill-living-underlay");
    expect(css).toContain("pointer-events: none !important");
    expect(css).toContain(".sc-quill-living-glyph");
  });

  it("enforces reduced-motion guard in ledger-living.css", () => {
    const css = readFile("./ledger-living.css");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none !important");
  });

  it("keeps theme.css untouched without quill living leaks", () => {
    const theme = readFile("../theme.css");
    expect(theme).not.toContain("sc-quill-living");
    expect(theme).not.toContain("sc-ledger-card.is-living");
  });
});
