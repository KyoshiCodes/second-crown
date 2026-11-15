import React from "react";
import { DOCTRINES, formatLetterSuffix, playerTitle, type GameState } from "@second-crown/sim";
import { AgeGlyphPip } from "../AgeLine";
import { prestigeStatus } from "../PrestigeLine";
import "./prestige-rank-line.css";

/**
 * Display-only copy of the sim's yield step. `rateFor` in `systems/economy.ts` multiplies every
 * building's yield by `1 + productionBonus * 0.04`, and `productionBonus` adds one point per dawn
 * (`flags.prestige_level`). The sim does not export the 0.04, and this slice may not edit the sim.
 * PrestigeRankLine.test.tsx checks it against `productionBonus` and `computeIncomePerSecond`.
 */
export const YIELD_PCT_PER_PRODUCTION = 4;

export interface PrestigeRank {
  /** Current rank: `flags.prestige_level` in the save. */
  dawn: number;
  /** The sim's `playerTitle`. Dawns raise it; so do won wars. */
  title: string;
  /** The sim's `ascendThreshold`: total resources needed for the next dawn. */
  need: number;
  /** Whole percent of the way to the next dawn, 0..100 (from `prestigeStatus`). */
  percent: number;
  /** The sim's `canAscend`. */
  ready: boolean;
  /** A shared hold has no Second Dawn. */
  shared: boolean;
  /** Production points this rank adds to every finished building (one per dawn). */
  production: number;
  /** The same bonus as a percent of building yield. */
  yieldPct: number;
  /** The doctrine sworn this crown, or null. Doctrines open at Dawn 1. */
  doctrine: { name: string; blurb: string } | null;
  /** True when the one-time first-dawn gift (1 militia, 20 food, 10 wood) is still unclaimed. */
  giftPending: boolean;
  rankText: string;
  nextText: string;
  grantsText: string;
  /** What one more dawn adds. */
  nextGrantsText: string;
}

const bonus = (points: number) => `+${points} production on every finished building (+${points * YIELD_PCT_PER_PRODUCTION}% yield)`;

/** Reads the sim's prestige helpers and builds the line's text. No rules here. */
export function prestigeRank(state: GameState): PrestigeRank {
  const s = prestigeStatus(state);
  const dawn = Number.isFinite(s.dawn) ? Math.max(0, s.dawn) : 0;
  const title = playerTitle(state);
  const sworn = DOCTRINES.find((d) => d.id === state.flags.doctrine);
  const doctrine = dawn >= 1 && sworn ? { name: sworn.name, blurb: sworn.blurb } : null;
  const giftPending = !state.flags.dawn_gift;

  const doctrineText =
    dawn < 1 ? "" : doctrine ? ` · ${doctrine.name}: ${doctrine.blurb}` : " · a doctrine, not sworn yet (Crown tab)";
  const grantsText = dawn < 1 ? "Grants: nothing yet" : `Grants: ${bonus(dawn)}${doctrineText}`;

  const nextParts = [bonus(dawn + 1)];
  if (dawn < 1) nextParts.push("a doctrine");
  else nextParts.push("a fresh doctrine pick");
  if (giftPending) nextParts.push("a one-time gift of 1 militia, 20 food and 10 wood");

  return {
    dawn,
    title,
    need: s.need,
    percent: s.percent,
    ready: s.ready,
    shared: s.shared,
    production: dawn,
    yieldPct: dawn * YIELD_PCT_PER_PRODUCTION,
    doctrine,
    giftPending,
    rankText: `Dawn ${dawn} · ${title}`,
    nextText: s.shared
      ? "A shared hold has no Second Dawn"
      : s.ready
        ? `Ready for Dawn ${dawn + 1}: ascend from the Kingdom or Crown tab`
        : `Dawn ${dawn + 1} at ${formatLetterSuffix(s.need)} total resources (${s.percent}% there)`,
    grantsText,
    nextGrantsText: s.shared ? "" : `Dawn ${dawn + 1} grants: ${nextParts.join(", ")}`,
  };
}

/**
 * Read-only prestige line for the Kingdom tab and the province inspect card: the current rank,
 * what the next rank needs, and what the rank grants. It has no button; ascending stays on the
 * Kingdom tab's Age line and the Crown tab.
 *
 * `threshold={false}` leaves out the "next rank needs" part. The Kingdom tab uses it because the
 * Age line right above already shows that figure with a progress bar.
 */
export function PrestigeRankLine(props: { state: GameState | undefined; threshold?: boolean }) {
  const { state, threshold = true } = props;
  if (!state) return null;
  const r = prestigeRank(state);
  const stateClass = r.shared ? " is-shared" : r.ready ? " is-ready" : " is-waiting";
  return (
    <div
      className={`sc-prestige-rank-line${stateClass}`}
      data-dawn={r.dawn}
      data-ready={r.ready ? "true" : "false"}
      data-production={r.production}
    >
      <AgeGlyphPip dawn={r.dawn} ready={r.ready} shared={r.shared} size={14} className="sc-prestige-rank-icon" />
      <span className="sc-prestige-rank-text">
        <span className="sc-prestige-rank-label">Prestige</span> · <strong>{r.rankText}</strong>
        {threshold ? (
          <>
            {" "}
            · <span className="sc-prestige-rank-next">{r.nextText}</span>
          </>
        ) : null}
        {" "}
        · <span className={`sc-prestige-rank-grants${r.production > 0 ? " is-active" : ""}`}>{r.grantsText}</span>
        {r.nextGrantsText ? (
          <>
            {" "}
            · <span className="sc-prestige-rank-upcoming">{r.nextGrantsText}</span>
          </>
        ) : null}
      </span>
    </div>
  );
}
