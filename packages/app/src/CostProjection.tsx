import React from "react";
import { RESEARCH, keepLevel, upgradeCost, upgradeJobFor, type GameState } from "@second-crown/sim";
import { formatHorizon } from "./horizon/horizon";
import { nextResearch } from "./ResearchHint";
import {
  projectCost,
  projectionWorthShowing,
  realmRates,
  type CostProjection,
  type RealmRates,
} from "./projection";
import "./cost-projection.css";
import { isSavingCost } from "./hud/economyPressure";
import { SavingPip } from "./hud/SavingPip";

/**
 * Display-only projections. Compare a cost with current net income (food after army
 * upkeep) and warehouse caps. Never spends, never decides; tryStartResearch and
 * tryUpgrade stay the only gates.
 */

const KEEP_ROMAN = ["none", "I", "II", "III", "IV", "V"];

/** One plain sentence for a study card, or null when the cost is small next to income. */
export function projectionText(p: CostProjection): { text: string; tone: "calm" | "wait" | "stuck" } | null {
  if (!projectionWorthShowing(p) || !p.limiter) return null;
  const over = p.parts.find((x) => x.overCap);
  if (over) {
    return {
      text: `Needs ${over.need} ${over.res}, but stores hold only ${over.cap}. Raise ${over.res} storage first.`,
      tone: "stuck",
    };
  }
  const dry = p.parts.find((x) => x.short > 0 && !Number.isFinite(x.waitSeconds));
  if (dry) return { text: `No ${dry.res} income right now, so the ${dry.short} short will not refill.`, tone: "stuck" };
  const lim = p.limiter;
  const head = `At current income this is about ${formatHorizon(p.productionSeconds)} of ${lim.res} production`;
  if (p.waitSeconds <= 0) return { text: `${head}. Stores cover it now.`, tone: "calm" };
  return { text: `${head}. Ready in about ${formatHorizon(p.waitSeconds)}; ${lim.res} is the limiter.`, tone: "wait" };
}

/** Projection line under a study card's cost row. Hidden for paid studies and cheap ones. */
export function StudyProjection(props: { cost: Readonly<Record<string, string>>; rates: RealmRates; paid: boolean }) {
  if (props.paid) return null;
  const proj = projectCost(props.cost, props.rates);
  const line = projectionText(proj);
  if (!line) return null;
  const saving = isSavingCost(proj);
  return (
    <p
      className={`sc-cost-projection tone-${line.tone}${saving ? " is-saving-cost" : ""}`}
      data-cost-projection={line.tone}
      data-saving={saving ? "true" : undefined}
    >
      {saving ? <SavingPip /> : null}
      {line.text}
    </p>
  );
}

export interface BottleneckEntry {
  /** What the player is saving toward, e.g. "Keep II" or a study name. */
  target: string;
  kind: "study" | "keep";
  res: string;
  /** Seconds until stores cover it; Infinity when they never will at this rate. */
  waitSeconds: number;
  overCap: boolean;
}

/**
 * The next obvious study (same pick as the Research hint) and the next Keep level.
 * One entry per target whose stores do not already cover it, naming the limiting store.
 */
export function bottlenecks(state: GameState, rates: RealmRates = realmRates(state)): BottleneckEntry[] {
  const out: BottleneckEntry[] = [];
  const next = nextResearch(state);
  if (next) {
    const p = projectCost(RESEARCH[next.id].cost, rates);
    if (p.limiter && p.limiter.short > 0) {
      out.push({
        target: RESEARCH[next.id].name,
        kind: "study",
        res: p.limiter.res,
        waitSeconds: p.limiter.waitSeconds,
        overCap: p.limiter.overCap,
      });
    }
  }
  const keep = state.buildings.find((b) => b.realmId === "player" && b.typeId === "keep" && b.completesAtTick === null);
  if (keep && !upgradeJobFor(state, keep.id)) {
    const cost = upgradeCost(state, keep.id);
    if (cost) {
      const p = projectCost(cost, rates);
      if (p.limiter && p.limiter.short > 0) {
        const lv = keepLevel(state) + 1;
        out.push({
          target: `Keep ${KEEP_ROMAN[lv] ?? lv}`,
          kind: "keep",
          res: p.limiter.res,
          waitSeconds: p.limiter.waitSeconds,
          overCap: p.limiter.overCap,
        });
      }
    }
  }
  return out;
}

export function bottleneckPhrase(e: BottleneckEntry): string {
  if (e.overCap) return `${e.res} storage is too small for ${e.target}`;
  if (!Number.isFinite(e.waitSeconds)) return `${e.res} is the limiter for ${e.target} (no ${e.res} income)`;
  return `${e.res} is the limiter for ${e.target} (about ${formatHorizon(e.waitSeconds)})`;
}

/** Small note under the Pace line. Hidden when stores already cover the next study and Keep level. */
export function BottleneckLine(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const list = bottlenecks(state);
  if (list.length === 0) return null;
  const stuck = list.some((e) => e.overCap || !Number.isFinite(e.waitSeconds));
  return (
    <p
      className={`sc-bottleneck-line${stuck ? " is-stuck" : ""}`}
      data-bottleneck={list.map((e) => e.res).join(",")}
      title="Compares the cost of the next study and the next Keep level with what you hold, your net income per second (food after army upkeep), and your warehouse caps. Read-only."
    >
      Limiter · {list.map(bottleneckPhrase).join(" · ")}.
    </p>
  );
}
