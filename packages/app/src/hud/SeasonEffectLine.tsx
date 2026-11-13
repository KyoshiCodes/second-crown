import React from "react";
import { currentSeason, type GameState } from "@second-crown/sim";
import { SeasonPip } from "./SeasonPip";
import "./season-effect.css";

type Season = ReturnType<typeof currentSeason>;

/**
 * Display-only copy of the season yield rule. The sim owns it (`seasonProductionBonus` in
 * `systems/age.ts`: one production step in Spring and Autumn, none in Summer and Winter) but does
 * not export it. SeasonEffectLine.test.tsx checks this table against the sim's exported
 * `productionBonus`, so a sim change fails the test instead of quietly showing a wrong number.
 */
export const SEASON_YIELD_STEPS: Record<Season, number> = {
  Spring: 1,
  Summer: 0,
  Autumn: 1,
  Winter: 0,
};

/** One production step adds this many percent to building yields (`rateFor` in `systems/economy.ts`). */
export const YIELD_PCT_PER_STEP = 4;

/**
 * What the season does to sight. The season never changes vision range itself: it sets the odds
 * for the season's sky (`systems/weather.ts`), and only snow and storm thicken the fog. Snow is the
 * likely winter sky; in the other seasons only the rarer storm shortens sight. Wording only, no
 * numbers, and the test checks the split against the sim through `isProvinceSeen`.
 */
export const SEASON_SIGHT: Record<Season, { risk: "snow" | "storm"; text: string }> = {
  Spring: { risk: "storm", text: "Sight: normal unless a storm sets in" },
  Summer: { risk: "storm", text: "Sight: normal unless a storm sets in" },
  Autumn: { risk: "storm", text: "Sight: normal unless a storm sets in" },
  Winter: { risk: "snow", text: "Sight: snow is likely and shortens it" },
};

export interface SeasonEffectStatus {
  season: Season;
  /** Percent added to building yields by the season. 0 in Summer and Winter. */
  yieldPct: number;
  yieldText: string;
  sightRisk: "snow" | "storm";
  sightText: string;
}

/** Reads the current season from the sim and looks up its effect text. No rules here. */
export function seasonEffectStatus(state: GameState): SeasonEffectStatus {
  const season = currentSeason(state);
  const yieldPct = SEASON_YIELD_STEPS[season] * YIELD_PCT_PER_STEP;
  const sight = SEASON_SIGHT[season];
  return {
    season,
    yieldPct,
    yieldText: yieldPct > 0 ? `Building yields +${yieldPct}%` : "No yield bonus",
    sightRisk: sight.risk,
    sightText: sight.text,
  };
}

/**
 * Season status line: season name, what it does to building yields, and what it does to sight.
 * Read-only. Used on the Kingdom tab and on the province inspect card.
 */
export function SeasonEffectLine(props: { state: GameState | undefined; className?: string }) {
  const { state, className = "" } = props;
  if (!state) return null;
  const s = seasonEffectStatus(state);
  return (
    <div
      className={`sc-season-effect is-${s.season.toLowerCase()}${s.yieldPct > 0 ? " has-yield" : ""}${className ? ` ${className}` : ""}`}
      data-season={s.season.toLowerCase()}
      data-yield-pct={s.yieldPct}
      data-sight-risk={s.sightRisk}
    >
      <SeasonPip season={s.season} size={14} />
      <span className="sc-season-effect-text">
        <span className="sc-season-effect-label">Season</span> · <strong>{s.season}</strong> ·{" "}
        <span className="sc-season-effect-yield">{s.yieldText}</span> ·{" "}
        <span className="sc-season-effect-sight">{s.sightText}</span>
      </span>
    </div>
  );
}
