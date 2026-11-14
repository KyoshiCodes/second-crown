import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, RESEARCH, researchRequires } from "@second-crown/sim";
import { ResearchBar } from "./ResearchBar";
import {
  ResearchTreeMap,
  studyTreeBranches,
  studyTreeNode,
  studyTreeSummary,
} from "./ResearchTreeMap";

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

type State = ReturnType<typeof createGameState>;

const IDS = Object.keys(RESEARCH) as (keyof typeof RESEARCH)[];

/** A realm with an Academy (a hall for every study but siege), a Keep of the given level, and full stores. */
function realm(keep: number): State {
  const s = createGameState({ seed: 1 });
  s.buildings.push({ id: "ac", typeId: "academy", realmId: "player", x: 6, y: 6, level: 1, completesAtTick: null });
  const k = s.buildings.find((b) => b.typeId === "keep" && b.realmId === "player");
  if (k) {
    k.level = keep;
    k.completesAtTick = null;
  } else {
    s.buildings.push({ id: "keep_t", typeId: "keep", realmId: "player", x: 3, y: 3, level: keep, completesAtTick: null });
  }
  for (const res of ["food", "wood", "stone", "gold"]) s.resources[res] = "500";
  return s;
}

function nodeHtml(html: string, id: string): string {
  const start = html.indexOf(`data-map-node="${id}"`);
  expect(start).toBeGreaterThan(-1);
  const end = html.indexOf("</button>", start);
  return html.slice(start, end);
}

const act = () => undefined;

