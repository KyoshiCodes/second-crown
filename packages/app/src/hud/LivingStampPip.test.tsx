import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createGameState } from "@second-crown/sim";
import {
  HomeKeepStampPip,
  LivingStampPip,
  countActiveStamps,
} from "./LivingStampPip";
import { HoldStatusStack } from "./HoldStatusStack";
import { JoinHoldCard } from "../JoinHoldCard";
import { BoardLiving } from "../BoardLiving";
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
  realmId: "join-oak-hill",
  tick: 18,
  stores: { food: "10", wood: "0", stone: "0", gold: "0" },
  militia: 0,
  training: 0,
  farms: 0,
  cottages: 0,
  lumberCamps: 0,
  stamps: [],
  pending: 0,
};

describe("LivingStampPip & HomeKeepStampPip", () => {
  it("counts active stamps from inputLog", () => {
    const state = createGameState();
    expect(countActiveStamps(state)).toBe(0);
    state.inputLog.push({ tick: 10, type: "stamp", issuerId: "guest_1", payload: {} });
    state.inputLog.push({ tick: 12, type: "stamp", issuerId: "guest_2", payload: {} });
    expect(countActiveStamps(state)).toBe(2);
  });

  it("renders LivingStampPip idle vs active with pointer-events: none", () => {
    const idleHtml = renderToStaticMarkup(<LivingStampPip active={false} count={0} />);
    expect(idleHtml).toContain("sc-living-stamp-pip is-idle");
    expect(idleHtml).toContain(`data-stamp-active="false"`);
    expect(idleHtml).toContain(`aria-hidden="true"`);
    expect(idleHtml).toContain(`pointer-events:none`);
    expect(idleHtml).not.toContain("sc-living-stamp-aura");

    const activeHtml = renderToStaticMarkup(<LivingStampPip active={true} count={2} />);
    expect(activeHtml).toContain("sc-living-stamp-pip is-active");
    expect(activeHtml).toContain(`data-stamp-active="true"`);
    expect(activeHtml).toContain(`data-stamp-count="2"`);
    expect(activeHtml).toContain("sc-living-stamp-aura");
  });

  it("renders next to the stamps line in HoldStatusStack and JoinHoldCard", () => {
    const idleStack = renderToStaticMarkup(
      <HoldStatusStack view={BASE_VIEW} madeKey={null} copied={false} confirmLeave={false} />,
    );
    expect(idleStack).toContain("sc-living-stamp-pip is-idle");

    const activeView: HoldView = { ...BASE_VIEW, stamps: [{ tick: 14, by: "sera" }] };
    const activeStack = renderToStaticMarkup(
      <HoldStatusStack view={activeView} madeKey={null} copied={false} confirmLeave={false} />,
    );
    expect(activeStack).toContain("sc-living-stamp-pip is-active");
    expect(activeStack).toContain(`data-stamp-count="1"`);

    const cardHtml = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} intentLines={[]} initialView={activeView} />,
    );
    expect(cardHtml).toContain("sc-hold-stamps-heading");
    expect(cardHtml).toContain("sc-living-stamp-pip is-active");
  });

  it("renders on the home keep in HomeKeepStampPip and BoardLiving", () => {
    const state = createGameState();
    const homeId = state.board.homeProvinceId;

    const idleKeep = renderToStaticMarkup(
      <svg viewBox="0 0 560 360">
        <HomeKeepStampPip state={state} />
      </svg>,
    );
    expect(idleKeep).toContain("sc-keep-stamp-pip is-idle");
    expect(idleKeep).toContain(`data-home-keep-stamp="true"`);
    expect(idleKeep).toContain(`data-province-id="${homeId}"`);
    expect(idleKeep).not.toContain('class="sc-keep-stamp-aura"');

    state.inputLog.push({ tick: 20, type: "stamp", issuerId: "guest_1", payload: {} });
    const activeBoard = renderToStaticMarkup(
      <BoardLiving state={state} selectedId={null} visible={true} />,
    );
    expect(activeBoard).toContain("sc-keep-stamp-pip is-active");
    expect(activeBoard).toContain('class="sc-keep-stamp-aura"');
    expect(activeBoard).toContain(`data-stamp-active="true"`);
  });

  it("keeps CSS isolated with pointer-events: none and reduced-motion support", () => {
    const css = readCssFile("./living-stamp-pip.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain(".sc-living-stamp-pip.is-active");
    expect(css).toContain(".sc-keep-stamp-pip.is-active");
  });
});
