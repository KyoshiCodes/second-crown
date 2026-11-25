import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { applyOfflineProgress, createGameState, pushWorldLog, RESEARCH, storageCap, type GameState } from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { AWAY_MIN_TICKS, awayNextStep, buildAwaySummary, snapshotForAway } from "./awaySummary";
import { AwaySummaryBanner } from "../hud/AwaySummary";

const T0 = 1_700_000_000_000;

function realm(): GameState {
  const s = createGameState({ seed: 7, now: T0, withStarterBuildings: true });
  s.resources.food = "50";
  s.resources.wood = "40";
  return s;
}

describe("snapshotForAway", () => {
  it("is a pure read: taking it leaves the state as it was", () => {
    const s = realm();
    const firstId = Object.keys(RESEARCH)[0];
    s.flags[`research_${firstId}_until`] = 1; // finished by tick, flag not yet written
    s.meta.tick = 5;
    const json = JSON.stringify(s);
    const snap = snapshotForAway(s);
    expect(JSON.stringify(s)).toBe(json);
    expect(snap.studies).toContain(firstId);
    expect(snap.tick).toBe(5);
  });
});

describe("buildAwaySummary", () => {
  it("names settled time, finished works and studies, and store changes after real offline settlement", () => {
    const s = realm();
    const farm = s.buildings.find((b) => b.realmId === "player" && b.typeId !== "keep")!;
    farm.completesAtTick = s.meta.tick + 50;
    const studyId = Object.keys(RESEARCH)[0] as keyof typeof RESEARCH;
    s.flags[`research_${studyId}_until`] = s.meta.tick + 100;
    s.flags[`research_${studyId}_total`] = 100;
    const before = snapshotForAway(s);
    const settled = applyOfflineProgress(s, T0 + 2 * 60 * 60 * 1000);
    expect(settled).toBe(2 * 60 * 60 * TICKS_PER_SECOND);
    const sum = buildAwaySummary(before, s, settled);
    expect(sum.elapsed).toBe("2h");
    expect(sum.works.some((w) => w.endsWith("built"))).toBe(true);
    expect(sum.studies).toContain(RESEARCH[studyId].name);
    expect(sum.changes.length).toBeGreaterThan(0);
    expect(sum.changes.length).toBeLessThanOrEqual(4);
  });

  it("lists only player-relevant ledger lines written after the snapshot, newest first, three at most", () => {
    const s = realm();
    s.meta.tick = 100;
    pushWorldLog(s, "raid", "Old raid before you left");
    const before = snapshotForAway(s);
    const lines: [string, string][] = [
      ["trade", "A trades caravans with B"],
      ["raid", "Ashford marches on your hold"],
      ["declare", "Ashford makes war on Brin"],
      ["declare", "Ashford declares war on Your Crown"],
      ["battle", "Your Crown held the field against Ashford."],
      ["march", "Sally drove the column off."],
    ];
    lines.forEach(([kind, text], i) => {
      s.meta.tick = 200 + i;
      pushWorldLog(s, kind, text);
    });
    const sum = buildAwaySummary(before, s, AWAY_MIN_TICKS);
    expect(sum.events).toEqual([
      "Sally drove the column off.",
      "Your Crown held the field against Ashford.",
      "Ashford declares war on Your Crown",
    ]);
    expect(sum.moreEvents).toBe(1);
  });

  it("reports full stores, ended player wars and a net troop loss", () => {
    const s = realm();
    s.units.push({ id: "u-test", typeId: "militia", realmId: "player", count: "10" } as GameState["units"][number]);
    s.wars.push({ id: "w-test", attackerRealmId: "rival", defenderRealmId: "player", status: "active", startedTick: 0 } as GameState["wars"][number]);
    const before = snapshotForAway(s);
    s.units.find((u) => u.id === "u-test")!.count = "6";
    s.wars.find((w) => w.id === "w-test")!.status = "defender_won";
    s.resources.wood = String(storageCap(s, "wood"));
    const sum = buildAwaySummary(before, s, AWAY_MIN_TICKS);
    expect(sum.full).toContain("wood");
    expect(sum.events[0]).toMatch(/^Troops down 4/);
    expect(sum.events.some((e) => / won$/.test(e))).toBe(true);
  });
});

describe("awayNextStep", () => {
  it("names a food deficit first when nothing marches on the hold", () => {
    const s = realm();
    const rates = { rate: { food: -2 }, have: { food: 10 }, cap: { food: 500 } };
    expect(awayNextStep(s, rates)).toBe("Food −2/s after upkeep. Raise farms or trim the army.");
  });
});

describe("AwaySummaryBanner", () => {
  it("renders the head, only non-empty rows, the next step, and a dismiss button", () => {
    const html = renderToStaticMarkup(
      <AwaySummaryBanner
        summary={{ elapsed: "3h", works: ["Farm built"], studies: [], events: [], moreEvents: 0, changes: ["+300 food"], full: ["wood"], next: "Start it." }}
        onDismiss={() => {}}
      />,
    );
    expect(html).toContain("While you were away");
    expect(html).toContain("3h settled");
    expect(html).toContain('data-away-row="works"');
    expect(html).not.toContain('data-away-row="studies"');
    expect(html).toContain("+300 food · full: wood");
    expect(html).toContain('data-away-row="next"');
    expect(html).toContain("Dismiss away summary");
  });

  it("renders nothing without a summary", () => {
    expect(renderToStaticMarkup(<AwaySummaryBanner summary={null} onDismiss={() => {}} />)).toBe("");
  });
});
