import React from "react";
import {
  RESEARCH,
  keepLevel,
  researchDone,
  researchDuration,
  researchKeepMin,
  researchKeepReady,
  researchPrereqReady,
  researchRequires,
  researchTicksLeft,
  upgradeCost,
  upgradeDurationTicks,
  upgradeJobFor,
  type GameState,
} from "@second-crown/sim";
import { formatHorizon } from "./horizon/horizon";
import { nextResearch } from "./ResearchHint";
import {
  blockReasons,
  foodDeficit,
  foodDeficitText,
  formatSignedRate,
  projectCost,
  projectionWorthShowing,
  realmRates,
  starvationNote,
  ticksToSeconds,
  type BlockReason,
  type CostProjection,
  type ProjectGates,
  type RealmRates,
} from "./projection";
import "./cost-projection.css";
import "./hud/starvation-accents.css";
import { isSavingCost } from "./hud/economyPressure";
import { SavingPip } from "./hud/SavingPip";
import { hasWarehouseBlocker, resolveLivingBlockers } from "./hud/blockerAccents";
import { BlockerPip } from "./hud/BlockerPip";

/**
 * Display-only projections. Compare a cost with current net income (food after army
 * upkeep) and warehouse caps. Never spends, never decides; tryStartResearch and
 * tryUpgrade stay the only gates.
 */

const KEEP_ROMAN = ["none", "I", "II", "III", "IV", "V"];
const DOT = " · ";

const approx = (s: number) => `~${formatHorizon(s)}`;

/** " · finishes in ~6h after you start", or "" when the length is unknown. */
function finishTail(finishSeconds?: number): string {
  return finishSeconds !== undefined && finishSeconds > 0
    ? `${DOT}finishes in ${approx(finishSeconds)} after you start`
    : "";
}

/**
 * One plain sentence for a study card, or null when the cost is small next to income.
 * Separates "time to afford" (ready to pay) from "time to finish" (length once started).
 */
export function projectionText(
  p: CostProjection,
  opts: { finishSeconds?: number } = {},
): { text: string; tone: "calm" | "wait" | "stuck" } | null {
  if (!projectionWorthShowing(p) || !p.limiter) return null;
  const over = p.parts.find((x) => x.overCap);
  if (over) {
    return {
      text: `Warehouse too small: needs ${over.need} ${over.res}, stores hold ${over.cap}. Raise ${over.res} storage first.`,
      tone: "stuck",
    };
  }
  const dry = p.parts.find((x) => x.short > 0 && !Number.isFinite(x.waitSeconds));
  if (dry) {
    if (dry.rate < 0) {
      const head =
        dry.res === "food" ? `Food ${formatSignedRate(dry.rate)} after upkeep` : `${dry.res} ${formatSignedRate(dry.rate)}`;
      return { text: `${head}, so the ${dry.short} ${dry.res} short will not refill.`, tone: "stuck" };
    }
    return { text: `No ${dry.res} income right now, so the ${dry.short} short will not refill.`, tone: "stuck" };
  }
  const tail = finishTail(opts.finishSeconds);
  if (p.waitSeconds <= 0) return { text: `Stores cover it now${tail}.`, tone: "calm" };
  return {
    text: `Ready to pay in ${approx(p.waitSeconds)} (${p.limiter.res} is the limiter)${tail}.`,
    tone: "wait",
  };
}

/** Visible "Blocked" label plus every reason, so it reads without hover on touch and keyboard. */
export function BlockedLine(props: { reasons: readonly BlockReason[] }) {
  if (props.reasons.length === 0) return null;
  const living = resolveLivingBlockers(props.reasons);
  const primary = living[0];
  return (
    <p
      className={`sc-blocked-line${primary ? ` is-blocker-${primary}` : ""}`}
      data-blocked={props.reasons.map((r) => r.kind).join(",")}
      data-blocker-accent={living.length > 0 ? living.join(",") : undefined}
    >
      <span className="sc-blocked-label">Blocked</span>{" "}
      {living.map((kind) => (
        <BlockerPip key={kind} kind={kind} />
      ))}
      {living.length > 0 ? " " : null}
      {props.reasons.map((r) => r.text).join(DOT)}
    </p>
  );
}

