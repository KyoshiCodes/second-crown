import React from "react";
import "./unit-status.css";

/**
 * Stacked status rows for an Army unit card: power, cost, readiness.
 * Display only. Every input is a value the Army tab already reads from the sim;
 * nothing here changes costs, timings, or outcomes.
 *
 * Rendered with spans (not dl/div) because the unit card is a <button>,
 * which only allows phrasing content.
 */

export type UnitRowKind = "power" | "cost" | "ready";
export type UnitRowTone = "calm" | "warn" | "danger" | "fog";

export interface UnitStatusRow {
  kind: UnitRowKind;
  label: string;
  value: string;
  tone: UnitRowTone;
  /** 0..1 bar fill, only when there is something honest to show. */
  fill?: number;
  /** Adds a moving shimmer to the bar (e.g. a company drilling). */
  live?: boolean;
}

export interface UnitStatusInput {
  /** Unit power from the unit type definition. */
  power: number;
  /** Biggest power in the unit list, so bars compare units against each other. */
  powerMax: number;
  /** Units of this type at home (from listTroopPosts). */
  home: number;
  /** Units of this type away (marching + gathering, from listTroopPosts). */
  away: number;
  /** Cost text already shown on the card (per unit, before discounts). */
  costText: string;
  /** Drill ticks the sim reports for the selected batch size. */
  ticks: number;
  /** Batch size selected with the x1/x5/x10 buttons. */
  qty: number;
  open: boolean;
  lock: string;
  affordable: boolean;
  queueFull: boolean;
  /** Units of this type already in the barracks queue. */
  drilling: number;
  /** 0..1 progress of the first queued job of this type, if one is running. */
  drillProgress?: number;
}

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/** Progress of a training job from the ticks the sim stores on it. */
export function jobProgress(tick: number, startedTick: number, doneTick: number): number | undefined {
  const span = doneTick - startedTick;
  if (!(span > 0) || tick < startedTick) return undefined;
  return clamp01((tick - startedTick) / span);
}

export function unitStatusRows(input: UnitStatusInput): UnitStatusRow[] {
  const { power, powerMax, home, away, costText, ticks, qty, open, lock, affordable, queueFull, drilling, drillProgress } = input;
  const rows: UnitStatusRow[] = [];

  const posted = home > 0 || away > 0 ? ` · ${home} home${away > 0 ? `, ${away} away` : ""}` : "";
  rows.push({
    kind: "power",
    label: "Power",
    value: `${power}${posted}`,
    tone: open ? "calm" : "fog",
    fill: powerMax > 0 ? clamp01(power / powerMax) : undefined,
  });

  rows.push({
    kind: "cost",
    label: "Cost",
    value: open ? `${costText} · x${qty} ${Math.ceil(ticks / 10)}s` : "—",
    tone: !open ? "fog" : affordable ? "calm" : "warn",
  });

  let ready: UnitStatusRow;
  if (!open) {
    ready = { kind: "ready", label: "Ready", value: lock || "Locked", tone: "fog" };
  } else if (drilling > 0) {
    ready = {
      kind: "ready",
      label: "Ready",
      value: `Drilling ${drilling}`,
      tone: queueFull ? "warn" : "calm",
      fill: drillProgress,
      live: true,
    };
  } else if (queueFull) {
    ready = { kind: "ready", label: "Ready", value: "Queue full", tone: "warn" };
  } else if (!affordable) {
    ready = { kind: "ready", label: "Ready", value: "Short of stores", tone: "danger" };
  } else {
    ready = { kind: "ready", label: "Ready", value: "Ready to drill", tone: "calm" };
  }
  rows.push(ready);
  return rows;
}

export function UnitStatus(props: { rows: UnitStatusRow[] }) {
  if (props.rows.length === 0) return null;
  return (
    <span className="sc-unit-status">
      {props.rows.map((r) => (
        <span key={r.kind} className={`sc-unit-row is-${r.kind} tone-${r.tone}${r.live ? " is-live" : ""}`}>
          <span className="sc-unit-row-label">
            <span className="sc-unit-row-pip" aria-hidden="true" />
            {r.label}
          </span>
          <span className="sc-unit-row-value">{r.value}</span>
          {r.fill !== undefined ? (
            <span className="sc-unit-row-bar" aria-hidden="true">
              <span className="sc-unit-row-fill" style={{ width: `${Math.round(r.fill * 100)}%` }} />
            </span>
          ) : null}
        </span>
      ))}
    </span>
  );
}
