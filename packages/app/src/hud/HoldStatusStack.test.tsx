import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HoldStatusStack, holdStatusRows, type HoldStatusInput } from "./HoldStatusStack";
import { JoinHoldCard } from "../JoinHoldCard";
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

const VIEW: HoldView = {
  realmId: "join-oak-hill",
  tick: 18,
  stores: { food: "10", wood: "40.9", stone: "0", gold: "7.5" },
  militia: 2,
  training: 1,
  farms: 3,
  cottages: 0,
  lumberCamps: 1,
  stamps: [],
  pending: 0,
};

const KINDS = ["works", "stores", "stamps", "key", "leave"];

function input(over: Partial<HoldStatusInput> = {}): HoldStatusInput {
  return { view: VIEW, madeKey: null, copied: false, confirmLeave: false, ...over };
}

function row(rows: ReturnType<typeof holdStatusRows>, kind: string) {
  return rows.find((r) => r.kind === kind)!;
}

describe("holdStatusRows", () => {
  it("returns the five rows in order", () => {
    expect(holdStatusRows(input()).map((r) => r.kind)).toEqual(KINDS);
  });

  it("works row reads the four counts and training", () => {
    const rows = holdStatusRows(input());
    expect(row(rows, "works")).toMatchObject({
      value: "2 militia · 3 farms · 0 cottages · 1 lumber · +1 training",
      tone: "busy",
    });
    const idle = holdStatusRows(input({ view: { ...VIEW, training: 0 } }));
    expect(row(idle, "works")).toMatchObject({ value: "2 militia · 3 farms · 0 cottages · 1 lumber", tone: "calm" });
  });

  it("stores row floors each store like the store cards", () => {
    expect(row(holdStatusRows(input()), "stores").value).toBe("Food 10 · Wood 40 · Stone 0 · Gold 7");
    const empty = { food: "0", wood: "0.4", stone: "0", gold: "0" };
    expect(row(holdStatusRows(input({ view: { ...VIEW, stores: empty } })), "stores").tone).toBe("none");
  });

  it("stamps row shows count and the newest stamp", () => {
    expect(row(holdStatusRows(input()), "stamps")).toMatchObject({ value: "None yet", tone: "none" });
    const stamps = [{ tick: 3, by: "ann" }, { tick: 9, by: "bo" }];
    expect(row(holdStatusRows(input({ view: { ...VIEW, stamps } })), "stamps")).toMatchObject({
      value: "2 · last tick 9 by bo",
      tone: "you",
    });
  });

  it("key row follows the one-time key card and never repeats the key", () => {
    expect(row(holdStatusRows(input()), "key").value).toBe("Joined with key");
    const shown = row(holdStatusRows(input({ madeKey: "secret-key" })), "key");
    expect(shown).toMatchObject({ tone: "warn" });
    expect(shown.value).not.toContain("secret-key");
    expect(row(holdStatusRows(input({ madeKey: "secret-key", copied: true })), "key").value).toBe("New key copied");
  });

  it("leave row follows the confirm card", () => {
    expect(row(holdStatusRows(input()), "leave").tone).toBe("calm");
    expect(row(holdStatusRows(input({ confirmLeave: true })), "leave")).toMatchObject({ tone: "warn" });
  });

  it("does not mutate the view", () => {
    const v = { ...VIEW, stamps: [{ tick: 1, by: "x" }] };
    const before = JSON.stringify(v);
    holdStatusRows(input({ view: v, madeKey: "k", copied: true, confirmLeave: true }));
    expect(JSON.stringify(v)).toBe(before);
  });
});

describe("HoldStatusStack", () => {
  it("renders a dl with one row per kind", () => {
    const html = renderToStaticMarkup(<HoldStatusStack {...input()} />);
    expect(html).toContain('class="sc-holdstat"');
    for (const k of KINDS) expect(html).toContain(`is-${k}`);
  });

  it("sits in JoinHoldCard between the status card and the actions, buttons intact", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} initialView={VIEW} />);
    const stack = html.indexOf("sc-holdstat");
    expect(stack).toBeGreaterThan(html.indexOf('aria-label="Hold status"'));
    expect(stack).toBeLessThan(html.indexOf('aria-label="Hold actions"'));
    for (const b of ["Train militia", "Build farm", "Build lumber camp", "Build cottage", ">Stamp<", ">Leave<"]) {
      expect(html).toContain(b);
    }
  });

  it("shows the confirm-open leave row when the card opens with confirm leave", () => {
    const html = renderToStaticMarkup(
      <JoinHoldCard signedIn={true} intentLines={[]} initialView={VIEW} initialConfirmLeave={true} />
    );
    expect(html).toContain("Confirm open · hold keeps running");
  });

  it("is absent before joining", () => {
    const html = renderToStaticMarkup(<JoinHoldCard signedIn={true} intentLines={[]} />);
    expect(html).not.toContain("sc-holdstat");
  });

  it("css lives in its own file, not theme.css, and honours reduced motion", () => {
    expect(readCssFile("./hold-status-stack.css")).toContain("prefers-reduced-motion");
    expect(readCssFile("../theme.css")).not.toContain("sc-holdstat");
  });
});
