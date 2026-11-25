import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BoardFocusFrame } from "./BoardFocus";

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

describe("Board presence pass", () => {
  it("renders the edge frame and Board focus tag only on Board", () => {
    const on = renderToStaticMarkup(<BoardFocusFrame visible />);
    expect(on).toContain("sc-board-focus-edge");
    expect(on).toContain("sc-board-focus-tag");
    expect(on).toContain("Board focus");
    expect(on).toContain('aria-hidden="true"');
    expect(renderToStaticMarkup(<BoardFocusFrame visible={false} />)).toBe("");
  });

  it("keeps the overlays out of hit-testing and the canvas aspect untouched", () => {
    const css = readTextFile("./board-focus.css");
    expect(css).toMatch(/\.sc-board-focus-edge,\s*\.sc-board-focus-tag\s*\{\s*pointer-events: none !important;/);
    expect(css).not.toContain("aspect-ratio");
    expect(css).toContain("prefers-reduced-motion");
  });

  it("grows the board in the Board band and shields it from content below", () => {
    const css = readTextFile("./board-focus.css");
    expect(css).toContain(".sc-band-board .sc-map-canvas-container");
    expect(css).toContain("min(1120px");
    expect(css).toMatch(/\.sc-below-board\s*\{\s*overflow-anchor: none;/);
    expect(css).toContain(":root:not(.sc-compact)");
  });

  it("is wired into AppShell without touching theme.css", () => {
    const shell = readTextFile("../AppShell.tsx");
    expect(shell).toContain('<BoardFocusFrame visible={cameraBand === "board"} />');
    expect(shell).toContain('className="sc-below-board"');
    expect(shell).toContain('className="sc-board-frame"');
    expect(readTextFile("../theme.css")).not.toContain("sc-board-focus");
  });
});
