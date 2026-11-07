import React from "react";
import type { HoldView } from "../net/hold";
import "./hold-status-stack.css";

/**
 * Stacked living status rows on the joined hold panel: works, stores, stamps, key, leave.
 * Display only. Every value is read from the HoldView the server sent or from the card's own UI
 * state (key shown / copied, leave confirm open). No new game math, no sim calls.
 */

export type HoldStatusKind = "works" | "stores" | "stamps" | "key" | "leave";

export type HoldStatusTone = "you" | "busy" | "warn" | "calm" | "none";

export type HoldStatusRow = {
  kind: HoldStatusKind;
  label: string;
  value: string;
  tone: HoldStatusTone;
};

export type HoldStatusInput = {
  view: HoldView;
  /** The key the first join made, shown once. Null when the player joined with a key. */
  madeKey: string | null;
  copied: boolean;
  confirmLeave: boolean;
};

/** Whole units for display. The hold keeps the sim's exact decimal strings. */
export function wholeUnits(value: string): string {
  const n = Number(value);
  return Number.isFinite(n) ? Math.floor(n).toLocaleString() : value;
}

const STORES = [
  ["food", "Food"],
  ["wood", "Wood"],
  ["stone", "Stone"],
  ["gold", "Gold"],
] as const;

/** Builds the five rows, always in the same order. Pure: does not touch the view. */
export function holdStatusRows(input: HoldStatusInput): HoldStatusRow[] {
  const { view, madeKey, copied, confirmLeave } = input;
  const rows: HoldStatusRow[] = [];

  // Works: the four counts the hold work cards show, plus militia in training.
  const works = `${view.militia} militia · ${view.farms} farms · ${view.cottages} cottages · ${view.lumberCamps} lumber`;
  rows.push(
    view.training > 0
      ? { kind: "works", label: "Works", value: `${works} · +${view.training} training`, tone: "busy" }
      : { kind: "works", label: "Works", value: works, tone: "calm" }
  );

  // Stores: the four store strings, floored for display like the store cards.
  const allEmpty = STORES.every(([id]) => !(Number(view.stores[id]) >= 1));
  rows.push({
    kind: "stores",
    label: "Stores",
    value: STORES.map(([id, name]) => `${name} ${wholeUnits(view.stores[id])}`).join(" · "),
    tone: allEmpty ? "none" : "calm",
  });

  // Stamps: how many, and the newest one.
  const last = view.stamps[view.stamps.length - 1];
  rows.push(
    last
      ? {
          kind: "stamps",
          label: "Stamps",
          value: `${view.stamps.length} · last tick ${last.tick} by ${last.by}`,
          tone: "you",
        }
      : { kind: "stamps", label: "Stamps", value: "None yet", tone: "none" }
  );

  // Key: the one-time key card state. The key itself is never repeated here.
  if (madeKey !== null && copied) rows.push({ kind: "key", label: "Key", value: "New key copied", tone: "you" });
  else if (madeKey !== null) rows.push({ kind: "key", label: "Key", value: "New key shown once · copy it now", tone: "warn" });
  else rows.push({ kind: "key", label: "Key", value: "Joined with key", tone: "calm" });

  // Leave: whether the confirm card is open.
  rows.push(
    confirmLeave
      ? { kind: "leave", label: "Leave", value: "Confirm open · hold keeps running", tone: "warn" }
      : { kind: "leave", label: "Leave", value: "Solo crown untouched", tone: "calm" }
  );

  return rows;
}

export function HoldStatusStack(props: HoldStatusInput) {
  const rows = holdStatusRows(props);
  return (
    <dl className="sc-holdstat" aria-label="Hold living status">
      {rows.map((r) => (
        <div key={r.kind} className={`sc-holdstat-row is-${r.kind} tone-${r.tone}`}>
          <dt className="sc-holdstat-label">
            <span className="sc-holdstat-pip" aria-hidden="true" />
            {r.label}
          </dt>
          <dd className="sc-holdstat-value">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
