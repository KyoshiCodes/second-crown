import React from "react";
import {
  RESEARCH,
  countBuilding,
  getBuildingType,
  keepLevel,
  researchDone,
  researchDuration,
  researchKeepMin,
  researchKeepReady,
  researchPrereqReady,
  researchRequires,
  researchTicksLeft,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { studyStatus } from "./hud/StudyLedger";
import { studyCostParts } from "./ResearchCost";
import { studyLeadsTo, studyNeeds, studyProgressText } from "./ResearchAdvanced";
import "./research-tree-map.css";

/**
 * Study tree: a compact map of every lectern study, drawn as branches. Each first
 * study sits on the left, the deeper study that builds on it sits on the right, and
 * the line between them is gold once the first study is known.
 *
 * Display only. Every value is read with the same sim calls the study cards use
 * (researchDone, researchTicksLeft, researchKeepReady, researchPrereqReady,
 * countBuilding, researchDuration). Nothing here starts, cancels or pays for a
 * study; the cards below keep the Study and Cancel buttons, and tryStartResearch
 * stays the only judge.
 */

type Id = keyof typeof RESEARCH;

/**
 * known    = finished.
 * studying = on the lectern now.
 * ready    = every gate met, stores cover the cost, lectern free.
 * waiting  = every gate met, but the stores are short or the lectern is busy.
 * locked   = a gate is not met (first study, Keep level, or hall).
 */
export type StudyNodeState = "known" | "studying" | "ready" | "waiting" | "locked";

export interface StudyTreeNode {
  id: Id;
  name: string;
  tier: 1 | 2;
  state: StudyNodeState;
  /** 0..100. 100 when known, the running percent while studying, otherwise 0. */
  pct: number;
  /** One short line under the name, e.g. "Known", "42% · 12s left", "Needs Keep II". */
  line: string;
  /** What the study does (the sim's own effect text). */
  effect: string;
}

export interface StudyBranch {
  root: StudyTreeNode;
  /** Deeper studies that build on the root. Empty for a first study that stands alone. */
  children: StudyTreeNode[];
  /** True once the root is known, so its deeper studies are no longer sealed by it. */
  linkMet: boolean;
}

const MARK: Record<StudyNodeState, string> = {
  known: "✓",
  studying: "◔",
  ready: "●",
  waiting: "○",
  locked: "✗",
};

const STATE_WORD: Record<StudyNodeState, string> = {
  known: "Known",
  studying: "Studying",
  ready: "Ready",
  waiting: "Waiting",
  locked: "Sealed",
};

function hallIds(def: { needs?: string; needsAny?: readonly string[] }): string[] {
  if (def.needsAny && def.needsAny.length) return [...def.needsAny];
  if (def.needs) return [def.needs];
  return [];
}

function activeStudy(state: GameState): Id | undefined {
  return (Object.keys(RESEARCH) as Id[]).find((id) => researchTicksLeft(state, id) > 0);
}

/** One node of the tree, from the same reads the study card makes. */
export function studyTreeNode(state: GameState, id: Id): StudyTreeNode {
  const def = RESEARCH[id];
  const done = researchDone(state, id);
  const left = researchTicksLeft(state, id);
  const halls = hallIds(def);
  const builtHall = halls.find((b) => countBuilding(state, b) > 0);
  const keepOk = researchKeepReady(state, id);
  const prereqId = researchRequires(id);
  const prereqOk = researchPrereqReady(state, id);
  const status = studyStatus({ done, ticksLeft: left, hallOk: Boolean(builtHall), keepOk, prereqOk });
  const duration = researchDuration(state, id);
  const startedTotal = Number(state.flags[`research_${id}_total`] ?? 0);
  const ticksTotal = startedTotal > 0 ? startedTotal : duration;
  const base = {
    id,
    name: def.name,
    tier: (prereqId ? 2 : 1) as 1 | 2,
    effect: "effect" in def ? String(def.effect) : "",
  };

  if (status === "known") return { ...base, state: "known", pct: 100, line: "Known" };

  if (status === "studying") {
    const text = studyProgressText({
      status,
      ticksLeft: left,
      ticksTotal,
      ticksBase: def.ticks,
      ticksPerSecond: TICKS_PER_SECOND,
    });
    const frac = ticksTotal > 0 ? 1 - left / ticksTotal : 0;
    const pct = Math.min(99, Math.max(0, Math.round(frac * 100)));
    return { ...base, state: "studying", pct, line: text ? text.value : "Studying" };
  }

  if (status === "locked") {
    const hallName = (b: string) => getBuildingType(b)?.name ?? b;
    const unmet = studyNeeds({
      prereq: prereqId ? RESEARCH[prereqId].name : undefined,
      prereqOk,
      halls: halls.map(hallName),
      hallBuilt: builtHall ? hallName(builtHall) : undefined,
      keepNeed: researchKeepMin(id),
      keepNow: keepLevel(state),
    }).filter((n) => !n.met);
    // The first study comes first: it is the gate the tree line is drawing.
    const order = { study: 0, keep: 1, hall: 2 } as const;
    unmet.sort((a, b) => order[a.kind] - order[b.kind]);
    return {
      ...base,
      state: "locked",
      pct: 0,
      line: unmet.length > 0 ? `Needs ${unmet.map((n) => n.label).join(", ")}` : "Sealed",
    };
  }

  // Every gate is met. What is left is the cost and the single study slot.
  const short = studyCostParts(def.cost, state.resources).filter((p) => p.short > 0);
  if (short.length > 0) {
    return {
      ...base,
      state: "waiting",
      pct: 0,
      line: `Short ${short.map((p) => `${p.short} ${p.res}`).join(", ")}`,
    };
  }
  const busy = activeStudy(state);
  if (busy && busy !== id) return { ...base, state: "waiting", pct: 0, line: "Lectern busy" };
  return { ...base, state: "ready", pct: 0, line: `Ready · ${Math.round(duration / TICKS_PER_SECOND)}s to study` };
}

/**
 * Every first study as a branch, in table order. Branches that have a deeper study
 * come first; first studies that stand alone come after.
 */
export function studyTreeBranches(state: GameState): StudyBranch[] {
  const roots = (Object.keys(RESEARCH) as Id[]).filter((id) => researchRequires(id) === null);
  const branches = roots.map((id) => ({
    root: studyTreeNode(state, id),
    children: studyLeadsTo(id).map((child) => studyTreeNode(state, child)),
    linkMet: researchDone(state, id),
  }));
  return [...branches.filter((b) => b.children.length > 0), ...branches.filter((b) => b.children.length === 0)];
}

/** Summary beside the title, e.g. "3 of 16 known · studying Masonry 42%". */
export function studyTreeSummary(branches: StudyBranch[]): { known: number; total: number; text: string } {
  const nodes = branches.flatMap((b) => [b.root, ...b.children]);
  const known = nodes.filter((n) => n.state === "known").length;
  const studying = nodes.find((n) => n.state === "studying");
  const ready = nodes.filter((n) => n.state === "ready").length;
  const tail = studying
    ? `studying ${studying.name} ${studying.pct}%`
    : known === nodes.length
      ? "every study known"
      : ready > 0
        ? `${ready} ready to study`
        : "nothing ready yet";
  return { known, total: nodes.length, text: `${known} of ${nodes.length} known · ${tail}` };
}

/** Scroll to this study's full card (the one with the Study or Cancel button) and outline it briefly. */
function showCard(from: HTMLElement, id: string) {
  const lectern = from.closest(".sc-research-lectern");
  const card = lectern?.querySelector<HTMLElement>(`[data-study="${id}"]`);
  if (!card) return;
  const calm = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  card.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "center" });
  card.classList.add("sc-research-map-target");
  window.setTimeout(() => card.classList.remove("sc-research-map-target"), 1600);
}

