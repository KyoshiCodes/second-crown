import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createGameState } from "@second-crown/sim";
import {
  batchCostTotal,
  costBracket,
  formatHorizon,
  formatTicksHorizon,
  horizonBracket,
  isLongHorizon,
  paceStage,
  unitBracketNote,
  unitTierLabel,
} from "./horizon";
import { HorizonBadge, HorizonTime, PaceLine, UnitTierNote, summarizePace } from "./HorizonTime";

describe("formatHorizon", () => {
  it("keeps short timers as seconds", () => {
    expect(formatHorizon(0)).toBe("0s");
    expect(formatHorizon(-5)).toBe("0s");
    expect(formatHorizon(1)).toBe("1s");
    expect(formatHorizon(9.2)).toBe("10s");
    expect(formatHorizon(59)).toBe("59s");
  });
  it("uses minutes and seconds under an hour", () => {
    expect(formatHorizon(60)).toBe("1m");
    expect(formatHorizon(90)).toBe("1m 30s");
    expect(formatHorizon(3599)).toBe("59m 59s");
  });
  it("uses hours and minutes under a day", () => {
    expect(formatHorizon(3600)).toBe("1h");
    expect(formatHorizon(12_000)).toBe("3h 20m");
    expect(formatHorizon(86_399)).toBe("23h 59m");
  });
  it("uses days and hours from a day up", () => {
    expect(formatHorizon(86_400)).toBe("1d");
    expect(formatHorizon(187_200)).toBe("2d 4h");
    expect(formatHorizon(40 * 86_400 + 3 * 3600 + 59)).toBe("40d 3h");
  });
  it("reads ticks at 10 per second", () => {
    expect(formatTicksHorizon(100)).toBe("10s");
    expect(formatTicksHorizon(36_000)).toBe("1h");
  });
});

describe("brackets", () => {
  it("sorts waits into bands", () => {
    expect(horizonBracket(30)).toBe("seconds");
    expect(horizonBracket(600)).toBe("minutes");
    expect(horizonBracket(7200)).toBe("hours");
    expect(horizonBracket(90_000)).toBe("days");
    expect(isLongHorizon(3599)).toBe(false);
    expect(isLongHorizon(3600)).toBe(true);
  });
  it("labels unit tiers and cost bands", () => {
    expect(unitTierLabel(1)).toBe("Tier I");
    expect(unitTierLabel(3)).toBe("Tier III");
    expect(unitTierLabel(undefined)).toBe("Tier I");
    expect(batchCostTotal({ food: "4", wood: "1" }, 10)).toBe(50);
    expect(costBracket(49)).toBe("standard");
    expect(costBracket(50)).toBe("costly");
    expect(costBracket(200)).toBe("steep");
  });
  it("notes only higher brackets", () => {
    expect(unitBracketNote({ costTotal: 5, seconds: 2 })).toBeNull();
    expect(unitBracketNote({ costTotal: 120, seconds: 2 })).toBe("Higher bracket · costly batch");
    expect(unitBracketNote({ costTotal: 300, seconds: 7200 })).toBe("Higher bracket · steep cost · hours-long drill");
    expect(unitBracketNote({ costTotal: 5, seconds: 90 })).toBe("Higher bracket · long drill");
  });
});

describe("paceStage", () => {
  it("is early at a low keep with few studies", () => {
    expect(paceStage({ keep: 0, known: 0, total: 16 })).toBe("early");
    expect(paceStage({ keep: 1, known: 5, total: 16 })).toBe("early");
  });
  it("is mid between", () => {
    expect(paceStage({ keep: 2, known: 0, total: 16 })).toBe("mid");
    expect(paceStage({ keep: 1, known: 6, total: 16 })).toBe("mid");
  });
  it("is late at Keep IV or two thirds of studies", () => {
    expect(paceStage({ keep: 4, known: 0, total: 16 })).toBe("late");
    expect(paceStage({ keep: 1, known: 11, total: 16 })).toBe("late");
  });
});

describe("horizon components", () => {
  it("renders long-form time with a bracket and exact tooltip", () => {
    const html = renderToStaticMarkup(<HorizonTime seconds={12_000} />);
    expect(html).toContain("3h 20m");
    expect(html).toContain('data-horizon="hours"');
    expect(html).toContain("12,000 seconds");
  });
  it("shows the badge only for hour-plus waits", () => {
    expect(renderToStaticMarkup(<HorizonBadge seconds={600} />)).toBe("");
    expect(renderToStaticMarkup(<HorizonBadge seconds={90_000} />)).toContain("days");
  });
  it("renders tier and note", () => {
    const html = renderToStaticMarkup(<UnitTierNote tier={2} note="Higher bracket · costly batch" />);
    expect(html).toContain("Tier II");
    expect(html).toContain("is-higher");
    expect(html).toContain("costly batch");
  });
  it("reads pace from a fresh state", () => {
    const state = createGameState({ seed: 1 });
    const p = summarizePace(state);
    expect(p.total).toBeGreaterThan(0);
    expect(p.known).toBe(0);
    const html = renderToStaticMarkup(<PaceLine state={state} />);
    expect(html).toContain("Current pace:");
    expect(html).toContain(`data-pace="${p.stage}"`);
    expect(renderToStaticMarkup(<PaceLine state={undefined} />)).toBe("");
  });
});
