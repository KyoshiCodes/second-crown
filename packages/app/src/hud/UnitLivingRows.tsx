import React from "react";
import type { UnitStatusRow } from "./UnitStatus";
import { getUnitFamily } from "./UnitLivingGlyph";
import "./unit-living-rows.css";

/**
 * Living status column beside the unit art: Name, Power, Cost stacked.
 * Display only. Power and Cost come straight from the rows the Army tab
 * already builds with unitStatusRows(); the family tag is the existing
 * art grouping from getUnitFamily(). No new numbers are computed here.
 *
 * Spans only, because the unit card is a <button> (phrasing content).
 */

/** Row kinds that move up into the living head. Everything else stays in UnitStatus below. */
export const LIVING_HEAD_KINDS: ReadonlyArray<UnitStatusRow["kind"]> = ["power", "cost"];

export function splitUnitRows(rows: UnitStatusRow[]): { head: UnitStatusRow[]; rest: UnitStatusRow[] } {
  const head = LIVING_HEAD_KINDS.map((k) => rows.find((r) => r.kind === k)).filter((r): r is UnitStatusRow => Boolean(r));
  const rest = rows.filter((r) => !LIVING_HEAD_KINDS.includes(r.kind));
  return { head, rest };
}

export function UnitLivingRows(props: { typeId: string; name: string; open: boolean; rows: UnitStatusRow[] }) {
  const { typeId, name, open, rows } = props;
  const family = getUnitFamily(typeId);
  return (
    <span className={`sc-unit-living-rows family-${family}`}>
      <span className="sc-unit-living-row is-name">
        <span className="sc-unit-name">{name}</span>
        <span className={`sc-unit-living-family${open ? "" : " is-fog"}`}>{family}</span>
      </span>
      {rows.map((r) => (
        <span
          key={r.kind}
          className={`sc-unit-living-row is-${r.kind} tone-${r.tone}${r.live ? " is-live" : ""}`}
        >
          <span className="sc-unit-living-label">{r.label}</span>
          <span className="sc-unit-living-value">{r.value}</span>
          {r.fill !== undefined ? (
            <span className="sc-unit-living-meter" aria-hidden="true">
              <span className="sc-unit-living-meter-fill" style={{ width: `${Math.round(r.fill * 100)}%` }} />
            </span>
          ) : null}
        </span>
      ))}
    </span>
  );
}