/** Projection lines under a study card's cost row. Hidden for paid studies; the time line is hidden for cheap ones. */
export function StudyProjection(props: {
  cost: Readonly<Record<string, string>>;
  rates: RealmRates;
  paid: boolean;
  /** Study length once started, in seconds. */
  finishSeconds?: number;
  /** Non-store gates read from the sim (prerequisite, Keep, hall, lectern busy). */
  gates?: ProjectGates;
}) {
  if (props.paid) return null;
  const proj = projectCost(props.cost, props.rates);
  const line = projectionText(proj, { finishSeconds: props.finishSeconds });
  const reasons = props.gates ? blockReasons(proj, props.gates) : [];
  if (!line && reasons.length === 0) return null;
  const warehouseBlocked = hasWarehouseBlocker(proj);
  const saving = line ? !warehouseBlocked && isSavingCost(proj) : false;
  const inlineWarehouse = Boolean(line && warehouseBlocked && reasons.length === 0);
  return (
    <>
      <BlockedLine reasons={reasons} />
      {line ? (
        <p
          className={`sc-cost-projection tone-${line.tone}${saving ? " is-saving-cost" : ""}${inlineWarehouse ? " is-blocker-warehouse" : ""}`}
          data-cost-projection={line.tone}
          data-saving={saving ? "true" : undefined}
          data-blocker-accent={inlineWarehouse ? "warehouse" : undefined}
        >
          {inlineWarehouse ? <BlockerPip kind="warehouse" /> : saving ? <SavingPip /> : null}
          {line.text}
        </p>
      ) : null}
    </>
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
  /** Net rate of the limiting store per second (negative for a food deficit). */
  rate: number;
  /** Length once started, in seconds (0 when unknown). */
  finishSeconds: number;
  /** Gates outside the stores (prerequisite, Keep, lectern busy). */
  gates: BlockReason[];
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
      const ids = Object.keys(RESEARCH) as (keyof typeof RESEARCH)[];
      const running = ids.find((id) => !researchDone(state, id) && researchTicksLeft(state, id) > 0);
      const prereqId = researchRequires(next.id);
      const gates = blockReasons(p, {
        prereq: prereqId && !researchPrereqReady(state, next.id) ? RESEARCH[prereqId].name : undefined,
        keepNeed: researchKeepReady(state, next.id) ? undefined : researchKeepMin(next.id),
        busyWith: running ? RESEARCH[running].name : undefined,
      }).filter((r) => r.kind !== "stores" && r.kind !== "warehouse");
      out.push({
        target: RESEARCH[next.id].name,
        kind: "study",
        res: p.limiter.res,
        waitSeconds: p.limiter.waitSeconds,
        overCap: p.limiter.overCap,
        rate: p.limiter.rate,
        finishSeconds: ticksToSeconds(researchDuration(state, next.id)),
        gates,
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
          rate: p.limiter.rate,
          finishSeconds: ticksToSeconds(upgradeDurationTicks(state, keep.id)),
          gates: [],
        });
      }
    }
  }
  return out;
}

export function bottleneckPhrase(e: BottleneckEntry): string {
  let head: string;
  if (e.overCap) head = `warehouse too small for ${e.res}`;
  else if (!Number.isFinite(e.waitSeconds)) {
    head =
      e.rate < 0 && e.res === "food"
        ? `food ${formatSignedRate(e.rate)} after upkeep, will not refill`
        : `no ${e.res} income, will not refill`;
  } else head = `${e.res} short, ready to pay in ${approx(e.waitSeconds)}`;
  const gates = e.gates.map((g) => `${DOT}${g.text}`).join("");
  return `${e.target}: ${head}${gates}${finishTail(e.finishSeconds)}`;
}

/**
 * Small note under the Pace line. Names what blocks the next study and Keep level, and any
 * food deficit after army upkeep. Hidden when nothing is short and food holds.
 */
export function BottleneckLine(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const rates = realmRates(state);
  const list = bottlenecks(state, rates);
  const deficit = foodDeficitText(rates);
  const starve = starvationNote(state, rates);
  if (list.length === 0 && !deficit && !starve) return null;
  const stuck = Boolean(deficit) || Boolean(starve) || list.some((e) => e.overCap || !Number.isFinite(e.waitSeconds));
  return (
    <div className={`sc-bottleneck-line${stuck ? " is-stuck" : ""}`} data-bottleneck={list.map((e) => e.res).join(",")}>
      {deficit ? (
        <p className="sc-food-deficit" data-food-deficit={foodDeficit(rates) ?? undefined}>
          <span className="sc-blocked-label">Deficit</span> {deficit}.
        </p>
      ) : null}
      {starve ? (
        <p className="sc-food-deficit sc-starve-note" data-starve={starve.state}>
          <span className="sc-blocked-label">{starve.state === "starving" ? "Hunger" : "Hunger soon"}</span> {starve.text}.
        </p>
      ) : null}
      {list.length > 0 ? (
        <p>
          <span className="sc-blocked-label">Limiter</span> {list.map(bottleneckPhrase).join("; ")}.
        </p>
      ) : null}
    </div>
  );
}
