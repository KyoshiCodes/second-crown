import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, DECREES } from "@second-crown/sim";
import { DecreeHint, DecreeSealPip, decreeCostText, nextDecree } from "./DecreeHint";

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

function swear(state: ReturnType<typeof createGameState>, id: string) {
  state.flags[`decree_${id}_until`] = state.meta.tick + 100;
}

describe("decreeCostText", () => {
  it("reads costs straight from the sim decree table", () => {
    expect(decreeCostText(DECREES[0])).toBe("40 gold");
    expect(decreeCostText(DECREES[1])).toBe("50 food");
  });
});

describe("DecreeHint", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<DecreeHint state={undefined} />)).toBe("");
  });

  it("names the first decree the stores can cover and includes living seal", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "0";
    s.resources.food = "60";
    expect(nextDecree(s)).toEqual({ decree: DECREES[1], ready: true });
    const html = renderToStaticMarkup(<DecreeHint state={s} />);
    expect(html).toContain(DECREES[1].name);
    expect(html).toContain("50 food");
    expect(html).toContain("is-ready");
    expect(html).toContain('data-decree-seal="rite"');
    expect(html).toContain('class="sc-decree-seal-aura"');
  });

  it("falls back to the first open decree when nothing is affordable", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "0";
    s.resources.food = "0";
    expect(nextDecree(s)).toEqual({ decree: DECREES[0], ready: false });
    const html = renderToStaticMarkup(<DecreeHint state={s} />);
    expect(html).toContain("40 gold");
    expect(html).toContain("not enough in stores");
    expect(html).toContain('data-decree-seal="muster"');
    expect(html).toContain("is-locked");
    expect(html).not.toContain("sc-decree-seal-aura");
  });

  it("skips active decrees and says when all are sworn", () => {
    const s = createGameState({ seed: 1 });
    s.resources.gold = "999";
    s.resources.food = "999";
    swear(s, "muster");
    expect(nextDecree(s)?.decree.id).toBe("rite");
    for (const d of DECREES) swear(s, d.id);
    expect(nextDecree(s)).toBeNull();
    const html = renderToStaticMarkup(<DecreeHint state={s} />);
    expect(html).toContain("every decree already sworn");
    expect(html).toContain('data-decree-seal="done"');
    expect(html).toContain("is-done");
  });
});

describe("DecreeSealPip Living Treatment", () => {
  it("renders ready state with breathing aura, decree charge, and apex glint", () => {
    const html = renderToStaticMarkup(<DecreeSealPip decreeId="muster" ready={true} />);
    expect(html).toContain('class="sc-decree-seal-aura"');
    expect(html).toContain("sc-decree-seal-star");
    expect(html).toContain("is-muster");
    expect(html).toContain('data-ready="true"');
    expect(html).toContain('style="width:16px;height:16px;pointer-events:none"');
    expect(html).toContain('aria-hidden="true"');
  });

  it("renders locked state with deep carmine wax and no aura", () => {
    const html = renderToStaticMarkup(<DecreeSealPip decreeId="rite" ready={false} />);
    expect(html).not.toContain("sc-decree-seal-aura");
    expect(html).not.toContain("sc-decree-seal-star");
    expect(html).toContain("is-locked");
    expect(html).toContain("is-rite");
    expect(html).toContain('data-ready="false"');
  });

  it("renders done state with imperial triumph crown signet and golden ribbons", () => {
    const html = renderToStaticMarkup(<DecreeSealPip isDone={true} />);
    expect(html).toContain("is-done");
    expect(html).toContain('data-decree-seal="done"');
    expect(html).not.toContain("sc-decree-seal-aura");
  });
});

describe("Decree seal styles and CSS isolation", () => {
  it("enforces pointer-events: none !important and provides living keyframes", () => {
    const css = readCssFile("./decree-hint.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@keyframes sc-decree-seal-float");
    expect(css).toContain("@keyframes sc-decree-seal-breathe");
    expect(css).toContain("@keyframes sc-decree-seal-twinkle");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("does not leak into theme.css", () => {
    const theme = readCssFile("./theme.css");
    expect(theme).not.toContain("sc-decree-seal");
    expect(theme).not.toContain("sc-decree-hint");
  });
});
