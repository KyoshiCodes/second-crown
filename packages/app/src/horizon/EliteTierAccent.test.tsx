import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { isEliteUnitTier } from "./horizon";
import { LongProjectBadge } from "./LongProjectBadge";
import { UnitCard } from "../hud/UnitCard";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const BASE_CARD = {
  typeId: "knight",
  name: "Knight",
  power: 25,
  cost: { food: 180, gold: 120, wood: 60 },
  ticks: 1200,
  open: true,
  lock: "",
  affordable: true,
  onTrain: () => {},
};

describe("elite unit tier helper", () => {
  it("flags only Tier IV and Tier V (and above) as elite", () => {
    expect(isEliteUnitTier(undefined)).toBe(false);
    expect(isEliteUnitTier(0)).toBe(false);
    expect(isEliteUnitTier(1)).toBe(false);
    expect(isEliteUnitTier(2)).toBe(false);
    expect(isEliteUnitTier(3)).toBe(false);
    expect(isEliteUnitTier(4)).toBe(true);
    expect(isEliteUnitTier(5)).toBe(true);
    expect(isEliteUnitTier(6)).toBe(true);
  });
});

describe("UnitCard elite tier living accent", () => {
  it("leaves omitted tier and Tiers I–III free of elite classes and rims", () => {
    for (const tier of [undefined, 1, 2, 3]) {
      const html = renderToStaticMarkup(<UnitCard {...BASE_CARD} tier={tier} />);
      expect(html).not.toContain("is-elite-tier");
      expect(html).not.toContain("data-elite-tier");
      expect(html).not.toContain("sc-unit-elite-rim");
    }
  });

  it("adds quiet Tier IV glow, rim, and phrasing-only markup", () => {
    const html = renderToStaticMarkup(<UnitCard {...BASE_CARD} tier={4} />);
    expect(html).toContain('class="sc-unit-card is-ready is-elite-tier is-tier-4"');
    expect(html).toContain('data-elite-tier="tier-4"');
    expect(html).toContain('class="sc-unit-elite-rim"');
    expect(html).not.toMatch(/<(div|p|dl)\b/);
  });

  it("adds Tier V glow and preserves is-locked when locked", () => {
    const openHtml = renderToStaticMarkup(<UnitCard {...BASE_CARD} tier={5} />);
    expect(openHtml).toContain('class="sc-unit-card is-ready is-elite-tier is-tier-5"');
    expect(openHtml).toContain('data-elite-tier="tier-5"');
    expect(openHtml).toContain('class="sc-unit-elite-rim"');

    const lockedHtml = renderToStaticMarkup(
      <UnitCard {...BASE_CARD} tier={5} open={false} lock="Requires Keep V" />,
    );
    expect(lockedHtml).toContain('class="sc-unit-card is-locked is-elite-tier is-tier-5"');
    expect(lockedHtml).toContain("disabled");
  });

  it("keeps multi-day class markers on LongProjectBadge", () => {
    const html = renderToStaticMarkup(<LongProjectBadge seconds={172_800} />);
    expect(html).toContain("sc-long-project-badge is-days is-multi-day");
    expect(html).toContain("sc-long-project-pip");
  });
});

describe("horizon-elite-tier.css isolation and safety", () => {
  const css = readTextFile("./horizon-elite-tier.css");
  const cardSrc = readTextFile("../hud/UnitCard.tsx");
  const badgeSrc = readTextFile("./LongProjectBadge.tsx");

  it("is imported from UnitCard and after horizon-pacing.css in LongProjectBadge", () => {
    expect(cardSrc).toContain('import "../horizon/horizon-elite-tier.css";');
    const pacingIdx = badgeSrc.indexOf('import "./horizon-pacing.css";');
    const eliteIdx = badgeSrc.indexOf('import "./horizon-elite-tier.css";');
    expect(pacingIdx).toBeGreaterThan(-1);
    expect(eliteIdx).toBeGreaterThan(pacingIdx);
  });

  it("supports Dusk, Night, Parchment themes, click immunity, and reduced motion", () => {
    expect(css).toContain(':root[data-chrome="dusk"]');
    expect(css).toContain(':root[data-chrome="night"]');
    expect(css).toContain(':root[data-chrome="parchment"]');
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toMatch(/\.sc-unit-elite-rim\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toMatch(/is-multi-day \.sc-long-project-pip\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toContain("@keyframes sc-unit-elite-glow-4");
    expect(css).toContain("@keyframes sc-unit-elite-glow-5");
    expect(css).toContain("@keyframes sc-long-project-multiday-breathe");
    expect(css).toContain("@keyframes sc-long-project-multiday-pip");
  });

  it("does not touch board, chat, admin, or theme dock selectors", () => {
    expect(css).not.toContain(".sc-board");
    expect(css).not.toContain(".sc-chat-float");
    expect(css).not.toContain(".sc-admin-float");
    expect(css).not.toContain(".sc-theme-dock");
  });
});
