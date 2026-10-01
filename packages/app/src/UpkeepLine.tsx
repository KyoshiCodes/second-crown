import React from "react";
import { armyMouths, upkeepPerTick, vaultProtects, type GameState } from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";

/** Army upkeep as a Kingdom-style work card. Vault floor rides along in the perks line. */
export function UpkeepLine(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const mouths = armyMouths(state);
  const perTick = upkeepPerTick(state);
  const perSec = perTick * TICKS_PER_SECOND;
  return (
    <div className={["sc-work-card", mouths > 0 ? "is-staffed" : "is-empty"].join(" ")}>
      <div className="sc-work-head">
        <span className="sc-work-name">Upkeep</span>
        <span className="sc-work-level">{mouths} mouths</span>
      </div>
      <div className="sc-work-status">
        {perTick.toFixed(2)} food/tick ({perSec.toFixed(1)}/s)
      </div>
      <div className="sc-work-perks">Champions eat free.</div>
      <div className="sc-work-perks">
        Vault floor · food {vaultProtects(state, "food")} · wood {vaultProtects(state, "wood")} · stone{" "}
        {vaultProtects(state, "stone")} · gold {vaultProtects(state, "gold")}
      </div>
    </div>
  );
}
