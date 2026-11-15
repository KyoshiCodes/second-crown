import React from "react";
import type { HoldView } from "../net/hold";
import { HoldStampPip } from "./HoldStampPip";
import { getHoldViewSnapshot, subscribeHoldView } from "./holdWatch";
import "./stamps-status-line.css";

/** How many stamps the line lists, newest first. The rest are counted as "older". */
export const STAMPS_LISTED = 5;

/**
 * What a stamp lasts and grants, in words. The sim's stamp (`packages/sim/src/actions/stamp.ts`)
 * only adds a record to the hold's input log: it has no timer and changes no stores, works or
 * militia. So every stamp is active for the life of the hold and grants nothing. If the sim ever
 * gives stamps a duration or an effect, these two texts must change with it.
 */
export const STAMP_REMAINING_TEXT = "no time limit, a stamp never runs out";
export const STAMP_EFFECT_TEXT = "none, a stamp is a mark in the hold's log and changes no stores, works or militia";

export interface StampRow {
  by: string;
  tick: number;
  /** Hold ticks since the stamp landed. Never negative. */
  age: number;
  text: string;
}

export interface StampsStatus {
  /** "solo": no hold joined. "empty": a hold with no stamps. "active": a hold with stamps. */
  kind: "solo" | "empty" | "active";
  /** The realm id as typed on the Join hold card, or null in solo play. */
  realm: string | null;
  /** Every stamp counts: stamps do not expire. */
  active: number;
  /** Up to STAMPS_LISTED stamps, newest first. */
  rows: StampRow[];
  /** Active stamps that are not listed. */
  older: number;
  /** Stamps sent but not yet landed: the hold's pending count, which is stamps only. */
  pending: number;
  headline: string;
  /** The whole line as plain text, for labels and tests. */
  text: string;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Reads the hold view the server sent and builds the line's text. No rules and no stamp math here. */
export function stampsStatus(view: HoldView | null): StampsStatus {
  if (!view) {
    const headline = "No shared hold joined";
    return {
      kind: "solo",
      realm: null,
      active: 0,
      rows: [],
      older: 0,
      pending: 0,
      headline,
      text: `Stamps · ${headline} · Stamps exist only in a shared hold. Join one on the Cloud panel.`,
    };
  }

  const realm = view.realmId.replace(/^join-/, "");
  const active = view.stamps.length;
  const pending = view.pending;
  const rows = view.stamps
    .slice(-STAMPS_LISTED)
    .reverse()
    .map((s) => {
      const age = Math.max(0, view.tick - s.tick);
      return {
        by: s.by,
        tick: s.tick,
        age,
        text: `${s.by} at tick ${s.tick} (${age === 0 ? "this tick" : `${plural(age, "tick", "ticks")} ago`})`,
      };
    });
  const older = active - rows.length;
  const pendingText = pending > 0 ? ` · ${pending} landing on the next tick` : "";

  if (active === 0) {
    const headline = "None active";
    return {
      kind: "empty",
      realm,
      active,
      rows,
      older,
      pending,
      headline,
      text: `Stamps · Hold ${realm} · ${headline}${pendingText} · Press Stamp on the Cloud panel's hold card. Effect: ${STAMP_EFFECT_TEXT}`,
    };
  }

  const headline = `${active} active`;
  const list = rows.map((r) => r.text).join(", ") + (older > 0 ? `, +${older} older` : "");
  return {
    kind: "active",
    realm,
    active,
    rows,
    older,
    pending,
    headline,
    text: `Stamps · Hold ${realm} · ${headline}${pendingText} · ${list} · Remaining: ${STAMP_REMAINING_TEXT} · Effect: ${STAMP_EFFECT_TEXT}`,
  };
}

/**
 * Read-only stamps status line for the Kingdom tab and the province inspect card: the joined
 * hold's active stamps, how long they last, and what they grant. It has no button; stamping stays
 * on the Cloud panel's Join hold card.
 *
 * With no `view` prop it follows the hold joined on the Join hold card (hud/holdWatch.ts).
 */
export function StampsStatusLine(props: { view?: HoldView | null }) {
  const watched = React.useSyncExternalStore(subscribeHoldView, getHoldViewSnapshot, getHoldViewSnapshot);
  const view = props.view === undefined ? watched : props.view;
  const s = stampsStatus(view);
  return (
    <div
      className={`sc-stamps-status-line is-${s.kind}`}
      data-stamps-status={s.kind}
      data-stamps-active={s.active}
      aria-label={s.text}
    >
      <HoldStampPip size={14} className="sc-stamps-status-icon" />
      <span className="sc-stamps-status-text">
        <span className="sc-stamps-status-label">Stamps</span>
        {s.realm !== null ? (
          <>
            {" "}
            · Hold <strong>{s.realm}</strong>
          </>
        ) : null}{" "}
        · <span className="sc-stamps-status-headline">{s.headline}</span>
        {s.pending > 0 ? (
          <>
            {" "}
            · <span className="sc-stamps-status-pending">{s.pending} landing on the next tick</span>
          </>
        ) : null}
        {s.kind === "solo" ? (
          <>
            {" "}
            · <span className="sc-stamps-status-note">Stamps exist only in a shared hold. Join one on the Cloud panel.</span>
          </>
        ) : null}
        {s.kind === "empty" ? (
          <>
            {" "}
            ·{" "}
            <span className="sc-stamps-status-note">
              Press Stamp on the Cloud panel's hold card. Effect: {STAMP_EFFECT_TEXT}
            </span>
          </>
        ) : null}
        {s.kind === "active" ? (
          <>
            {" "}
            ·{" "}
            <span className="sc-stamps-status-list">
              {s.rows.map((r, i) => (
                <span key={`${r.tick}-${r.by}-${i}`} className="sc-stamps-status-stamp">
                  {i > 0 ? ", " : ""}
                  {r.text}
                </span>
              ))}
              {s.older > 0 ? <span className="sc-stamps-status-older">, +{s.older} older</span> : null}
            </span>{" "}
            · <span className="sc-stamps-status-remaining">Remaining: {STAMP_REMAINING_TEXT}</span> ·{" "}
            <span className="sc-stamps-status-effect">Effect: {STAMP_EFFECT_TEXT}</span>
          </>
        ) : null}
      </span>
    </div>
  );
}
