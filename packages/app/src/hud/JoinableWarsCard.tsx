import React from "react";
import {
  WAR_PHASE_TITLE,
  joinSide,
  joinableWars,
  type GameState,
  type JoinableWar,
  type WarSide,
} from "@second-crown/sim";
import type { ActFn } from "../game/useGameEngine";
import { LIVING_CULTURE_PALETTE, resolveLivingCultureKit } from "./BoardLivingRealm";
import "./war-join-imagery.css";

/**
 * Pure read wrapper over `@second-crown/sim`'s `joinableWars(state)` with defensive
 * partial-state guards for minimal UI test fixtures.
 */
export function listJoinableNpcWars(
  state: GameState | null | undefined,
): JoinableWar[] {
  if (!state?.wars || !state.flags || !state.meta) return [];
  return joinableWars(state);
}

/**
 * War tab card listing active NPC-vs-NPC wars the player can join while at peace.
 * Renders one calm Join control per side using `@second-crown/sim`'s `joinSide`.
 */
export const JoinableWarsCard: React.FC<{
  state: GameState | undefined;
  act: ActFn;
}> = ({ state, act }) => {
  const open = listJoinableNpcWars(state);
  if (open.length === 0) return null;

  const onJoinSide = (w: JoinableWar, side: WarSide) => {
    act((st) => {
      const joined = joinSide(st, w.warId, side);
      if (!joined) return "Cannot join that war.";
      const ally = side === "attacker" ? w.attackerName : w.defenderName;
      const foe = side === "attacker" ? w.defenderName : w.attackerName;
      return `Rode beside ${ally} against ${foe}.`;
    });
  };

  return (
    <section
      className="sc-realm-card sc-join-wars-card"
      data-joinable-wars={open.length}
      style={{ margin: "10px 0", fontSize: 13 }}
    >
      <strong style={{ display: "block", marginBottom: 4 }}>Other kingdoms at war</strong>
      <p className="sc-join-wars-note">
        Pick a side while at peace. Your war shares their phase clock.
      </p>
      <div className="sc-join-wars-list">
        {open.map((w) => {
          const atkPal =
            LIVING_CULTURE_PALETTE[resolveLivingCultureKit(state, w.attackerRealmId)];
          const defPal =
            LIVING_CULTURE_PALETTE[resolveLivingCultureKit(state, w.defenderRealmId)];
          return (
            <div
              key={w.warId}
              className="sc-join-war-row"
              data-join-war-row={w.warId}
              data-phase={w.phase}
            >
              <div className="sc-join-war-head">
                <span className="sc-join-war-matchup">
                  <span
                    className="sc-join-war-dot"
                    style={{ background: atkPal.tunic }}
                    aria-hidden="true"
                  />
                  <span>{w.attackerName}</span>
                  <span className="sc-join-war-vs">vs</span>
                  <span
                    className="sc-join-war-dot"
                    style={{ background: defPal.tunic }}
                    aria-hidden="true"
                  />
                  <span>{w.defenderName}</span>
                </span>
                <span className={`sc-join-war-phase-pill is-phase-${w.phase}`}>
                  {WAR_PHASE_TITLE[w.phase]}
                </span>
              </div>
              <div className="sc-join-war-actions">
                <button
                  type="button"
                  className="sc-join-war-btn"
                  data-join-war={w.warId}
                  data-join-side="attacker"
                  disabled={!w.sides.attacker}
                  style={
                    { "--sc-join-side-color": atkPal.tunic } as React.CSSProperties
                  }
                  title={
                    !w.sides.attacker
                      ? `Peace-locked with ${w.defenderName}`
                      : `Ride beside ${w.attackerName} against ${w.defenderName}`
                  }
                  onClick={() => onJoinSide(w, "attacker")}
                >
                  Join {w.attackerName}
                </button>
                <button
                  type="button"
                  className="sc-join-war-btn"
                  data-join-war={w.warId}
                  data-join-side="defender"
                  disabled={!w.sides.defender}
                  style={
                    { "--sc-join-side-color": defPal.tunic } as React.CSSProperties
                  }
                  title={
                    !w.sides.defender
                      ? `Peace-locked with ${w.attackerName}`
                      : `Ride beside ${w.defenderName} against ${w.attackerName}`
                  }
                  onClick={() => onJoinSide(w, "defender")}
                >
                  Join {w.defenderName}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
