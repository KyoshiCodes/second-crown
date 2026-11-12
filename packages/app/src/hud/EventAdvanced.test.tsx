import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, EVENT_PERIOD, EventSystem } from "@second-crown/sim";
import {
  EVENT_POSSIBLE_OUTCOMES,
  EventNextCard,
  EventOutcomeFoot,
  eventAgeLabel,
  eventOutcome,
  eventPace,
  formatEventSpan,
} from "./EventAdvanced";
import { EventCard } from "./EventCard";
import { EventPanel } from "../EventPanel";

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function stateAt(tick: number) {
  const state = createGameState({ seed: 42 });
  state.meta.tick = tick;
  return state;
}

describe("event helpers", () => {
  it("formats ticks as short times, rounding up", () => {
    expect(formatEventSpan(0)).toBe("0s");
    expect(formatEventSpan(1)).toBe("1s");
    expect(formatEventSpan(420)).toBe("42s");
    expect(formatEventSpan(1850)).toBe("3m 5s");
    expect(formatEventSpan(38400)).toBe("1h 4m");
  });

  it("pace follows the sim schedule", () => {
    const state = stateAt(1125);
    const pace = eventPace(state);
    expect(pace?.nextTick).toBe(EventSystem.nextEventTick(state));
    expect(pace?.nextTick).toBe(1500);
    expect(pace?.left).toBe(375);
    expect(pace?.elapsed).toBe(125);
    expect(pace?.fill).toBe(125 / EVENT_PERIOD);
    expect(eventPace(stateAt(1500))?.fill).toBe(0);
  });

  it("outcome reads the event id; a choice keeps it undecided", () => {
    expect(eventOutcome("harvest").kind).toBe("gain");
    expect(eventOutcome("timber").kind).toBe("gain");
    expect(eventOutcome("tribute").kind).toBe("gain");
    expect(eventOutcome("spoil").kind).toBe("loss");
    expect(eventOutcome("levy").kind).toBe("rival");
    expect(eventOutcome("latest").kind).toBe("news");
    expect(eventOutcome("harvest", 2).kind).toBe("pending");
    expect(EVENT_POSSIBLE_OUTCOMES.map((o) => o.id)).toEqual(["harvest", "timber", "tribute", "spoil", "levy"]);
  });

  it("age label needs a clock at or after the event", () => {
    expect(eventAgeLabel(undefined, 500)).toBeNull();
    expect(eventAgeLabel(400, 500)).toBeNull();
    expect(eventAgeLabel(503, 500)).toBe("just now");
    expect(eventAgeLabel(1000, 500)).toBe("50s ago");
  });
});

describe("EventNextCard", () => {
  it("shows time left, progress and possible outcomes without touching state", () => {
    const state = stateAt(1125);
    const before = JSON.stringify(state);
    const html = renderToStaticMarkup(<EventNextCard state={state} />);
    expect(JSON.stringify(state)).toBe(before);
    expect(html).toContain('data-event-next="1500"');
    expect(html).toContain("<strong>38s</strong>");
    expect(html).toContain("width:25%");
    expect(html).toContain("25% · 125 / 500 ticks");
    expect((html.match(/sc-event-hint-chip/g) ?? []).length).toBe(5);
    expect(html).not.toContain("is-soon");
  });

  it("flags the last five seconds", () => {
    expect(renderToStaticMarkup(<EventNextCard state={stateAt(1460)} />)).toContain("sc-event-next is-soon");
  });
});

describe("outcome footer", () => {
  it("renders tag, hint and age", () => {
    const html = renderToStaticMarkup(<EventOutcomeFoot eventId="spoil" eventTick={1000} nowTick={1600} />);
    expect(html).toContain("sc-event-foot is-loss");
    expect(html).toContain(">Loss<");
    expect(html).toContain("1m 0s ago");
  });

  it("EventCard keeps choices last and omits age without a clock", () => {
    const html = renderToStaticMarkup(
      <EventCard
        event={{ tick: 500, id: "tribute", text: "A merchant pays tribute — +10 gold" }}
        choices={[{ id: "a", label: "Accept", onPick: () => {} }]}
      />,
    );
    expect(html).toContain("sc-event-foot is-pending");
    expect(html).not.toContain("sc-event-age");
    expect(html.indexOf("sc-event-choices")).toBeGreaterThan(html.indexOf("sc-event-foot"));
  });

  it("EventPanel adds the countdown and ages only when it has state", () => {
    const log = [
      { tick: 500, id: "harvest", text: "Bountiful harvest — +25 food" },
      { tick: 1000, id: "levy", text: "Ashmark raises a levy — +3 militia" },
    ];
    const bare = renderToStaticMarkup(<EventPanel lastEvent="" lastEventTick={0} log={log} />);
    expect(bare).not.toContain("sc-event-next");
    expect(bare).not.toContain("sc-event-age");
    expect(bare).toContain("sc-event-foot is-rival");

    const full = renderToStaticMarkup(<EventPanel lastEvent="" lastEventTick={0} log={log} state={stateAt(1125)} />);
    expect(full.indexOf("sc-event-next")).toBeLessThan(full.indexOf("sc-event-card"));
    expect(full).toContain("13s ago");
    expect(full).toContain("1m 3s ago");
  });
});

describe("event-advanced.css", () => {
  it("lives outside theme.css and respects reduced motion", () => {
    const css = readCssFile("./event-advanced.css");
    expect(css).toContain(".sc-event-next");
    expect(css).toContain(".sc-event-foot");
    expect(css).toContain("prefers-reduced-motion");
    const theme = readCssFile("../theme.css");
    expect(theme).not.toContain("sc-event-next");
    expect(theme).not.toContain("sc-event-foot");
  });
});
