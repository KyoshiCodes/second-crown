import React from "react";
import { armyMouths, upkeepPerTick, type GameState } from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";

export function UpkeepLine(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const mouths = armyMouths(state);
  const perTick = upkeepPerTick(state);
  const perSec = perTick * TICKS_PER_SECOND;
  return (
    <p style={{ fontSize: 12, opacity: 0.85 }}>
      Upkeep · {mouths} mouths · {perTick.toFixed(2)} food/tick ({perSec.toFixed(1)}/s). Champions eat free.
    </p>
  );
}
