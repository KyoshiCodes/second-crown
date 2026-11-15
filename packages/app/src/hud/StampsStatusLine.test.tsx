import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { createGameState, isProvinceSeen, listStamps, serializeState, tryStamp } from "@second-crown/sim";
import type { HoldView } from "../net/hold";
import { getHoldViewSnapshot, publishHoldView, subscribeHoldView } from "./holdWatch";
import {
  STAMPS_LISTED,
  STAMP_EFFECT_TEXT,
  STAMP_REMAINING_TEXT,
  StampsStatusLine,
  stampsStatus,
} from "./StampsStatusLine";
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

function hold(over: Partial<HoldView> = {}): HoldView {
  return {
    realmId: "join-oak-hill",
    tick: 100,
    stores: { food: "50", wood: "40", stone: "30", gold: "20" },
    militia: 0,
    training: 0,
    farms: 0,
    cottages: 0,
    lumberCamps: 0,
    stamps: [],
    pending: 0,
    ...over,
  };
}

afterEach(() => publishHoldView(null));

describe("stampsStatus: no hold", () => {
  it("says no shared hold is joined and where to join one", () => {
    const s = stampsStatus(null);
    expect(s.kind).toBe("solo");
    expect(s.realm).toBeNull();
    expect(s.active).toBe(0);
    expect(s.rows).toEqual([]);
    expect(s.text).toBe(
      "Stamps · No shared hold joined · Stamps exist only in a shared hold. Join one on the Cloud panel.",
    );
  });
});

describe("stampsStatus: a hold with no stamps", () => {
  it("names the hold without the join- prefix and says none are active", () => {
    const s = stampsStatus(hold());
    expect(s.kind).toBe("empty");
    expect(s.realm).toBe("oak-hill");
    expect(s.headline).toBe("None active");
    expect(s.text).toContain("Stamps · Hold oak-hill · None active");
    expect(s.text).toContain(`Effect: ${STAMP_EFFECT_TEXT}`);
  });

  it("shows a stamp that is sent but has not landed yet", () => {
    const s = stampsStatus(hold({ pending: 2 }));
    expect(s.pending).toBe(2);
    expect(s.text).toContain("None active · 2 landing on the next tick");
  });
});

describe("stampsStatus: a hold with stamps", () => {
  const view = hold({
    tick: 100,
    stamps: [
      { tick: 6, by: "guest_alice" },
      { tick: 99, by: "guest_bob" },
      { tick: 100, by: "guest_alice" },
    ],
  });

  it("counts every stamp as active and lists them newest first with who and when", () => {
    const s = stampsStatus(view);
    expect(s.kind).toBe("active");
    expect(s.active).toBe(3);
    expect(s.headline).toBe("3 active");
    expect(s.rows.map((r) => r.by)).toEqual(["guest_alice", "guest_bob", "guest_alice"]);
    expect(s.rows.map((r) => r.tick)).toEqual([100, 99, 6]);
    expect(s.rows.map((r) => r.age)).toEqual([0, 1, 94]);
    expect(s.rows.map((r) => r.text)).toEqual([
      "guest_alice at tick 100 (this tick)",
      "guest_bob at tick 99 (1 tick ago)",
      "guest_alice at tick 6 (94 ticks ago)",
    ]);
    expect(s.older).toBe(0);
  });

  it("states the remaining time and the effect as the sim has them: no timer, no effect", () => {
    const s = stampsStatus(view);
    expect(s.text).toContain(`Remaining: ${STAMP_REMAINING_TEXT}`);
    expect(s.text).toContain(`Effect: ${STAMP_EFFECT_TEXT}`);
    expect(STAMP_REMAINING_TEXT).toContain("no time limit");
    expect(STAMP_EFFECT_TEXT.startsWith("none")).toBe(true);
  });

  it("lists at most five and counts the rest as older", () => {
    const stamps = Array.from({ length: 8 }, (_, i) => ({ tick: 10 + i, by: `guest_${i}` }));
    const s = stampsStatus(hold({ tick: 50, stamps }));
    expect(s.active).toBe(8);
    expect(s.rows.length).toBe(STAMPS_LISTED);
    expect(s.rows[0].by).toBe("guest_7");
    expect(s.rows[4].by).toBe("guest_3");
    expect(s.older).toBe(3);
    expect(s.text).toContain(", +3 older · Remaining:");
  });

  it("never shows a negative age when a stamp's tick is ahead of the view", () => {
    const s = stampsStatus(hold({ tick: 5, stamps: [{ tick: 9, by: "guest_alice" }] }));
    expect(s.rows[0].age).toBe(0);
  });

  it("does not change the view it reads", () => {
    const before = JSON.stringify(view);
    stampsStatus(view);
    renderToStaticMarkup(<StampsStatusLine view={view} />);
    expect(JSON.stringify(view)).toBe(before);
  });
});

