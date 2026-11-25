import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BandToggle, HoldFocusTag } from "./HoldDensity";

function readTextFile(relativePath: string): string {
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

const noop = () => {};

describe("Hold density pass", () => {
  it("names both modes and lights only the live one", () => {
    const hold = renderToStaticMarkup(<BandToggle band="hold" onToggle={noop} />);
    expect(hold).toContain('data-band="hold"');
    expect(hold).toContain("🏰 Hold");
    expect(hold).toContain("🗺️ Board");
    expect(hold).toMatch(/sc-band-seg is-hold is-on/);
    expect(hold).not.toMatch(/sc-band-seg is-board is-on/);
    expect(hold).toContain("Switch to Board");

    const board = renderToStaticMarkup(<BandToggle band="board" onToggle={noop} />);
    expect(board).toMatch(/sc-band-seg is-board is-on/);
    expect(board).not.toMatch(/sc-band-seg is-hold is-on/);
    expect(board).toContain("Switch to Hold");
  });

  it("shows the Hold tag only on Hold, out of hit-testing", () => {
    const on = renderToStaticMarkup(<HoldFocusTag visible />);
    expect(on).toContain("sc-hold-focus-tag");
    expect(on).toContain('aria-hidden="true"');
    expect(renderToStaticMarkup(<HoldFocusTag visible={false} />)).toBe("");
    const css = readTextFile("./hold-density.css");
    expect(css).toMatch(/\.sc-hold-focus-tag\s*\{[^}]*pointer-events: none !important;/);
    expect(css).toContain("prefers-reduced-motion");
  });

  it("tightens chrome on Hold without resizing the canvas", () => {
    const css = readTextFile("./hold-density.css");
    expect(css).toContain(".sc-band-hold .sc-tabs-bar");
    expect(css).toContain(".sc-band-hold .sc-resource-bar .sc-resource-living-glyph");
    expect(css).not.toContain("aspect-ratio");
    expect(css).not.toMatch(/\.sc-band-hold \.sc-map-canvas-container/);
    // Income stays visible on Hold outside Compact.
    expect(css).not.toMatch(/is-income\s*\{[^}]*display:\s*none/);
  });

  it("is wired into AppShell without touching theme.css", () => {
    const shell = readTextFile("../AppShell.tsx");
    expect(shell).toContain("<BandToggle band={cameraBand} onToggle={toggleCameraBand} />");
    expect(shell).toContain('<HoldFocusTag visible={cameraBand === "hold"} />');
    expect(readTextFile("../theme.css")).not.toContain("sc-band-toggle");
    expect(readTextFile("../theme.css")).not.toContain("sc-hold-focus");
  });
});
