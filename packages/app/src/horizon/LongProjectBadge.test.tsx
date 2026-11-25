import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import {
  HOUR,
  LONG_PROJECT_SECONDS,
  isLongProject,
  pacingTier,
  pacingTooltip,
} from "./horizon";
import { HorizonBadge, HorizonTime } from "./HorizonTime";
import { LongProjectBadge } from "./LongProjectBadge";
import { RaiseImproveFold } from "../hud/RaiseImproveFold";
import { ResearchBar } from "../ResearchBar";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function studyCard(html: string, id: string): string {
  const start = html.indexOf(`data-study="${id}"`);
  expect(start).toBeGreaterThan(-1);
  const next = html.indexOf("data-study=", start + 1);
  return html.slice(start, next === -1 ? undefined : next);
}

describe("long-project pacing helpers", () => {
  it("marks waits >= 4 hours as long projects", () => {
    expect(LONG_PROJECT_SECONDS).toBe(4 * HOUR);
    expect(isLongProject(0)).toBe(false);
    expect(isLongProject(3600)).toBe(false);
    expect(isLongProject(LONG_PROJECT_SECONDS - 1)).toBe(false);
    expect(isLongProject(LONG_PROJECT_SECONDS)).toBe(true);
    expect(isLongProject(172_800)).toBe(true);
  });

  it("classifies pacing tiers cleanly", () => {
    expect(pacingTier(45)).toBe("short");
    expect(pacingTier(600)).toBe("short");
    expect(pacingTier(3600)).toBe("extended");
    expect(pacingTier(LONG_PROJECT_SECONDS)).toBe("long-project");
    expect(pacingTier(86_400)).toBe("multi-day");
  });

  it("enriches hour and day tooltips while preserving exact seconds", () => {
    expect(pacingTooltip(45)).toBe("45 seconds");
    expect(pacingTooltip(12_000)).toContain("12,000 seconds");
    expect(pacingTooltip(12_000)).toContain("Multi-hour wait");
    expect(pacingTooltip(18_000)).toContain("Long project (4h+ commitment)");
    expect(pacingTooltip(18_000)).toContain("18,000 seconds");
    expect(pacingTooltip(172_800)).toContain("Long project (multi-day commitment)");
    expect(pacingTooltip(172_800)).toContain("172,800 seconds");
  });
});

describe("LongProjectBadge and call sites", () => {
  it("renders nothing under 4h and renders Long project at 4h+ and days", () => {
    expect(renderToStaticMarkup(<LongProjectBadge seconds={45} />)).toBe("");
    expect(renderToStaticMarkup(<LongProjectBadge seconds={7200} />)).toBe("");
    expect(renderToStaticMarkup(<LongProjectBadge seconds={14_399} />)).toBe("");

    const fourHours = renderToStaticMarkup(<LongProjectBadge seconds={14_400} />);
    expect(fourHours).toContain("sc-long-project-badge is-hours");
    expect(fourHours).toContain('data-long-project="hours"');
    expect(fourHours).toContain('data-pacing-tier="long-project"');
    expect(fourHours).toContain("Long project (4h+ commitment)");
    expect(fourHours).toContain("Long project</span>");

    const twoDays = renderToStaticMarkup(<LongProjectBadge seconds={172_800} />);
    expect(twoDays).toContain("sc-long-project-badge is-days is-multi-day");
    expect(twoDays).toContain('data-long-project="days"');
    expect(twoDays).toContain('data-pacing-tier="multi-day"');
    expect(twoDays).toContain("Long project (multi-day commitment)");
  });

  it("attaches enriched pacing tooltips to HorizonTime and HorizonBadge", () => {
    const timeHtml = renderToStaticMarkup(<HorizonTime seconds={18_000} />);
    expect(timeHtml).toContain("Long project (4h+ commitment)");
    expect(timeHtml).toContain("18,000 seconds");

    const badgeHtml = renderToStaticMarkup(<HorizonBadge seconds={172_800} />);
    expect(badgeHtml).toContain("Long project (multi-day commitment)");
    expect(badgeHtml).toContain("172,800 seconds");
  });

  it("shows Long project on 4h+ building work rows in RaiseImproveFold and omits it under 4h", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push(
      {
        id: "b_2h",
        typeId: "cottage",
        realmId: "player",
        x: 1,
        y: 1,
        level: 1,
        completesAtTick: s.meta.tick + 72_000, // 2h (< 4h)
      },
      {
        id: "b_5h",
        typeId: "farm",
        realmId: "player",
        x: 2,
        y: 1,
        level: 1,
        completesAtTick: s.meta.tick + 180_000, // 5h (>= 4h)
      },
      {
        id: "b_2d",
        typeId: "academy",
        realmId: "player",
        x: 3,
        y: 1,
        level: 1,
        completesAtTick: s.meta.tick + 1_728_000, // 2d
      },
    );

    const html = renderToStaticMarkup(
      <RaiseImproveFold state={s} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    expect(html.match(/sc-long-project-badge/g)?.length).toBe(2);
    expect(html).toContain('data-long-project="hours"');
    expect(html).toContain('data-long-project="days"');
  });

  it("shows Long project on 8h-1.5d Keep III studies in ResearchBar and not on 5m starter studies", () => {
    const s = createGameState({ seed: 1 });
    s.buildings.push({ id: "ac", typeId: "academy", realmId: "player", x: 6, y: 6, level: 1, completesAtTick: null });
    const html = renderToStaticMarkup(<ResearchBar state={s} act={() => {}} />);

    const starterCard = studyCard(html, "husbandry");
    expect(starterCard).not.toContain("sc-long-project-badge");

    const longCard = studyCard(html, "supply_trains");
    expect(longCard).toContain("sc-long-project-badge");
    expect(longCard).toContain("Long project");
  });
});

describe("horizon-pacing.css isolation and safety", () => {
  const css = readTextFile("./horizon-pacing.css");
  const badgeSrc = readTextFile("./LongProjectBadge.tsx");

  it("imports horizon-pacing.css directly from LongProjectBadge.tsx", () => {
    expect(badgeSrc).toContain('import "./horizon-pacing.css";');
  });

  it("supports Dusk, Night, Parchment themes, reduced motion, and pip click immunity", () => {
    expect(css).toContain(':root[data-chrome="dusk"]');
    expect(css).toContain(':root[data-chrome="night"]');
    expect(css).toContain(':root[data-chrome="parchment"]');
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toMatch(/\.sc-long-project-pip\s*\{[\s\S]*?pointer-events:\s*none\s*!important/);
    expect(css).toContain("@keyframes sc-long-project-breathe");
    expect(css).toContain("@keyframes sc-long-project-breathe-days");
    expect(css).toContain("@keyframes sc-long-project-pip-pulse");
  });

  it("does not touch board, chat, admin, or theme dock selectors", () => {
    expect(css).not.toContain(".sc-board");
    expect(css).not.toContain(".sc-chat-float");
    expect(css).not.toContain(".sc-admin-float");
    expect(css).not.toContain(".sc-theme-dock");
  });
});
