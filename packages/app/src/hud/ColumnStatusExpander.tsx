import React from "react";
import {
  columnStatusSnapshot,
  getProvince,
  type ColumnStatus,
  type GameState,
} from "@second-crown/sim";
import "./column-status.css";

/**
 * Defensive pure reader over `@second-crown/sim`'s `columnStatusSnapshot(state)`.
 * Returns `null` when no columns are marching, `living_column_status` is off, or state is partial.
 */
export function resolveColumnStatus(
  state: GameState | null | undefined,
): ColumnStatus | null {
  if (!state?.board?.provinces || !state.flags || !state.meta) {
    return null;
  }
  try {
    return columnStatusSnapshot(state);
  } catch {
    return null;
  }
}

function destCoords(state: GameState, destination: string): string {
  const p = getProvince(state, destination);
  return p ? `${p.x},${p.y}` : destination;
}

/**
 * Calm collapsed-by-default column status expander in `WarRoom` reading
 * `columnStatusSnapshot(state)` (kind, destination, ticks left, strength).
 * Hides cleanly when `null` or empty.
 */
export const ColumnStatusExpander: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const snap = resolveColumnStatus(state);
  if (!snap || snap.columns.length === 0 || !state) return null;

  return (
    <details
      className="sc-col-status"
      data-col-status-count={snap.columns.length}
    >
      <summary className="sc-col-status-toggle">
        <span className="sc-col-status-pip" aria-hidden="true" />
        <span>Columns on road ({snap.columns.length})</span>
        {snap.note ? (
          <span className="sc-col-status-note">· {snap.note}</span>
        ) : null}
      </summary>
      <div className="sc-col-status-list">
        {snap.columns.map((c) => {
          const secs = Math.max(0, Math.ceil(c.ticksLeft / 10));
          return (
            <div
              key={c.id}
              className="sc-col-status-row"
              data-col-id={c.id}
              data-col-kind={c.kind}
              data-col-strength={c.strength}
            >
              <span className="sc-col-status-owner">{c.name}</span>
              <span className="sc-col-status-meta">
                {c.kind} → {destCoords(state, c.destination)} · ~{secs}s ({c.ticksLeft}t) · pwr {c.strength}
              </span>
            </div>
          );
        })}
      </div>
    </details>
  );
};