function Node(props: { node: StudyTreeNode }) {
  const { node } = props;
  return (
    <button
      type="button"
      className={`sc-research-map-node is-${node.state}`}
      data-map-node={node.id}
      data-node-state={node.state}
      data-node-tier={node.tier}
      data-progress={node.pct}
      title={`${node.effect} Click to show its card.`}
      aria-label={`${node.name}. ${node.state === "known" ? "" : `${STATE_WORD[node.state]}. `}${node.line}. Show its card.`}
      onClick={(e) => showCard(e.currentTarget, node.id)}
    >
      <span className="sc-research-map-mark" aria-hidden="true">
        {MARK[node.state]}
      </span>
      <span className="sc-research-map-text">
        <span className="sc-research-map-name">{node.name}</span>
        <span className="sc-research-map-line">{node.line}</span>
      </span>
      <span className="sc-research-map-bar" aria-hidden="true">
        <span className="sc-research-map-bar-fill" style={{ width: `${node.pct}%` }} />
      </span>
    </button>
  );
}

const LEGEND: StudyNodeState[] = ["known", "studying", "ready", "waiting", "locked"];

export function ResearchTreeMap(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const branches = studyTreeBranches(state);
  const linked = branches.filter((b) => b.children.length > 0);
  const solo = branches.filter((b) => b.children.length === 0);
  const sum = studyTreeSummary(branches);
  const pct = sum.total > 0 ? Math.round((sum.known / sum.total) * 100) : 0;
  return (
    <section className="sc-research-map" data-research-map="tree" aria-label="Study tree">
      <header className="sc-research-map-head">
        <strong className="sc-research-map-title">Study tree</strong>
        <span className="sc-research-map-sum">{sum.text}</span>
        <span
          className="sc-research-map-meter"
          role="progressbar"
          aria-label="Studies known"
          aria-valuemin={0}
          aria-valuemax={sum.total}
          aria-valuenow={sum.known}
        >
          <span className="sc-research-map-meter-fill" style={{ width: `${pct}%` }} />
        </span>
      </header>
      <ul className="sc-research-map-legend" aria-label="What the marks mean">
        {LEGEND.map((s) => (
          <li key={s} className={`sc-research-map-key is-${s}`}>
            <span className="sc-research-map-mark" aria-hidden="true">
              {MARK[s]}
            </span>
            {STATE_WORD[s]}
          </li>
        ))}
      </ul>
      {linked.length > 0 ? (
        <>
          <div className="sc-research-map-cols" aria-hidden="true">
            <span>Tier I</span>
            <span />
            <span>Tier II · builds on tier I</span>
          </div>
          <ol className="sc-research-map-branches">
            {linked.map((b) => (
              <li
                key={b.root.id}
                className={`sc-research-map-branch${b.linkMet ? " is-met" : ""}`}
                data-map-branch={b.root.id}
                data-link-met={b.linkMet ? "yes" : "no"}
              >
                <Node node={b.root} />
                <span className="sc-research-map-link" aria-hidden="true" />
                <div className="sc-research-map-kids">
                  {b.children.map((c) => (
                    <Node key={c.id} node={c} />
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : null}
      {solo.length > 0 ? (
        <div className="sc-research-map-solo" data-map-solo={solo.length}>
          <p className="sc-research-map-solo-label">Stand alone · no deeper study yet</p>
          <div className="sc-research-map-solo-nodes">
            {solo.map((b) => (
              <Node key={b.root.id} node={b.root} />
            ))}
          </div>
        </div>
      ) : null}
      <p className="sc-research-map-foot">Click a study to jump to its card below, where the Study button is.</p>
    </section>
  );
}
