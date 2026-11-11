import React from "react";
import {
  autoHealActive,
  autoHealAmount,
  autoHealTicksLeft,
  countBuilding,
  woundedCount,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import "./infirmary-heal.css";

export type InfirmaryHeal =
  | { kind: "healing"; wounded: number; next: number; seconds: number }
  | { kind: "unstaffed"; wounded: number };

/** What the Infirmary is doing for the wounded right now. Null when there is nothing to say. Reads the sim; no rules here. */
export function infirmaryHeal(state: GameState): InfirmaryHeal | null {
  const wounded = woundedCount(state);
  if (wounded < 1) return null;
  if (autoHealActive(state)) {
    return {
      kind: "healing",
      wounded,
      next: autoHealAmount(wounded),
      seconds: Math.ceil(autoHealTicksLeft(state) / TICKS_PER_SECOND),
    };
  }
  return countBuilding(state, "infirmary") > 0 ? { kind: "unstaffed", wounded } : null;
}

/** Short auto-heal status line for the Wounded card on the Army tab. */
export function InfirmaryHealLine(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const heal = infirmaryHeal(state);
  if (!heal) return null;
  if (heal.kind === "unstaffed") {
    return (
      <div className="sc-infirmary-heal is-idle" data-infirmary-heal="unstaffed">
        Not healing · no worker at the Infirmary
      </div>
    );
  }
  return (
    <div className="sc-infirmary-heal is-healing" data-infirmary-heal="healing">
      <span className="sc-infirmary-heal-dot" aria-hidden="true" />
      Healing · {heal.wounded} wounded
      <span className="sc-infirmary-heal-next">
        {" "}
        · next {heal.next} in {heal.seconds}s
      </span>
    </div>
  );
}
