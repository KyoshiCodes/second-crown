import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EVENT_PERIOD, EventSystem, createGameState, type GameState } from "@second-crown/sim";
import {
  HomeKeepOmenPip,
  LivingEventOmenPip,
  activePeriodEvent,
  resolveActiveOmenPalette,
} from "./LivingEventOmenPip";
import { EventNextCard } from "./EventAdvanced";
import { EventPanel } from "../EventPanel";
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

function fireAt(state: GameState, tick: number): void {
  state.meta.tick = tick;
  EventSystem.processEventsAt(state, tick);
}

describe("LivingEventOmenPip & HomeKeepOmenPip", () => {
  it("resolves activePeriodEvent from sim event log, last_event flags, and rejects stale periods", () => {
    const state = createGameState({ seed: 1 });
    const snapBefore = JSON.stringify(state);
    expect(activePeriodEvent(state)).toBeNull();
    expect(JSON.stringify(state)).toBe(snapBefore);

    fireAt(state, EVENT_PERIOD);
    const activeEv = activePeriodEvent(state);
    expect(activeEv).not.toBeNull();
    expect(activeEv?.tick).toBe(EVENT_PERIOD);

    state.meta.tick = EVENT_PERIOD + 120;
    expect(activePeriodEvent(state)?.tick).toBe(EVENT_PERIOD);

    const fallbackState = createGameState({ seed: 2 });
    fireAt(fallbackState, EVENT_PERIOD);
    delete fallbackState.flags.event_log;
    expect(activePeriodEvent(fallbackState)?.id).toBe("latest");

    state.meta.tick = 2 * EVENT_PERIOD + 5;
    expect(activePeriodEvent(state)).toBeNull();
  });

  it("renders LivingEventOmenPip idle vs active with shifting palettes and pointer-events: none", () => {
    const idleHtml = renderToStaticMarkup(<LivingEventOmenPip active={false} />);
    expect(idleHtml).toContain("sc-living-event-omen-pip is-idle");
    expect(idleHtml).toContain(`data-event-active="false"`);
    expect(idleHtml).toContain(`data-event-id="none"`);
    expect(idleHtml).toContain(`aria-hidden="true"`);
    expect(idleHtml).toContain(`pointer-events:none`);
    expect(idleHtml).not.toContain('class="sc-living-event-omen-aura"');
    expect(idleHtml).not.toContain('class="sc-living-event-omen-spark"');

    const harvestPalette = resolveActiveOmenPalette("harvest", "Bountiful harvest — +25 food");
    const spoilPalette = resolveActiveOmenPalette("spoil", "Spoilage — lost 12 food");
    const tributePalette = resolveActiveOmenPalette("tribute", "A merchant pays tribute — +10 gold");
    expect(harvestPalette.coreFill).not.toBe(spoilPalette.coreFill);
    expect(spoilPalette.coreFill).not.toBe(tributePalette.coreFill);

    const activeHtml = renderToStaticMarkup(
      <LivingEventOmenPip active={true} eventId="spoil" text="Spoilage — lost 12 food" />,
    );
    expect(activeHtml).toContain("sc-living-event-omen-pip is-active is-omen-raven is-type-spoil");
    expect(activeHtml).toContain(`data-event-active="true"`);
    expect(activeHtml).toContain(`data-event-id="spoil"`);
    expect(activeHtml).toContain(`data-omen-variant="raven"`);
    expect(activeHtml).toContain('class="sc-living-event-omen-aura"');
    expect(activeHtml).toContain('class="sc-living-event-omen-spark"');
  });

  it("integrates into EventNextCard and EventPanel without mutating GameState", () => {
    const state = createGameState({ seed: 1 });
    const beforeIdle = JSON.stringify(state);
    const idleNext = renderToStaticMarkup(<EventNextCard state={state} />);
    const idlePanel = renderToStaticMarkup(
      <EventPanel lastEvent="" lastEventTick={0} log={[]} state={state} />,
    );
    expect(JSON.stringify(state)).toBe(beforeIdle);
    expect(idleNext).toContain("sc-living-event-omen-pip is-idle");
    expect(idlePanel).toContain("sc-living-event-omen-pip is-idle");

    fireAt(state, EVENT_PERIOD);
    const ev = activePeriodEvent(state)!;
    const beforeActive = JSON.stringify(state);
    const activeNext = renderToStaticMarkup(<EventNextCard state={state} />);
    const activePanel = renderToStaticMarkup(
      <EventPanel lastEvent={ev.text} lastEventTick={ev.tick} log={[ev]} state={state} />,
    );
    expect(JSON.stringify(state)).toBe(beforeActive);
    expect(activeNext).toContain("sc-living-event-omen-pip is-active");
    expect(activeNext).toContain(`data-event-id="${ev.id}"`);
    expect(activePanel).toContain("sc-living-event-omen-pip is-active");
  });

  it("renders on the home keep in HomeKeepOmenPip and BoardLiving", () => {
    const state = createGameState({ seed: 3 });
    const homeId = state.board.homeProvinceId;

    const idleKeep = renderToStaticMarkup(
      <svg viewBox="0 0 560 360">
        <HomeKeepOmenPip state={state} />
      </svg>,
    );
    expect(idleKeep).toContain("sc-keep-omen-pip is-idle");
    expect(idleKeep).toContain(`data-home-keep-omen="true"`);
    expect(idleKeep).toContain(`data-province-id="${homeId}"`);
    expect(idleKeep).not.toContain('class="sc-keep-omen-aura"');
    expect(idleKeep).not.toContain('class="sc-keep-omen-spark"');

    fireAt(state, EVENT_PERIOD);
    const ev = activePeriodEvent(state)!;
    const activeBoard = renderToStaticMarkup(
      <BoardLiving state={state} selectedId={null} visible={true} />,
    );
    expect(activeBoard).toContain("sc-keep-omen-pip is-active");
    expect(activeBoard).toContain('class="sc-keep-omen-aura"');
    expect(activeBoard).toContain('class="sc-keep-omen-spark"');
    expect(activeBoard).toContain(`data-event-active="true"`);
    expect(activeBoard).toContain(`data-event-id="${ev.id}"`);
  });

  it("keeps CSS isolated with pointer-events: none, shift/glow keyframes, and reduced-motion support", () => {
    const css = readCssFile("./living-omen-pip.css");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("@keyframes sc-event-omen-shift");
    expect(css).toContain("@keyframes sc-event-omen-aura");
    expect(css).toContain("@keyframes sc-event-omen-shimmer");
    expect(css).toContain(".sc-living-event-omen-pip.is-active");
    expect(css).toContain(".sc-keep-omen-pip.is-active");
    expect(css).toContain(".sc-events-status-line.is-active .sc-events-status-icon");

    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-living-event-omen-pip");
    expect(theme).not.toContain("sc-keep-omen-pip");
    expect(theme).not.toContain("sc-event-omen-shift");
  });
});
