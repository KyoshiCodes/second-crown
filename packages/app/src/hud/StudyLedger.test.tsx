import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import { StudyLedger, studyLedgerRows, studyStatus } from "./StudyLedger";
import { ResearchBar } from "../ResearchBar";

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function inOrder(html: string, keys: string[]): boolean {
  const idx = keys.map((k) => html.indexOf(k));
  return idx.every((i) => i >= 0) && idx.every((v, i) => i === 0 || v > idx[i - 1]);
}

function bare() {
  const s = createGameState({ seed: 1 });
  s.buildings = [];
  for (const k of Object.keys(s.flags)) if (k.startsWith("research_")) delete s.flags[k];
  return s;
}

const base = {
  name: "Husbandry",
  ticksLeft: 0,
  seconds: 18,
  effect: "Farms yield more food.",
  halls: ["farm", "academy"],
  keepNeed: 0,
  hallOk: true,
  keepOk: true,
};

describe("study row helpers", () => {
  it("status follows existing values", () => {
    expect(studyStatus({ done: true, ticksLeft: 0, hallOk: false, keepOk: false })).toBe("known");
    expect(studyStatus({ done: false, ticksLeft: 5, hallOk: true, keepOk: true })).toBe("studying");
    expect(studyStatus({ done: false, ticksLeft: 0, hallOk: true, keepOk: true })).toBe("open");
    expect(studyStatus({ done: false, ticksLeft: 0, hallOk: false, keepOk: true })).toBe("locked");
  });

  it("rows are name, progress, bonus", () => {
    const rows = studyLedgerRows({ ...base, status: "open" });
    expect(rows.map((r) => r.kind)).toEqual(["name", "progress", "bonus"]);
    expect(rows[1].value).toBe("Not started");
    expect(rows[1].sub).toBe("18s to study");
    expect(rows[2].value).toBe("Farms yield more food.");
  });

  it("studying shows seconds left and stored-total fill", () => {
    const rows = studyLedgerRows({ ...base, status: "studying", ticksLeft: 45, ticksTotal: 180 });
    expect(rows[1].value).toBe("5s left");
    expect(rows[1].fill).toBe(0.75);
    expect(studyLedgerRows({ ...base, status: "studying", ticksLeft: 45 })[1].fill).toBe("run");
  });

  it("locked names what is missing; known marks the bonus active", () => {
    const locked = studyLedgerRows({ ...base, status: "locked", hallOk: false, keepOk: false, keepNeed: 2 });
    expect(locked[0].sub).toBe("needs farm or academy · needs Keep II");
    const known = studyLedgerRows({ ...base, status: "known" });
    expect(known[1].value).toBe("Known");
    expect(known[2].sub).toBe("active");
    expect(known[2].tone).toBe("ready");
  });
});

describe("StudyLedger", () => {
  it("renders rows, bars and slots", () => {
    const html = renderToStaticMarkup(
      <StudyLedger rows={[{ kind: "progress", label: "Progress", value: "Known", tone: "done", fill: 1, slot: <button>Go</button> }]} />,
    );
    expect(html).toContain("sc-study-ledger-row is-progress tone-done");
    expect(html).toContain("width:100%");
    expect(html).toContain("<button>Go</button>");
  });
});

describe("ResearchBar study cards", () => {
  it("keeps the Study buttons and stacks rows above them", () => {
    const s = bare();
    const html = renderToStaticMarkup(<ResearchBar state={s} act={() => {}} />);
    expect(html).toContain("sc-study-living-card is-locked");
    expect(inOrder(html, ["is-name", "is-progress", "is-bonus", "Study husbandry ("])).toBe(true);
    expect(html).toMatch(/<button[^>]*disabled[^>]*class="sc-btn-with-pip sc-study-btn"/);
  });

  it("an active study shows Cancel and no Study button on its card", () => {
    const s = bare();
    s.flags.research_husbandry_until = s.meta.tick + 45;
    s.flags.research_husbandry_total = 180;
    const html = renderToStaticMarkup(<ResearchBar state={s} act={() => {}} />);
    const card = html.slice(html.lastIndexOf("<div", html.indexOf('data-study="husbandry"')), html.indexOf('data-study="forestry"'));
    expect(card).toContain("is-studying");
    expect(card).toContain("Cancel");
    expect(card).not.toContain("Study husbandry (");
    expect(card).toContain('aria-valuenow="0.75"');
  });
});

describe("academy-living.css", () => {
  it("lives outside theme.css and respects reduced motion", () => {
    const css = readCssFile("./academy-living.css");
    expect(css).toContain(".sc-study-ledger");
    expect(css).toContain("prefers-reduced-motion");
    expect(readCssFile("../theme.css")).not.toContain("sc-study-ledger");
  });
});
