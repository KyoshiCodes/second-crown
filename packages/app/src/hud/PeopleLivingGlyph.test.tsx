import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createCitizen, createGameState, listCitizenJobs, tryAssignCitizen } from "@second-crown/sim";
import {
  PeopleLivingGlyph,
  PeopleLivingUnderlay,
  getPeopleCraft,
  resolvePeopleLiving,
  type PeopleCraft,
  type PeopleLivingInput,
} from "./PeopleLivingGlyph";
import { JobCard } from "./JobCard";
import { PeoplePanel } from "../PeoplePanel";

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

const noop = () => {};

function makeInput(overrides: Partial<PeopleLivingInput> = {}): PeopleLivingInput {
  return {
    role: "farmer",
    idle: false,
    count: 2,
    siteCount: 1,
    postCount: 3,
    ...overrides,
  };
}

describe("getPeopleCraft and resolvePeopleLiving", () => {
  it("maps every CitizenJob in CITIZEN_JOBS to a distinct craft or idle pose", () => {
    const jobIds = listCitizenJobs().map((j) => j.id);
    expect(jobIds).toEqual(["unassigned", "farmer", "woodcutter", "miner", "merchant", "guard", "scholar"]);

    expect(getPeopleCraft("unassigned", true)).toBe("idle");
    expect(getPeopleCraft("idle", true)).toBe("idle");
    expect(getPeopleCraft("farmer", false)).toBe("farmer");
    expect(getPeopleCraft("woodcutter", false)).toBe("woodcutter");
    expect(getPeopleCraft("miner", false)).toBe("miner");
    expect(getPeopleCraft("merchant", false)).toBe("merchant");
    expect(getPeopleCraft("guard", false)).toBe("guard");
    expect(getPeopleCraft("scholar", false)).toBe("scholar");
  });

  it("resolves striding walker flairs across all six trades and calm awaiting-post state", () => {
    expect(resolvePeopleLiving(makeInput({ role: "farmer" }))).toEqual({
      craft: "farmer",
      pose: "walking",
      state: "striding",
      flair: "Furrows · striding",
    });
    expect(resolvePeopleLiving(makeInput({ role: "woodcutter" })).flair).toBe("Timber · striding");
    expect(resolvePeopleLiving(makeInput({ role: "miner" })).flair).toBe("Delving · striding");
    expect(resolvePeopleLiving(makeInput({ role: "merchant" })).flair).toBe("Stalls · striding");
    expect(resolvePeopleLiving(makeInput({ role: "guard" })).flair).toBe("Walls · patrolling");
    expect(resolvePeopleLiving(makeInput({ role: "scholar" })).flair).toBe("Sanctum · studying");

    expect(resolvePeopleLiving(makeInput({ role: "farmer", siteCount: 0 }))).toEqual({
      craft: "farmer",
      pose: "walking",
      state: "calm",
      flair: "Awaiting post",
    });
  });

  it("resolves idle pose states across waiting with open posts, no hall yet, and empty bench", () => {
    expect(resolvePeopleLiving(makeInput({ role: "idle", idle: true, count: 2, siteCount: 0, postCount: 3 }))).toEqual({
      craft: "idle",
      pose: "idle",
      state: "waiting",
      flair: "Resting · posts open",
    });

    expect(resolvePeopleLiving(makeInput({ role: "idle", idle: true, count: 2, siteCount: 0, postCount: 0 }))).toEqual({
      craft: "idle",
      pose: "idle",
      state: "calm",
      flair: "Resting · no hall yet",
    });

    expect(resolvePeopleLiving(makeInput({ role: "idle", idle: true, count: 0, siteCount: 0, postCount: 2 }))).toEqual({
      craft: "idle",
      pose: "idle",
      state: "calm",
      flair: "Bench empty",
    });
  });

  it("is pure and does not mutate its input", () => {
    const input = makeInput();
    const before = JSON.stringify(input);
    resolvePeopleLiving(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});

describe("PeopleLivingGlyph and PeopleLivingUnderlay markup", () => {
  it("renders aria-hidden phrasing-only spans and SVGs with walker glow, drift, and pulse layers", () => {
    const walkerHtml = renderToStaticMarkup(<PeopleLivingGlyph {...makeInput({ role: "miner" })} />);
    expect(walkerHtml).toContain('aria-hidden="true"');
    expect(walkerHtml).toContain('data-people-pose="walking"');
    expect(walkerHtml).toContain('data-people-craft="miner"');
    expect(walkerHtml).toContain("sc-people-glow");
    expect(walkerHtml).toContain("sc-people-walker-drift");
    expect(walkerHtml).toContain("sc-people-walker-pulse");
    expect(walkerHtml).not.toMatch(/<(?:div|p|section|article|button|select)\b/);

    const idleHtml = renderToStaticMarkup(
      <PeopleLivingGlyph {...makeInput({ role: "idle", idle: true, siteCount: 0, postCount: 2 })} />,
    );
    expect(idleHtml).toContain('data-people-pose="idle"');
    expect(idleHtml).toContain('data-people-craft="idle"');
    expect(idleHtml).toContain("sc-people-glow");
    expect(idleHtml).toContain("sc-people-idle-drift");
    expect(idleHtml).toContain("sc-people-idle-pulse");
    expect(idleHtml).not.toMatch(/<(?:div|p|section|article|button|select)\b/);
  });

  it("renders distinct badge and corner watermark SVG silhouettes across all six walker trades and idle pose", () => {
    const crafts: PeopleCraft[] = ["idle", "farmer", "woodcutter", "miner", "merchant", "guard", "scholar"];

    const badgeSvgs = crafts.map((craft) =>
      renderToStaticMarkup(
        <PeopleLivingGlyph
          role={craft}
          idle={craft === "idle"}
          count={1}
          siteCount={craft === "idle" ? 0 : 1}
          postCount={2}
        />,
      ),
    );
    expect(new Set(badgeSvgs).size).toBe(7);

    const watermarkSvgs = crafts.map((craft) =>
      renderToStaticMarkup(
        <PeopleLivingUnderlay
          role={craft}
          idle={craft === "idle"}
          count={1}
          siteCount={craft === "idle" ? 0 : 1}
          postCount={2}
        />,
      ),
    );
    expect(new Set(watermarkSvgs).size).toBe(7);
  });
});

describe("JobCard, PeoplePanel, and CSS isolation", () => {
  it("mounts PeopleLivingGlyph beneath JobStatusStack and above worker rows, keeping Post picker and Idle button intact", () => {
    const farm = { id: "b1", typeId: "farm", realmId: "player", x: 2, y: 3, completesAtTick: null } as never;
    const html = renderToStaticMarkup(
      <JobCard
        name="Farmer"
        idle={false}
        workers={[{ id: "c1", realmId: "player", job: "farmer", tile: { x: 2, y: 3 } }] as never}
        buildings={[farm]}
        posts={[farm]}
        act={noop as never}
        kingdomIdle={1}
      />,
    );

    const stackIdx = html.indexOf("sc-jobstat");
    const glyphIdx = html.indexOf("sc-people-living-glyph");
    const rowIdx = html.indexOf("sc-job-row");
    const underlayIdx = html.indexOf("sc-people-living-underlay");

    expect(stackIdx).toBeGreaterThan(-1);
    expect(glyphIdx).toBeGreaterThan(stackIdx);
    expect(glyphIdx).toBeLessThan(rowIdx);
    expect(underlayIdx).toBeGreaterThan(rowIdx);
    expect(html).toContain("Post at…");
    expect(html).toContain(">Idle</button>");
  });

  it("renders both idle and assigned walker glyphs in PeoplePanel without mutating GameState", () => {
    const s = createGameState({ seed: 7 });
    const farm = { id: "f1", typeId: "farm" as const, realmId: "player", x: 1, y: 2, level: 1, completesAtTick: null };
    s.buildings = [farm];
    const c1 = createCitizen(s, "player");
    createCitizen(s, "player");
    tryAssignCitizen(s, c1.id, farm.id);

    const before = JSON.stringify(s);
    const html = renderToStaticMarkup(<PeoplePanel state={s} act={noop as never} />);
    expect(JSON.stringify(s)).toBe(before);

    expect(html).toContain('data-people-pose="idle"');
    expect(html).toContain("Resting · posts open");
    expect(html).toContain('data-people-pose="walking"');
    expect(html).toContain('data-people-craft="farmer"');
    expect(html).toContain("Furrows · striding");
  });

  it("isolates styles in people-living.css with pointer-events: none, capped watermark opacity, and reduced-motion guard", () => {
    const css = readCssFile("./people-living.css");
    const themeCss = readCssFile("../theme.css");
    const stackCss = readCssFile("./job-status-stack.css");

    expect(themeCss).not.toContain("sc-people-living");
    expect(stackCss).not.toContain("sc-people-living");
    expect(css).toContain(".sc-job-card:has(> .sc-people-living-underlay)");
    expect(css).toContain("pointer-events: none !important;");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");

    const underlayBlock = /\.sc-people-living-underlay\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? "";
    const wrapperOpacity = Number(/opacity:\s*([0-9.]+)/.exec(underlayBlock)?.[1] ?? "1");
    expect(wrapperOpacity).toBeLessThanOrEqual(0.3);

    const driftKeyframe = /@keyframes\s+sc-people-watermark-drift\s*\{([\s\S]*?)\}\s*\}/.exec(css)?.[0] ?? "";
    const keyframeOpacities = [...driftKeyframe.matchAll(/opacity:\s*([0-9.]+)/g)].map((m) => Number(m[1]));
    expect(keyframeOpacities.length).toBeGreaterThan(0);
    for (const op of keyframeOpacities) {
      expect(op).toBeLessThanOrEqual(0.55);
    }
  });
});
