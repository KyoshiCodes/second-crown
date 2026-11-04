import React from "react";
import { ascendThreshold, canAscend, formatLetterSuffix, type GameState } from "@second-crown/sim";
import { sharedRealmId } from "./game/settleOnLoad";
import "./age-line.css";

/**
 * Small read-only Kingdom-tab line: the current age (Dawn count, flags.prestige_level, same as the
 * Crown tab's Second Dawn card) and what the next age needs (sim ascendThreshold / canAscend).
 * No new rules; ascending still happens only from the Crown tab.
 */
export function AgeLine(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const dawn = Number(state.flags["prestige_level"] ?? 0);
  const shared = sharedRealmId(state) !== null;
  if (shared) {
    return (
      <p className="sc-age-line" data-dawn={dawn}>
        Age · <strong>Dawn {dawn}</strong> · a shared hold has no Second Dawn.
      </p>
    );
  }
  const ready = canAscend(state);
  const need = formatLetterSuffix(ascendThreshold(state));
  return (
    <p className={`sc-age-line${ready ? " is-ready" : ""}`} data-dawn={dawn} data-ready={ready ? "true" : "false"}>
      Age · <strong>Dawn {dawn}</strong> · next age at {need} total resources
      {ready ? " · ready, ascend from the Crown tab." : "."}
    </p>
  );
}
