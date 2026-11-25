import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  RESEARCH,
  createGameState,
  isProvinceSeen,
  researchDuration,
  researchTicksLeft,
  tryCancelResearch,
  tryStartResearch,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { ResearchStatusLine, researchBonusText, researchNoneText, researchStatus } from "./ResearchStatusLine";
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

const TOTAL = Object.keys(RESEARCH).length;

function fresh(): GameState {
  return createGameState({ seed: 8 });
}

/** Starts Husbandry through the sim's own action: a farm for the hall, food and wood for the cost. */
function startHusbandry(s: GameState): void {
  s.buildings.push({ id: "f1", typeId: "farm", realmId: "player", x: 3, y: 3, level: 1, completesAtTick: null });
  s.resources.food = "100";
  s.resources.wood = "100";
  expect(tryStartResearch(s, "husbandry")).toBe(true);
}

describe("researchBonusText", () => {
  it("keeps what the study grants and drops the Needs gate", () => {
    expect(researchBonusText(RESEARCH.husbandry.effect)).toBe("Farms and granaries yield more food.");
    expect(researchBonusText(RESEARCH.logistics.effect)).toBe("One extra column on the board and +50 warehouse space.");
    expect(researchBonusText(RESEARCH.fortification.effect)).toBe(
      "Quarries yield another +10% stone. Finished walls hold another +24 HP. Unlocks ironclads.",
    );
    for (const def of Object.values(RESEARCH)) {
      const bonus = researchBonusText(def.effect);
      expect(bonus.length).toBeGreaterThan(0);
      expect(bonus).not.toMatch(/Needs/);
    }
  });
});

describe("researchStatus", () => {
  it("says none are active on a fresh crown", () => {
    const st = researchStatus(fresh());
    expect(st.kind).toBe("none");
    expect(st.active).toBe(0);
    expect(st.known).toBe(0);
    expect(st.total).toBe(TOTAL);
    expect(st.rows).toEqual([]);
    expect(st.text).toBe(`Research · None active · ${researchNoneText(0, TOTAL)}`);
  });

  it("lists a running study with the card's progress and its bonus", () => {
    const s = fresh();
    startHusbandry(s);
    const total = researchDuration(s, "husbandry");
    s.meta.tick += Math.floor(total / 2);
    const left = researchTicksLeft(s, "husbandry");
    const st = researchStatus(s);
    expect(st.kind).toBe("active");
    expect(st.active).toBe(1);
    expect(st.headline).toBe("1 active");
    const row = st.rows[0];
    expect(row.id).toBe("husbandry");
    expect(row.ticksLeft).toBe(left);
    expect(row.ticksTotal).toBe(total);
    expect(row.percent).toBe(Math.round((1 - left / total) * 100));
    // Pacing pass 1: husbandry is 3_000 ticks, so half way leaves 1_500 ticks = 2m 30s.
    expect(left).toBe(1_500);
    expect(row.progress).toBe(`${row.percent}% · 2m 30s left`);
    expect(row.bonus).toBe("Farms and granaries yield more food.");
    expect(st.text).toBe(`Research · 1 active · Husbandry, ${row.progress}: Farms and granaries yield more food.`);
  });

  it("starts at 0% and never shows 100% while time remains", () => {
    const s = fresh();
    startHusbandry(s);
    expect(researchStatus(s).rows[0].percent).toBe(0);
    s.meta.tick += researchDuration(s, "husbandry") - 1;
    expect(researchStatus(s).rows[0].percent).toBe(99);
  });

  it("drops a study once it is known and counts it", () => {
    const s = fresh();
    startHusbandry(s);
    s.meta.tick += researchDuration(s, "husbandry");
    const st = researchStatus(s);
    expect(st.kind).toBe("none");
    expect(st.known).toBe(1);
    expect(st.text).toContain(`1 of ${TOTAL} studies known`);
  });

  it("drops a study once it is cancelled", () => {
    const s = fresh();
    startHusbandry(s);
    expect(tryCancelResearch(s, "husbandry")).toBe(true);
    expect(researchStatus(s).kind).toBe("none");
  });

  it("does not change the state while a study runs", () => {
    const s = fresh();
    startHusbandry(s);
    s.meta.tick += 10;
    const before = JSON.stringify(s);
    researchStatus(s);
    renderToStaticMarkup(<ResearchStatusLine state={s} />);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("ResearchStatusLine", () => {
  it("renders nothing without a state", () => {
    expect(renderToStaticMarkup(<ResearchStatusLine state={undefined} />)).toBe("");
  });

  it("shows the active study with progress and bonus, and no button", () => {
    const s = fresh();
    startHusbandry(s);
    const html = renderToStaticMarkup(<ResearchStatusLine state={s} />);
    expect(html).toContain('data-research-status="active"');
    expect(html).toContain('data-research-active="1"');
    expect(html).toContain('data-study="husbandry"');
    expect(html).toContain("<strong>Husbandry</strong>");
    expect(html).toContain("m left");
    expect(html).toContain("Farms and granaries yield more food.");
    expect(html).toContain(`aria-label="${researchStatus(s).text}"`);
    expect(html).toContain("is-lit");
    expect(html).not.toContain("<button");
  });

  it("shows the idle text when the lectern is free", () => {
    const html = renderToStaticMarkup(<ResearchStatusLine state={fresh()} />);
    expect(html).toContain('data-research-status="none"');
    expect(html).toContain(researchNoneText(0, TOTAL));
  });
});

describe("ResearchStatusLine mounts", () => {
  it("shows once on the Kingdom tab, right after the quests line", () => {
    const s = fresh();
    const html = renderToStaticMarkup(
      <KingdomTab state={s} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    const quests = html.indexOf('class="sc-quests-status-line');
    const line = html.indexOf('class="sc-research-status-line');
    expect(quests).toBeGreaterThan(-1);
    expect(line).toBeGreaterThan(quests);
    expect(html.match(/class="sc-research-status-line/g)?.length).toBe(1);
  });

  it("shows once on the inspect card", () => {
    const s = fresh();
    startHusbandry(s);
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={s.board.homeProvinceId} act={() => {}} onClear={() => {}} />,
    );
    expect(html.match(/class="sc-research-status-line/g)?.length).toBe(1);
    expect(html).toContain("<strong>Husbandry</strong>");
  });

  it("shows on the inspect card for an unseen tile too: studies belong to the crown, not the tile", () => {
    const s = fresh();
    const hidden = s.board.provinces.find((p) => !isProvinceSeen(s, p.id));
    expect(hidden).toBeDefined();
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={hidden!.id} act={() => {}} onClear={() => {}} />,
    );
    expect(html).toContain('data-research-status="none"');
  });
});

describe("research-status-line.css", () => {
  const css = readFile("./research-status-line.css");

  it("styles every class the line renders", () => {
    for (const cls of [
      "sc-research-status-line",
      "sc-research-status-icon",
      "sc-research-status-text",
      "sc-research-status-label",
      "sc-research-status-headline",
      "sc-research-status-progress",
      "sc-research-status-bonus",
      "sc-research-status-note",
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
    for (const sel of selectors) expect(sel.startsWith(".sc-research-status-")).toBe(true);
    expect(css).toContain("pointer-events: none");
    expect(css).not.toContain("@keyframes");
  });

  it("is not in theme.css", () => {
    expect(readFile("../theme.css")).not.toContain("sc-research-status");
  });
});
