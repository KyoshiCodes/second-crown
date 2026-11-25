import React from "react";
import type { AwaySummary } from "../game/awaySummary";
import "./away-summary.css";
import "./away-dispatch.css";
import { AwayReturnSeal, resolveAwaySpanTier } from "./AwayReturnSeal";

const DOT = " · ";

/**
 * "While you were away" card shown once after offline settlement. Read-only; the
 * dismiss button only hides it. Rows with nothing to say are left out.
 */
export function AwaySummaryBanner(props: { summary: AwaySummary | null; onDismiss: () => void }) {
  const s = props.summary;
  if (!s) return null;
  const rows: { label: string; text: string; key: string }[] = [];
  if (s.works.length) rows.push({ key: "works", label: "Works", text: s.works.join(DOT) });
  if (s.studies.length) rows.push({ key: "studies", label: "Studies", text: s.studies.join(DOT) });
  if (s.events.length) {
    rows.push({
      key: "events",
      label: "Events",
      text: s.events.join(DOT) + (s.moreEvents > 0 ? `${DOT}+${s.moreEvents} more in the ledger` : ""),
    });
  }
  const stores = [s.changes.join(", "), s.full.length ? `full: ${s.full.join(", ")}` : ""].filter(Boolean).join(DOT);
  if (stores) rows.push({ key: "stores", label: "Stores", text: stores });
  const spanTier = resolveAwaySpanTier(s.elapsed);
  return (
    <section
      className={`sc-away sc-away-dispatch is-span-${spanTier}`}
      role="status"
      aria-label="While you were away"
      data-away-elapsed={s.elapsed}
      data-away-span={spanTier}
    >
      <span className="sc-away-dispatch-sheen" aria-hidden="true" />
      <div className="sc-away-head">
        <AwayReturnSeal elapsed={s.elapsed} />
        <span className="sc-away-dispatch-kicker" aria-hidden="true">Dispatch</span>
        <strong>While you were away</strong>
        <span className="sc-away-elapsed">{s.elapsed} settled</span>
        <button type="button" className="sc-away-close" onClick={props.onDismiss} aria-label="Dismiss away summary">
          ×
        </button>
      </div>
      {rows.length === 0 ? <p className="sc-away-row">Quiet. Nothing finished and nothing struck the hold.</p> : null}
      {rows.map((r) => (
        <p key={r.key} className="sc-away-row" data-away-row={r.key}>
          <span className="sc-away-label">{r.label}</span> {r.text}
        </p>
      ))}
      {s.next ? (
        <p className="sc-away-row sc-away-next" data-away-row="next">
          <span className="sc-away-label">Next</span> {s.next}
        </p>
      ) : null}
    </section>
  );
}
