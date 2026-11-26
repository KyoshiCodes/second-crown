import React from "react";
import { playerWarPhase, WAR_PHASE_IDS, WAR_PHASE_TITLE, type GameState } from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import "./war-phase.css";
import "./living-realm-ui.css";

/**
 * War phase strip for the War tab: a four-step meter (columns, skirmish, clash, aftermath)
 * and the phase's one readable line. Reads `playerWarPhase` only; no game math here.
 * `data-phase` carries the stable sim phase id for styling.
 */
export function WarPhaseLine(props: { state: GameState | undefined }) {
  const { state } = props;
  const phase = state ? playerWarPhase(state) : null;
  if (!state || !phase) return null;
  const left = phase.untilTick !== null ? Math.max(0, Math.ceil((phase.untilTick - state.meta.tick) / TICKS_PER_SECOND)) : null;
  return (
    <div className="sc-war-phase" data-phase={phase.id} role="status" aria-label={`War phase: ${phase.title}`}>
      <ol className="sc-war-phase-steps" aria-hidden="true">
        {WAR_PHASE_IDS.map((id, i) => (
          <li key={id} className={`sc-war-phase-step${i + 1 < phase.step ? " is-past" : ""}${i + 1 === phase.step ? " is-now" : ""}`}>
            {WAR_PHASE_TITLE[id]}
          </li>
        ))}
      </ol>
      <p className="sc-war-phase-line">
        <span className="sc-war-phase-pip" aria-hidden="true" />
        <strong>{phase.title}.</strong> {phase.line}
        {left !== null && phase.id !== "aftermath" ? <span className="sc-war-phase-left"> Next in {left}s.</span> : null}
      </p>
    </div>
  );
}
