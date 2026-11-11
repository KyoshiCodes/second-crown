import React from "react";
import { CULTURES, getUnitType, playerCultureId, type GameState } from "@second-crown/sim";
import { cultureLine, cultureUnitId } from "./cultureLines";
import { CultureCrestPip } from "./hud/CultureCrestPip";
import { CultureUnitChip } from "./hud/CultureUnitChip";
import { rememberedCulture } from "./CulturePicker";
import "./hud/balance-notes.css";

/** Base cost of a unit as "food 5 · wood 6 · gold 1". Reads the sim table; adds no rules. */
export function unitCostText(unitId: string): string | null {
  const def = getUnitType(unitId);
  if (!def) return null;
  const parts = Object.entries(def.cost).map(([res, n]) => `${res} ${n}`);
  return parts.length ? parts.join(" · ") : null;
}

/**
 * Playtest feedback shown under the table. Static text: add one short line per finding
 * (e.g. "Glen: quarry edge feels weak before the first market"). Empty shows the placeholder.
 */
export const PLAYTEST_NOTES: readonly string[] = [];

export interface BalanceNotesProps {
  state?: GameState;
  playerCulture?: string;
  /** Override for tests; defaults to PLAYTEST_NOTES. */
  notes?: readonly string[];
}

/** Read-only balance notes: each culture's one difference, living emblem, and unit's base cost. */
export function BalanceNotes(props: BalanceNotesProps = {}) {
  const notes = props.notes ?? PLAYTEST_NOTES;
  const activeCulture = props.playerCulture ?? (props.state ? playerCultureId(props.state) : rememberedCulture());

  return (
    <details className="sc-work-card sc-balance-notes">
      <summary className="sc-work-name">Balance notes</summary>
      <table className="sc-balance-table">
        <thead>
          <tr>
            <th>Culture</th>
            <th>Edge</th>
            <th>Unit</th>
            <th>Base cost</th>
          </tr>
        </thead>
        <tbody>
          {CULTURES.map((c) => {
            const line = cultureLine(c.id);
            const unitId = cultureUnitId(c.id);
            const cost = unitId ? unitCostText(unitId) : null;
            const isCurrent = activeCulture === c.id;
            const rowClass = [
              line.unit || line.difference ? "" : "is-plain",
              isCurrent ? "is-active-culture" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <tr key={c.id} className={rowClass}>
                <td className="sc-balance-culture-td">
                  <span className="sc-balance-culture-cell">
                    <CultureCrestPip cultureId={c.id} size={15} isSelected={isCurrent} />
                    <span className="sc-balance-culture-name">{c.name}</span>
                  </span>
                </td>
                <td>{line.difference ?? "looks only"}</td>
                <td>
                  {line.unit ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <CultureUnitChip cultureId={c.id} size={18} open={true} />
                      <span>{line.unit}</span>
                    </span>
                  ) : (
                    "base roster"
                  )}
                </td>
                <td>{cost ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="sc-balance-foot">
        Base cost per unit, before barracks, research, doctrine, decree and stable or range discounts. Read-only.
      </p>
      <div className="sc-balance-playtest" aria-label="Playtest notes">
        <div className="sc-balance-playtest-title">Playtest notes</div>
        {notes.length ? (
          <ul className="sc-balance-playtest-list">
            {notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        ) : (
          <p className="sc-balance-playtest-empty">
            No playtest feedback logged yet. Notes on the five culture edges will be written here after the next
            session.
          </p>
        )}
      </div>
    </details>
  );
}
