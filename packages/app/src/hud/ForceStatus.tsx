import React from "react";
import "./force-status.css";

/**
 * Stacked status rows for a War Room force card: power, ETA, risk.
 * Display only. Every input is a value the War Room already reads from the sim;
 * nothing here changes or predicts game outcomes.
 */

export type ForceRowKind = "power" | "eta" | "risk";
export type ForceRowTone = "calm" | "warn" | "danger" | "fog";

export interface ForceStatusRow {
  kind: ForceRowKind;
  label: string;
  value: string;
  tone: ForceRowTone;
  /** 0..1 bar fill, when there is something honest to show. */
  fill?: number;
}

export interface ForceStatusInput {
  /** Power figure already read from the sim, or undefined when hidden by fog. */
  power?: number;
  /** Biggest power on screen, so bars compare forces against each other. */
  powerMax?: number;
  /** Seconds to arrival; undefined means the force is posted, not moving. */
  seconds?: number;
  /** 0..1 trip progress, only when the sim stores the trip length. */
  progress?: number;
  /** Text shown in the ETA row instead of seconds (e.g. "gathering"). */
  etaNote?: string;
  risk: { value: string; tone: ForceRowTone };
}

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/** Trip progress from fields the sim already stores (gathers have travelTicks). */
export function tripProgress(tick: number, arrivesTick: number, travelTicks: number): number | undefined {
  if (!(travelTicks > 0)) return undefined;
  return clamp01(1 - (arrivesTick - tick) / travelTicks);
}

export function forceStatusRows(input: ForceStatusInput): ForceStatusRow[] {
  const { power, powerMax, seconds, progress, etaNote, risk } = input;
  const rows: ForceStatusRow[] = [];

  rows.push(
    power === undefined
      ? { kind: "power", label: "Power", value: "?", tone: "fog" }
      : {
          kind: "power",
          label: "Power",
          value: String(power),
          tone: "calm",
          fill: powerMax && powerMax > 0 ? clamp01(power / powerMax) : undefined,
        },
  );

  if (seconds === undefined) {
    rows.push({ kind: "eta", label: "ETA", value: etaNote ?? "Posted", tone: "calm" });
  } else {
    rows.push({
      kind: "eta",
      label: "ETA",
      value: etaNote ? `${etaNote} · ${seconds}s` : `${seconds}s`,
      tone: "calm",
      fill: progress === undefined ? undefined : clamp01(progress),
    });
  }

  rows.push({ kind: "risk", label: "Risk", value: risk.value, tone: risk.tone });
  return rows;
}

export function ForceStatus(props: { rows: ForceStatusRow[] }) {
  if (props.rows.length === 0) return null;
  return (
    <dl className="sc-force-status">
      {props.rows.map((r) => (
        <div key={r.kind} className={`sc-force-row is-${r.kind} tone-${r.tone}`}>
          <dt className="sc-force-row-label">
            <span className="sc-force-row-pip" aria-hidden="true" />
            {r.label}
          </dt>
          <dd className="sc-force-row-value">{r.value}</dd>
          {r.fill !== undefined ? (
            <span className="sc-force-row-bar" aria-hidden="true">
              <span className="sc-force-row-fill" style={{ width: `${Math.round(r.fill * 100)}%` }} />
            </span>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
