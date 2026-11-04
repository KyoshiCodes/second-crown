import React from "react";
import { DECREES, decreeActive, type GameState } from "@second-crown/sim";
import "./decree-hint.css";

type Decree = (typeof DECREES)[number];

/** Cost exactly as the sim table lists it, e.g. "40 gold". */
export function decreeCostText(decree: Decree): string {
  return Object.entries(decree.cost)
    .map(([k, v]) => `${v} ${k}`)
    .join(", ");
}

function affordable(state: GameState, decree: Decree): boolean {
  // Same stock check as DecreeCard: compare stores against listed cost. No new rules.
  return Object.entries(decree.cost).every(([res, amt]) => Number(state.resources[res] ?? "0") >= Number(amt));
}

/**
 * Next decree to point at: the first one in table order that is not active,
 * preferring one the stores can cover now. Read-only.
 */
export function nextDecree(state: GameState): { decree: Decree; ready: boolean } | null {
  const open = DECREES.filter((d) => !decreeActive(state, d.id));
  const ready = open.find((d) => affordable(state, d));
  if (ready) return { decree: ready, ready: true };
  return open.length ? { decree: open[0], ready: false } : null;
}

export function DecreeHint(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const next = nextDecree(state);
  if (!next) {
    return <p className="sc-decree-hint is-done">Next decree · every decree already sworn.</p>;
  }
  const { decree, ready } = next;
  return (
    <p className={`sc-decree-hint${ready ? " is-ready" : ""}`} data-decree={decree.id}>
      Next decree · <strong>{decree.name}</strong> · {decreeCostText(decree)}
      {ready ? "" : " · not enough in stores"}. Swear it on the Crown tab.
    </p>
  );
}
