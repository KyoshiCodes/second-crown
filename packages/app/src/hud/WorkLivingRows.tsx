import React from "react";
import type { WorkStatusRow } from "./WorkStatus";
import { getHallDomain } from "./WorkLivingGlyph";
import "./work-living-rows.css";

/**
 * Living status column beside the hall chip on a Standing works card:
 * Name, Level, Staffed stacked. Display only. Level and Staffed come straight
 * from the rows WorkCard already builds with workStatusRows(); the domain tag
 * is the existing hall grouping from getHallDomain(). No new numbers here.
 */

/** Row kinds that move up into the living head. Bonuses stays in WorkStatus below. */
export const WORK_LIVING_HEAD_KINDS: ReadonlyArray<WorkStatusRow["kind"]> = ["level", "staffed"];

export function splitWorkRows(rows: WorkStatusRow[]): { head: WorkStatusRow[]; rest: WorkStatusRow[] } {
  const head = WORK_LIVING_HEAD_KINDS.map((k) => rows.find((r) => r.kind === k)).filter(
    (r): r is WorkStatusRow => Boolean(r),
  );
  const rest = rows.filter((r) => !WORK_LIVING_HEAD_KINDS.includes(r.kind));
  return { head, rest };
}

export function WorkLivingRows(props: { typeId: string; name: string; scarred: boolean; rows: WorkStatusRow[] }) {
  const { typeId, name, scarred, rows } = props;
  const domain = getHallDomain(typeId);
  return (
    <span className={`sc-work-living-rows domain-${domain}`}>
      <span className="sc-work-living-row is-name">
        <span className="sc-work-name">{name}</span>
        <span className={`sc-work-living-domain${scarred ? " is-fog" : ""}`}>{domain}</span>
      </span>
      {rows.map((r) => (
        <span
          key={r.kind}
          className={`sc-work-living-row is-${r.kind} tone-${r.tone}${r.live ? " is-live" : ""}`}
        >
          <span className="sc-work-living-label">{r.label}</span>
          <span className="sc-work-living-value">
            {r.value}
            {r.note ? <span className="sc-work-living-note">{r.note}</span> : null}
          </span>
          {r.fill !== undefined ? (
            <span className="sc-work-living-meter" aria-hidden="true">
              <span className="sc-work-living-meter-fill" style={{ width: `${Math.round(r.fill * 100)}%` }} />
            </span>
          ) : null}
        </span>
      ))}
    </span>
  );
}
