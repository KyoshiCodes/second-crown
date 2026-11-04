import React from "react";
import { CULTURES, getUnitType } from "@second-crown/sim";
import { cultureLine, cultureUnitId } from "./cultureLines";
import "./hud/balance-notes.css";

/** Base cost of a unit as "food 5 · wood 6 · gold 1". Reads the sim table; adds no rules. */
export function unitCostText(unitId: string): string | null {
  const def = getUnitType(unitId);
  if (!def) return null;
  const parts = Object.entries(def.cost).map(([res, n]) => `${res} ${n}`);
  return parts.length ? parts.join(" · ") : null;
}

/** Read-only balance notes: each culture's one difference and its unit's base cost. */
export function BalanceNotes() {
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
            return (
              <tr key={c.id} className={line.unit || line.difference ? "" : "is-plain"}>
                <td>{c.name}</td>
                <td>{line.difference ?? "looks only"}</td>
                <td>{line.unit ?? "base roster"}</td>
                <td>{cost ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="sc-balance-foot">Base cost per unit, before barracks, research, doctrine, decree and stable or range discounts. Read-only.</p>
    </details>
  );
}
