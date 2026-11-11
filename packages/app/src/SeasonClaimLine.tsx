import React from "react";
import {
  SEASONS,
  currentSeason,
  seasonBoonPreview,
  seasonClaimed,
  tryClaimSeason,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";
import "./season-claim-line.css";

/**
 * Display-only copies of two sim clock lengths. The sim owns the rules (`systems/age.ts` turns the
 * season every 2000 ticks, `systems/dayNight.ts` runs a 3600-tick day) but exports neither number.
 * SeasonClaimLine.test.tsx checks both against the sim's own exported helpers, so a sim change
 * fails the test instead of quietly showing a wrong countdown.
 */
export const SEASON_TICKS = 2000;
export const DAY_TICKS = 3600;

export interface SeasonClaimStatus {
  season: string;
  nextSeason: string;
  ticksLeft: number;
  /** Game days left in the season, rounded up to one decimal so it never reads 0.0. */
  daysLeft: number;
  /** Real seconds left, same rounding as the other pace lines (10 ticks per second). */
  secondsLeft: number;
  res: string;
  amount: number;
  /** True when this season's court boon has not been claimed yet. */
  ready: boolean;
}

/** Ticks until the season turns. Always 1..SEASON_TICKS. */
export function seasonTicksLeft(tick: number): number {
  const into = ((Math.floor(tick) % SEASON_TICKS) + SEASON_TICKS) % SEASON_TICKS;
  return SEASON_TICKS - into;
}

/** Reads the sim's season helpers and adds a countdown. No rules here. */
export function seasonClaimStatus(state: GameState): SeasonClaimStatus {
  const season = currentSeason(state);
  const boon = seasonBoonPreview(state);
  const ticksLeft = seasonTicksLeft(state.meta.tick);
  return {
    season,
    nextSeason: SEASONS[(SEASONS.indexOf(season) + 1) % SEASONS.length],
    ticksLeft,
    daysLeft: Math.ceil((ticksLeft * 10) / DAY_TICKS) / 10,
    secondsLeft: Math.ceil(ticksLeft / 10),
    res: boon.res,
    amount: boon.amount,
    ready: !seasonClaimed(state),
  };
}

/**
 * Kingdom-tab season line: season name, days left, and a Claim button while this season's court
 * boon is unclaimed. The button runs the same sim call as the Crown tab's Season court card.
 */
export function SeasonClaimLine(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  if (!state) return null;
  const s = seasonClaimStatus(state);
  return (
    <div
      className={`sc-season-claim${s.ready ? " is-ready" : " is-claimed"}`}
      data-season={s.season.toLowerCase()}
      data-ready={s.ready ? "true" : "false"}
    >
      <span className="sc-season-claim-dot" aria-hidden="true" />
      <span className="sc-season-claim-text">
        Season · <strong>{s.season}</strong> · {s.daysLeft.toFixed(1)} days left ({s.secondsLeft}s) ·{" "}
        {s.ready
          ? `season court ready: +${s.amount} ${s.res}`
          : `season court claimed, next in ${s.nextSeason}`}
      </span>
      {s.ready ? (
        <button
          type="button"
          className="sc-work-btn sc-season-claim-btn"
          onClick={() => act((st) => (tryClaimSeason(st) ? "Season court collected." : "Already claimed this season."))}
        >
          Claim
        </button>
      ) : null}
    </div>
  );
}
