import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  EVENT_PERIOD,
  EventSystem,
  createGameState,
  getEventLog,
  isProvinceSeen,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { EventsStatusLine, currentPeriodEvent, eventsNoneText, eventsStatus } from "./EventsStatusLine";
import { KingdomTab } from "../tabs/KingdomTab";
import { ProvinceInspect } from "../ProvinceInspect";

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

/** Move the clock to `tick` and let the sim fire its event there, the way the tick engine does. */
function fireAt(s: GameState, tick: number): void {
  s.meta.tick = tick;
  EventSystem.processEventsAt(s, tick);
}

/** A crown whose first event has just fired. */
function afterFirstEvent(seed = 1): GameState {
  const s = createGameState({ seed });
  fireAt(s, EVENT_PERIOD);
  return s;
}

describe("eventsStatus", () => {
  it("says none are active on a fresh crown and counts down to the first event", () => {
    const s = createGameState({ seed: 1 });
    const st = eventsStatus(s);
    expect(st.kind).toBe("none");
    expect(st.active).toBe(0);
    expect(st.rows).toEqual([]);
    expect(st.nextSeconds).toBe(EVENT_PERIOD / TICKS_PER_SECOND);
    expect(st.text).toBe(`Events · None active · ${eventsNoneText(st.nextSeconds)}`);
  });

  it("lists the event that just fired with its full period left and the sim's effect text", () => {
    const s = afterFirstEvent();
    const ev = getEventLog(s).at(-1)!;
    const [name, effect] = ev.text.split(" — ");
    const st = eventsStatus(s);
    expect(st.kind).toBe("active");
    expect(st.active).toBe(1);
    expect(st.rows[0]).toMatchObject({
      id: ev.id,
      tick: EVENT_PERIOD,
      name,
      ticksLeft: EVENT_PERIOD,
      secondsLeft: EVENT_PERIOD / TICKS_PER_SECOND,
      effect,
    });
    expect(st.text).toBe(`Events · 1 active · ${name}, ${EVENT_PERIOD / TICKS_PER_SECOND}s left: ${effect}`);
  });

  it("takes the time left from the sim's next-event tick, rounded up", () => {
    const s = afterFirstEvent();
    for (const step of [0, 1, 9, 10, 255, 499]) {
      s.meta.tick = EVENT_PERIOD + step;
      const left = (EventSystem.nextEventTick(s) ?? 0) - s.meta.tick;
      const row = eventsStatus(s).rows[0];
      expect(row.ticksLeft).toBe(left);
      expect(row.secondsLeft).toBe(Math.ceil(left / TICKS_PER_SECOND));
      expect(row.secondsLeft).toBeGreaterThan(0);
    }
  });

  it("hands over to the next event on the tick the sim fires it", () => {
    const s = afterFirstEvent();
    s.meta.tick = 2 * EVENT_PERIOD - 1;
    expect(eventsStatus(s).rows[0].tick).toBe(EVENT_PERIOD);
    fireAt(s, 2 * EVENT_PERIOD);
    const st = eventsStatus(s);
    expect(st.active).toBe(1);
    expect(st.rows[0].tick).toBe(2 * EVENT_PERIOD);
    expect(st.rows[0].secondsLeft).toBe(EVENT_PERIOD / TICKS_PER_SECOND);
  });

  it("does not show an event from an earlier period (e.g. a stale save)", () => {
    const s = afterFirstEvent();
    s.meta.tick = 2 * EVENT_PERIOD + 30;
    expect(currentPeriodEvent(s)).toBeNull();
    expect(eventsStatus(s).kind).toBe("none");
  });

  it("falls back to the sim's last_event flags when the log is empty", () => {
    const s = afterFirstEvent();
    const text = String(s.flags.last_event);
    delete s.flags.event_log;
    const row = eventsStatus(s).rows[0];
    expect(row.name).toBe(text.split(" — ")[0]);
    expect(row.effect).toBe(text.split(" — ")[1]);
  });

  it("covers every event the sim can roll with a name and an effect", () => {
    const ids = new Set<string>();
    for (let seed = 1; seed <= 60 && ids.size < 5; seed++) {
      const s = afterFirstEvent(seed);
      const row = eventsStatus(s).rows[0];
      ids.add(row.id);
      expect(row.name.length).toBeGreaterThan(3);
      expect(row.effect).not.toBe("—");
    }
    expect([...ids].sort()).toEqual(["harvest", "levy", "spoil", "timber", "tribute"]);
  });

  it("changes nothing in the state it reads", () => {
    const s = afterFirstEvent();
    const before = JSON.stringify(s);
    eventsStatus(s);
    renderToStaticMarkup(<EventsStatusLine state={s} />);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("EventsStatusLine", () => {
  it("renders nothing without a state", () => {
    expect(renderToStaticMarkup(<EventsStatusLine state={undefined} />)).toBe("");
  });

  it("renders the quiet line with the next-event countdown when nothing is in force", () => {
    const html = renderToStaticMarkup(<EventsStatusLine state={createGameState({ seed: 1 })} />);
    expect(html).toContain('data-events-status="none"');
    expect(html).toContain('data-events-active="0"');
    expect(html).toContain("None active");
    expect(html).toContain(`Next event in ${EVENT_PERIOD / TICKS_PER_SECOND}s.`);
    expect(html).not.toContain("<button");
  });

  it("renders the active event with name, time and effect", () => {
    const s = afterFirstEvent();
    s.meta.tick += 180;
    const st = eventsStatus(s);
    const html = renderToStaticMarkup(<EventsStatusLine state={s} />);
    expect(html).toContain('data-events-status="active"');
    expect(html).toContain('data-events-active="1"');
    expect(html).toContain(`data-event="${st.rows[0].id}"`);
    expect(html).toContain(`<strong>${st.rows[0].name}</strong>`);
    expect(html).toContain("32s left");
    expect(html).toContain("sc-events-status-icon");
    expect(html).toContain(`aria-label="${st.text}"`);
    expect(html).not.toContain("<button");
  });
});

describe("EventsStatusLine mounts", () => {
  it("shows once on the Kingdom tab, right under the decrees line", () => {
    const s = afterFirstEvent();
    const html = renderToStaticMarkup(
      <KingdomTab state={s} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    const decrees = html.indexOf('class="sc-decrees-status-line');
    const line = html.indexOf('class="sc-events-status-line');
    expect(decrees).toBeGreaterThan(-1);
    expect(line).toBeGreaterThan(decrees);
    expect(html.match(/sc-events-status-line/g)?.length).toBe(1);
    expect(html).toContain(`<strong>${eventsStatus(s).rows[0].name}</strong>`);
  });

  it("shows once on the inspect card", () => {
    const s = afterFirstEvent();
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={s.board.homeProvinceId} act={() => {}} onClear={() => {}} />,
    );
    expect(html.match(/sc-events-status-line/g)?.length).toBe(1);
    expect(html).toContain('data-events-status="active"');
  });

  it("shows on the inspect card for an unseen tile too: events belong to the realm, not the tile", () => {
    const s = createGameState({ seed: 1 });
    const hidden = s.board.provinces.find((p) => !isProvinceSeen(s, p.id));
    expect(hidden).toBeDefined();
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={hidden!.id} act={() => {}} onClear={() => {}} />,
    );
    expect(html).toContain('data-events-status="none"');
  });
});

describe("events-status-line.css", () => {
  const css = readFile("./events-status-line.css");

  it("styles every class the line renders", () => {
    for (const cls of [
      "sc-events-status-line",
      "sc-events-status-icon",
      "sc-events-status-text",
      "sc-events-status-label",
      "sc-events-status-headline",
      "sc-events-status-time",
      "sc-events-status-effect",
      "sc-events-status-note",
    ]) {
      expect(css).toContain(`.${cls}`);
    }
  });

  it("keeps every selector under its own prefix and never blocks clicks", () => {
    const selectors = css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("}")
      .map((block) => block.split("{")[0].trim())
      .filter(Boolean)
      .flatMap((sel) => sel.split(",").map((x) => x.trim()));
    expect(selectors.length).toBeGreaterThan(0);
    for (const sel of selectors) expect(sel.startsWith(".sc-events-status-")).toBe(true);
    expect(css).toContain("pointer-events: none");
    expect(css).not.toContain("@keyframes");
  });

  it("is not in theme.css", () => {
    expect(readFile("../theme.css")).not.toContain("sc-events-status");
  });
});
