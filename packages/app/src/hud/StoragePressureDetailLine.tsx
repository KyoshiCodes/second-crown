import React from "react";
import {
  storagePressureDetailSnapshot,
  type GameState,
  type StoragePressureDetail,
} from "@second-crown/sim";
import "./storage-pressure-detail.css";

/**
 * Defensive pure reader over `@second-crown/sim`'s `storagePressureDetailSnapshot(state)`.
 * Returns `[]` when `living_storage_detail` is off or state is partial.
 */
export function resolveStoragePressureDetail(
  state: GameState | null | undefined,
): StoragePressureDetail[] {
  if (!state?.resources || !state.flags || !state.meta || !Array.isArray(state.buildings)) {
    return [];
  }
  try {
    return storagePressureDetailSnapshot(state);
  } catch {
    return [];
  }
}

function statusWord(entry: StoragePressureDetail): string {
  if (entry.status === "high") return "low";
  if (entry.percentFull >= 99.5) return "full";
  return "ample";
}

/**
 * Quiet Kingdom sub-line reading `storagePressureDetailSnapshot(state)` and showing percent-full
 * and status note for non-`ok` stores. Hides cleanly when all stores are `ok` or disabled.
 */
export const StoragePressureDetailLine: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const entries = resolveStoragePressureDetail(state);
  const notable = entries.filter((entry) => entry.status !== "ok");
  if (notable.length === 0) return null;

  return (
    <p
      className="sc-storage-detail-line"
      data-storage-detail-count={notable.length}
    >
      <span className="sc-storage-detail-label">Stores:</span>
      {notable.map((entry) => {
        const pct = Math.round(entry.percentFull);
        return (
          <span
            key={entry.resource}
            className="sc-storage-detail-item"
            data-storage-res={entry.resource}
            data-storage-status={entry.status}
            data-storage-pct={pct}
          >
            <span
              className={`sc-storage-detail-pip is-${entry.status}`}
              aria-hidden="true"
            />
            <span>{entry.resource}</span>
            <span className="sc-storage-detail-pct">{pct}%</span>
            <span className="sc-storage-detail-note">({statusWord(entry)})</span>
          </span>
        );
      })}
    </p>
  );
};