describe("the sim's stamp still has no timer and no effect", () => {
  it("a stamp adds one input log record and nothing else", () => {
    const s = createGameState({ seed: 1 });
    const log = s.inputLog.length;
    const strip = (json: string) => {
      const o = JSON.parse(json) as { inputLog?: unknown };
      delete o.inputLog;
      return JSON.stringify(o);
    };
    const before = strip(serializeState(s));
    expect(tryStamp(s, "guest_alice")).toBe(true);
    expect(s.inputLog.length).toBe(log + 1);
    expect(strip(serializeState(s))).toBe(before);
    expect(listStamps(s)).toEqual([{ tick: s.meta.tick, by: "guest_alice" }]);
  });

  it("a stamp record is only a tick and a name: if this fails, update the Remaining and Effect texts", () => {
    const src = readFile("../../../sim/src/actions/stamp.ts");
    expect(src).toContain("export type Stamp = { tick: number; by: string };");
    expect(src).not.toMatch(/expires|duration|until|effect|bonus/i);
  });
});

describe("holdWatch", () => {
  it("starts empty, publishes to subscribers, and stops after unsubscribe", () => {
    expect(getHoldViewSnapshot()).toBeNull();
    let calls = 0;
    const off = subscribeHoldView(() => calls++);
    const v = hold();
    publishHoldView(v);
    expect(getHoldViewSnapshot()).toBe(v);
    expect(calls).toBe(1);
    publishHoldView(v);
    expect(calls).toBe(1);
    publishHoldView(null);
    expect(calls).toBe(2);
    off();
    publishHoldView(v);
    expect(calls).toBe(2);
  });

  it("the Join hold card publishes its view, clears it on unmount, and never publishes the key", () => {
    const card = readFile("../JoinHoldCard.tsx");
    expect(card).toContain("publishHoldView(view);");
    expect(card).toContain("React.useEffect(() => () => publishHoldView(null), []);");
    expect(card).not.toMatch(/publishHoldView\([^)]*[kK]ey/);
    expect(readFile("./holdWatch.ts")).not.toMatch(/localStorage|fetch\(/);
  });
});

describe("StampsStatusLine markup", () => {
  it("renders the solo line when no hold is joined", () => {
    const html = renderToStaticMarkup(<StampsStatusLine />);
    expect(html).toContain("sc-stamps-status-line is-solo");
    expect(html).toContain('data-stamps-status="solo"');
    expect(html).toContain("No shared hold joined");
    expect(html).not.toContain("sc-stamps-status-effect");
    expect(html).not.toContain("<button");
  });

  it("follows the hold the Join hold card published", () => {
    publishHoldView(hold({ stamps: [{ tick: 90, by: "guest_bob" }] }));
    const html = renderToStaticMarkup(<StampsStatusLine />);
    expect(html).toContain("sc-stamps-status-line is-active");
    expect(html).toContain('data-stamps-active="1"');
    expect(html).toContain("<strong>oak-hill</strong>");
    expect(html).toContain("guest_bob at tick 90 (10 ticks ago)");
  });

  it("renders the count, each stamp, the remaining time and the effect, with no button", () => {
    const view = hold({ pending: 1, stamps: [{ tick: 6, by: "guest_alice" }, { tick: 40, by: "guest_bob" }] });
    const html = renderToStaticMarkup(<StampsStatusLine view={view} />);
    expect(html).toContain('<span class="sc-stamps-status-headline">2 active</span>');
    expect(html).toContain('<span class="sc-stamps-status-pending">1 landing on the next tick</span>');
    expect(html.match(/class="sc-stamps-status-stamp"/g)?.length).toBe(2);
    expect(html.indexOf("guest_bob at tick 40")).toBeLessThan(html.indexOf("guest_alice at tick 6"));
    expect(html).toContain(`Remaining: ${STAMP_REMAINING_TEXT}`);
    expect(html).toContain("Effect: none, a stamp is a mark in the hold");
    expect(html).toContain("data-hold-stamp-pip");
    expect(html).not.toContain("<button");
  });

  it("an explicit null view wins over a published hold", () => {
    publishHoldView(hold({ stamps: [{ tick: 1, by: "guest_alice" }] }));
    expect(renderToStaticMarkup(<StampsStatusLine view={null} />)).toContain("is-solo");
  });

  it("puts the same words in the label as in the status text", () => {
    const view = hold({ stamps: [{ tick: 6, by: "guest_alice" }] });
    const html = renderToStaticMarkup(<StampsStatusLine view={view} />);
    expect(html).toContain("aria-label=\"Stamps · Hold oak-hill · 1 active · guest_alice at tick 6 (94 ticks ago)");
  });
});

describe("where the line shows", () => {
  it("shows once on the Kingdom tab, under the prestige rank line", () => {
    publishHoldView(hold({ stamps: [{ tick: 6, by: "guest_alice" }] }));
    const s = createGameState({ seed: 1 });
    const html = renderToStaticMarkup(
      <KingdomTab state={s} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    const culture = html.indexOf('class="sc-culture-status-line');
    const stamps = html.indexOf('class="sc-stamps-status-line');
    expect(culture).toBeGreaterThan(-1);
    expect(stamps).toBeGreaterThan(culture);
    expect(html.match(/class="sc-stamps-status-line/g)?.length).toBe(1);
    expect(html).toContain("guest_alice at tick 6 (94 ticks ago)");
  });

  it("shows once on the inspect card, for seen and unseen tiles alike", () => {
    const s = createGameState({ seed: 1 });
    const hidden = s.board.provinces.find((p) => !isProvinceSeen(s, p.id));
    expect(hidden).toBeDefined();
    for (const id of [s.board.homeProvinceId, hidden!.id]) {
      const html = renderToStaticMarkup(
        <ProvinceInspect state={s} selectedId={id} act={() => {}} onClear={() => {}} />,
      );
      expect(html.match(/class="sc-stamps-status-line/g)?.length).toBe(1);
      expect(html).toContain('data-stamps-status="solo"');
    }
  });
});

describe("stamps-status-line.css", () => {
  const css = readFile("./stamps-status-line.css");

  it("styles every class the line renders", () => {
    for (const cls of [
      "sc-stamps-status-line",
      "sc-stamps-status-icon",
      "sc-stamps-status-text",
      "sc-stamps-status-label",
      "sc-stamps-status-headline",
      "sc-stamps-status-pending",
      "sc-stamps-status-note",
      "sc-stamps-status-older",
      "sc-stamps-status-remaining",
      "sc-stamps-status-effect",
    ]) {
      expect(css).toContain(`.${cls}`);
    }
  });

  it("is scoped to the line, has no animation, and keeps the pip click-through", () => {
    const selectors = css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("}")
      .map((block) => block.split("{")[0].trim())
      .filter(Boolean);
    for (const sel of selectors) {
      for (const part of sel.split(",")) expect(part.trim().startsWith(".sc-stamps-status-")).toBe(true);
    }
    expect(css).not.toMatch(/animation|@keyframes|transition/);
    expect(css).toMatch(/\.sc-stamps-status-icon\s*\{[^}]*pointer-events:\s*none/);
  });
});