describe("study tree map", () => {
  it("draws every study once: six branches with a deeper study, four first studies alone", () => {
    const branches = studyTreeBranches(realm(3));
    const linked = branches.filter((b) => b.children.length > 0);
    const solo = branches.filter((b) => b.children.length === 0);
    expect(linked.map((b) => b.root.id)).toEqual(["husbandry", "forestry", "masonry", "logistics", "surveying", "drill"]);
    expect(solo.map((b) => b.root.id)).toEqual(["fieldcraft", "screening", "horse", "siege"]);
    // Linked branches are listed before the stand-alone ones.
    expect(branches.slice(0, linked.length)).toEqual(linked);
    const all = branches.flatMap((b) => [b.root, ...b.children]).map((n) => n.id);
    expect([...all].sort()).toEqual([...IDS].sort());
  });

  it("hangs each deeper study under the first study the sim says it requires", () => {
    for (const b of studyTreeBranches(realm(3))) {
      expect(b.root.tier).toBe(1);
      for (const c of b.children) {
        expect(c.tier).toBe(2);
        expect(researchRequires(c.id)).toBe(b.root.id);
      }
    }
  });

  it("marks a study ready when gates, stores and lectern all allow it", () => {
    const n = studyTreeNode(realm(3), "husbandry");
    expect(n.state).toBe("ready");
    expect(n.pct).toBe(0);
    expect(n.line).toMatch(/^Ready · \d+s to study$/);
  });

  it("seals a deeper study and names the first study it needs, then opens it", () => {
    const s = realm(3);
    const sealed = studyTreeNode(s, "crop_rotation");
    expect(sealed.state).toBe("locked");
    expect(sealed.line).toBe("Needs Husbandry");
    expect(studyTreeBranches(s).find((b) => b.root.id === "husbandry")?.linkMet).toBe(false);

    s.flags.research_husbandry = 1;
    expect(studyTreeNode(s, "husbandry")).toMatchObject({ state: "known", pct: 100, line: "Known" });
    expect(studyTreeNode(s, "crop_rotation").state).toBe("ready");
    expect(studyTreeBranches(s).find((b) => b.root.id === "husbandry")?.linkMet).toBe(true);
  });

  it("lists every unmet gate on a sealed study, first study first", () => {
    const s = realm(1);
    // Cartography needs Surveying and Keep III; the Academy covers the hall.
    expect(studyTreeNode(s, "cartography").line).toBe("Needs Surveying, Keep III");
    // Surveying itself only lacks the Keep level.
    expect(studyTreeNode(s, "surveying").line).toBe("Needs Keep II");
    // Siege craft takes a siege workshop, which this realm has not built.
    const siege = studyTreeNode(realm(3), "siege");
    expect(siege.state).toBe("locked");
    expect(siege.line).toMatch(/^Needs /);
    expect(siege.line).not.toContain("Keep");
  });

  it("shows the running percent and seconds on the study underway, and Lectern busy on the rest", () => {
    const s = realm(3);
    s.flags.research_masonry_until = s.meta.tick + 100;
    s.flags.research_masonry_total = 200;
    const n = studyTreeNode(s, "masonry");
    expect(n.state).toBe("studying");
    expect(n.pct).toBe(50);
    expect(n.line).toBe("50% · 10s left");
    expect(studyTreeNode(s, "husbandry")).toMatchObject({ state: "waiting", line: "Lectern busy" });
    // A sealed study stays sealed; it does not turn into "Lectern busy".
    expect(studyTreeNode(s, "fortification").state).toBe("locked");
  });

  it("says what the stores are short of when the gates are met but the cost is not", () => {
    const s = realm(3);
    s.resources.food = "5";
    s.resources.wood = "12";
    // Husbandry costs 20 food and 12 wood.
    expect(studyTreeNode(s, "husbandry")).toMatchObject({ state: "waiting", line: "Short 15 food" });
  });

  it("sums up the tree in one line", () => {
    const s = realm(3);
    expect(studyTreeSummary(studyTreeBranches(s))).toMatchObject({ known: 0, total: 16 });
    expect(studyTreeSummary(studyTreeBranches(s)).text).toMatch(/^0 of 16 known · \d+ ready to study$/);
    s.flags.research_husbandry = 1;
    s.flags.research_masonry_until = s.meta.tick + 100;
    s.flags.research_masonry_total = 200;
    expect(studyTreeSummary(studyTreeBranches(s)).text).toBe("1 of 16 known · studying Masonry 50%");
    for (const id of IDS) s.flags[`research_${id}`] = 1;
    delete s.flags.research_masonry_until;
    expect(studyTreeSummary(studyTreeBranches(s)).text).toBe("16 of 16 known · every study known");
  });

  it("renders one node per study with its state, progress and link state", () => {
    const s = realm(3);
    s.flags.research_husbandry = 1;
    s.flags.research_masonry_until = s.meta.tick + 100;
    s.flags.research_masonry_total = 200;
    const html = renderToStaticMarkup(<ResearchTreeMap state={s} />);
    expect(html.match(/data-map-node="/g)).toHaveLength(16);
    expect(html.match(/data-map-branch="/g)).toHaveLength(6);
    expect(html).toContain('data-map-solo="4"');
    expect(html).toMatch(/data-map-branch="husbandry" data-link-met="yes"/);
    expect(html).toMatch(/data-map-branch="forestry" data-link-met="no"/);

    const known = nodeHtml(html, "husbandry");
    expect(known).toContain('data-node-state="known"');
    expect(known).toContain("width:100%");
    const studying = nodeHtml(html, "masonry");
    expect(studying).toContain('data-node-state="studying"');
    expect(studying).toContain('data-progress="50"');
    expect(studying).toContain("width:50%");
    expect(studying).toContain("50% · 10s left");
    expect(nodeHtml(html, "timber_framing")).toContain("Needs Forestry");
    // The legend names all five states.
    for (const word of ["Known", "Studying", "Ready", "Waiting", "Sealed"]) expect(html).toContain(word);
  });

  it("sits on the lectern above the study cards and leaves every card and button in place", () => {
    const s = realm(3);
    s.flags.research_drill = 1;
    s.flags.research_quartermastery_until = s.meta.tick + 100;
    s.flags.research_quartermastery_total = 240;
    const html = renderToStaticMarkup(<ResearchBar state={s} act={act} />);
    const map = html.indexOf('data-research-map="tree"');
    expect(map).toBeGreaterThan(-1);
    expect(map).toBeLessThan(html.indexOf("data-study="));
    expect(map).toBeLessThan(html.indexOf('data-research-tier="1"'));
    // All sixteen cards are still there, and the tier headings.
    expect(html.match(/data-study="/g)).toHaveLength(16);
    expect(html).toContain("First studies");
    expect(html).toContain("Deeper studies");
    // The Cancel button stays on the card, and the map adds no Study or Cancel control of its own.
    expect(html.match(/>Cancel<\/button>/g)).toHaveLength(1);
    const mapHtml = html.slice(map, html.indexOf('data-research-tier="1"'));
    expect(mapHtml).not.toContain(">Cancel<");
    expect(mapHtml).not.toContain("sc-study-btn");
    expect(mapHtml).not.toMatch(/<button[^>]*disabled/);
  });

  it("renders nothing without a game state", () => {
    expect(renderToStaticMarkup(<ResearchTreeMap state={undefined} />)).toBe("");
  });

  it("styles live in research-tree-map.css, scoped to the map classes, with no animation", () => {
    const css = readCssFile("./research-tree-map.css");
    expect(css).toContain(".sc-research-map-branch");
    expect(css).toContain(".sc-research-map-link");
    for (const sel of css.match(/^[^@{}\n/* ][^{}\n]*\{/gm) ?? []) expect(sel).toContain(".sc-research-map");
    expect(css).not.toContain("@keyframes");
    expect(css).not.toMatch(/animation\s*:/);
    // Decorative layers never take clicks.
    for (const cls of ["link", "bar", "bar-fill", "mark", "meter"]) {
      const block = css.slice(css.indexOf(`.sc-research-map-${cls} {`));
      expect(block.slice(0, block.indexOf("}"))).toContain("pointer-events: none");
    }
  });
});
