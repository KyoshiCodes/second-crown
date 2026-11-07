import React from "react";
import "./work-status.css";

/**
 * Stacked status rows for a Standing works card: level, staffed, bonuses.
 * Display only. Every input is a value the card already reads from the sim:
 * `b.level`, `maxLevelFor`, `jobForBuildingType`, and the existing
 * `staffBonus` / `adjacencyBonus` / `pairBonus` / `keepBonus` multipliers
 * (passed in as whole percents). No rule lives here.
 */

export type WorkRowKind = "level" | "staffed" | "bonuses";
export type WorkRowTone = "calm" | "warn" | "danger" | "fog";

export interface WorkBonusChip {
  key: "cluster" | "pair" | "keep";
  label: string;
  pct: number;
}

export interface WorkStatusRow {
  kind: WorkRowKind;
  label: string;
  /** Main value text. */
  value: string;
  /** Short note after the value. */
  note: string;
  tone: WorkRowTone;
  /** 0..1 bar fill. */
  fill?: number;
  /** Bonuses row only. */
  chips?: WorkBonusChip[];
  /** Pip breathes (the work is running and lifted). */
  live?: boolean;
}

export interface WorkStatusInput {
  level: number;
  /** `maxLevelFor(state, typeId, realmId)`. */
  maxLevel: number;
  scarred: boolean;
  /** `jobForBuildingType(typeId) !== "unassigned"`. */
  crewed: boolean;
  /** Whole percents from the existing bonus readers (0 when none). */
  staffPct: number;
  clusterPct: number;
  pairPct: number;
  keepPct: number;
}

/**
 * Display scale only: the staffed bar reads full at the largest staff lift the
 * card has ever shown (+40%). Never fed back into the sim.
 */
const STAFF_BAR_FULL = 40;

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

export function workStatusRows(input: WorkStatusInput): WorkStatusRow[] {
  const { level, maxLevel, scarred, crewed, staffPct, clusterPct, pairPct, keepPct } = input;
  const atCap = level >= maxLevel;
  const rows: WorkStatusRow[] = [];

  rows.push({
    kind: "level",
    label: "Level",
    value: `lv ${level} / ${maxLevel}`,
    note: scarred ? "idle" : atCap ? "at cap" : `${Math.max(0, maxLevel - level)} to cap`,
    tone: scarred ? "fog" : "calm",
    fill: maxLevel > 0 ? clamp01(level / maxLevel) : undefined,
  });

  let staffed: WorkStatusRow;
  if (scarred) {
    staffed = { kind: "staffed", label: "Staffed", value: "Scarred", note: "repair to work", tone: "danger" };
  } else if (!crewed) {
    staffed = { kind: "staffed", label: "Staffed", value: "No crew", note: "needs none", tone: "fog" };
  } else if (staffPct > 0) {
    staffed = {
      kind: "staffed",
      label: "Staffed",
      value: `+${staffPct}%`,
      note: staffPct >= STAFF_BAR_FULL ? "full crew" : "crewed",
      tone: "calm",
      fill: clamp01(staffPct / STAFF_BAR_FULL),
      live: true,
    };
  } else {
    staffed = { kind: "staffed", label: "Staffed", value: "Empty", note: "no hands", tone: "warn", fill: 0 };
  }
  rows.push(staffed);

  const chips: WorkBonusChip[] = scarred
    ? []
    : ([
        { key: "cluster", label: "cluster", pct: clusterPct },
        { key: "pair", label: "pair", pct: pairPct },
        { key: "keep", label: "keep", pct: keepPct },
      ] as WorkBonusChip[]).filter((c) => c.pct > 0);
  rows.push({
    kind: "bonuses",
    label: "Bonuses",
    value: "",
    note: scarred ? "idle" : chips.length === 0 ? "none" : "",
    tone: chips.length > 0 ? "calm" : "fog",
    chips,
    live: chips.length > 0,
  });

  return rows;
}

export function WorkStatus(props: { rows: WorkStatusRow[] }) {
  if (props.rows.length === 0) return null;
  return (
    <div className="sc-workstat">
      {props.rows.map((r) => (
        <div key={r.kind} className={`sc-workstat-row is-${r.kind} tone-${r.tone}${r.live ? " is-live" : ""}`}>
          <span className="sc-workstat-label">
            <span className="sc-workstat-pip" aria-hidden="true" />
            {r.label}
          </span>
          <span className="sc-workstat-value">
            {r.value ? <span className="sc-workstat-main">{r.value}</span> : null}
            {r.chips?.map((c) => (
              <span key={c.key} className={`sc-workstat-chip is-${c.key}`}>
                {c.label} +{c.pct}%
              </span>
            ))}
            {r.note ? <span className="sc-workstat-note">{r.note}</span> : null}
          </span>
          {r.fill !== undefined ? (
            <span className="sc-workstat-bar" aria-hidden="true">
              <span className="sc-workstat-fill" style={{ width: `${Math.round(r.fill * 100)}%` }} />
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
