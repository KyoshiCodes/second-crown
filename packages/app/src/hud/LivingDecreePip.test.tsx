import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createGameState, tryDecree } from "@second-crown/sim";
import {
  HomeKeepDecreePip,
  LivingDecreePip,
  countActiveDecrees,
  firstActiveDecreeId,
} from "./LivingDecreePip";
import { WaxSealPip } from "./WaxSealPip";
import { DecreeHint } from "../DecreeHint";
import { DecreesPanel } from "../DecreesPanel";
import { BoardLiving } from "../BoardLiving";

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

const noop = () => undefined;

describe("LivingDecreePip & HomeKeepDecreePip", () => {
  it("counts active decrees and resolves firstActiveDecreeId from sim flags", () => {
    const state = createGameState({ seed: 1 });
    expect(countActiveDecrees(state)).toBe(0);
    expect(firstActiveDecreeId(state)).toBeUndefined();

    state.resources.gold = "500";
    state.resources.food = "500";
    expect(tryDecree(state, "rite")).toBe(true);
    expect(countActiveDecrees(state)).toBe(1);
    expect(firstActiveDecreeId(state)).toBe("rite");

    expect(tryDecree(state, "muster")).toBe(true);
    expect(countActiveDecrees(state)).toBe(2);
    expect(firstActiveDecreeId(state)).toBe("muster");

    state.meta.tick += 500;
    expect(countActiveDecrees(state)).toBe(0);
    expect(firstActiveDecreeId(state)).toBeUndefined();
  });

  it("renders LivingDecreePip idle vs active with glow, flicker, and pointer-events: none", () => {
    const idleHtml = renderToStaticMarkup(<LivingDecreePip active={false} count={0} />);
    expect(idleHtml).toContain("sc-living-decree-pip is-idle");
    expect(idleHtml).toContain(`data-decree-active="false"`);
    expect(idleHtml).toContain(`aria-hidden="true"`);
    expect(idleHtml).toContain(`pointer-events:none`);
    expect(idleHtml).not.toContain('class="sc-living-decree-aura"');
    expect(idleHtml).not.toContain('class="sc-living-decree-flicker"');

    const activeHtml = renderToStaticMarkup(
      <LivingDecreePip active={true} count={2} decreeId="muster" />,
    );
    expect(activeHtml).toContain("sc-living-decree-pip is-active");
    expect(activeHtml).toContain(`data-decree-active="true"`);
    expect(activeHtml).toContain(`data-decree-count="2"`);
    expect(activeHtml).toContain(`data-decree-id="muster"`);
    expect(activeHtml).toContain('class="sc-living-decree-aura"');
    expect(activeHtml).toContain('class="sc-living-decree-flicker"');
  });

  it("renders next to DecreeHint, DecreesPanel heading, and WaxSealPip active aura", () => {
    const state = createGameState({ seed: 1 });
    state.resources.gold = "500";
    state.resources.food = "500";

    const idleHint = renderToStaticMarkup(<DecreeHint state={state} />);
    expect(idleHint).toContain("sc-living-decree-pip is-idle");
    expect(idleHint).toContain(`data-decree-active="false"`);

    const idlePanel = renderToStaticMarkup(<DecreesPanel state={state} act={noop as never} />);
    expect(idlePanel).toContain("sc-living-decree-pip is-idle");

    const idleWax = renderToStaticMarkup(<WaxSealPip active={false} size={14} />);
    expect(idleWax).toContain("is-dormant");
    expect(idleWax).not.toContain('class="sc-wax-seal-aura"');

    expect(tryDecree(state, "muster")).toBe(true);

    const activeHint = renderToStaticMarkup(<DecreeHint state={state} />);
    expect(activeHint).toContain("sc-living-decree-pip is-active");
    expect(activeHint).toContain(`data-decree-count="1"`);
    expect(activeHint).toContain(`data-decree-id="muster"`);

    const activePanel = renderToStaticMarkup(<DecreesPanel state={state} act={noop as never} />);
    expect(activePanel).toContain("sc-living-decree-pip is-active");

    const activeWax = renderToStaticMarkup(<WaxSealPip active={true} size={14} />);
    expect(activeWax).toContain("is-lit");
    expect(activeWax).toContain('class="sc-wax-seal-aura"');
  });

  it("renders on the home keep in HomeKeepDecreePip and BoardLiving", () => {
    const state = createGameState({ seed: 1 });
    const homeId = state.board.homeProvinceId;

    const idleKeep = renderToStaticMarkup(
      <svg viewBox="0 0 560 360">
        <HomeKeepDecreePip state={state} />
      </svg>,
    );
    expect(idleKeep).toContain("sc-keep-decree-pip is-idle");
    expect(idleKeep).toContain(`data-home-keep-decree="true"`);
    expect(idleKeep).toContain(`data-province-id="${homeId}"`);
    expect(idleKeep).not.toContain('class="sc-keep-decree-aura"');
    expect(idleKeep).not.toContain('class="sc-keep-decree-flicker"');

    state.resources.gold = "500";
    expect(tryDecree(state, "envoys")).toBe(true);

    const activeBoard = renderToStaticMarkup(
      <BoardLiving state={state} selectedId={null} visible={true} />,
    );
    expect(activeBoard).toContain("sc-keep-decree-pip is-active");
    expect(activeBoard).toContain('class="sc-keep-decree-aura"');
    expect(activeBoard).toContain('class="sc-keep-decree-flicker"');
    expect(activeBoard).toContain(`data-decree-active="true"`);
    expect(activeBoard).toContain(`data-decree-id="envoys"`);
  });

  it("keeps CSS isolated with pointer-events: none, flicker keyframes, and reduced-motion support", () => {
    const css = readCssFile("./living-decree-pip.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("@keyframes sc-decree-pip-flicker");
    expect(css).toContain(".sc-living-decree-pip.is-active");
    expect(css).toContain(".sc-keep-decree-pip.is-active");
    expect(css).toContain(".sc-wax-seal-aura");

    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-living-decree-pip");
    expect(theme).not.toContain("sc-keep-decree-pip");
    expect(theme).not.toContain("sc-wax-seal-aura");
  });
});
