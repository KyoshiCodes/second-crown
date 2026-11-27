import React from "react";
import {
  unitUnlockSnapshot,
  type GameState,
  type UnitUnlocks,
} from "@second-crown/sim";
import "./unit-unlocks.css";

/**
 * Defensive pure reader over `@second-crown/sim`'s `unitUnlockSnapshot(state)`.
 * Returns `null` when `living_unit_unlocks` is off or state is partial.
 */
export function resolveUnitUnlocks(
  state: GameState | null | undefined,
): UnitUnlocks | null {
  if (!state?.flags || !state.meta) {
    return null;
  }
  try {
    return unitUnlockSnapshot(state);
  } catch {
    return null;
  }
}

/**
 * Calm collapsed-by-default unit unlock expander in `ArmyTab` reading `unitUnlockSnapshot(state)`.
 * Hides cleanly when `null` or both lists are empty.
 */
export const UnitUnlockExpander: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const snap = resolveUnitUnlocks(state);
  if (!snap || (snap.ready.length === 0 && snap.locked.length === 0)) {
    return null;
  }

  return (
    <details
      className="sc-unit-unlocks"
      data-unlocks-ready={snap.ready.length}
      data-unlocks-locked={snap.locked.length}
    >
      <summary className="sc-unit-unlocks-toggle">
        <span className="sc-unit-unlocks-pip" aria-hidden="true" />
        <span>
          Unit unlocks · {snap.ready.length} ready · {snap.locked.length} locked
        </span>
      </summary>
      <div className="sc-unit-unlocks-list">
        {snap.ready.length > 0 ? (
          <div className="sc-unit-unlocks-group">
            <span className="sc-unit-unlocks-ready">Ready:</span>
            {snap.ready.map((u) => (
              <span key={u.id} data-unlock-unit-ready={u.id}>
                {u.name}
              </span>
            ))}
          </div>
        ) : null}
        {snap.locked.length > 0 ? (
          <div className="sc-unit-unlocks-group">
            {snap.locked.map((u) => (
              <span
                key={u.id}
                className="sc-unit-unlocks-locked"
                data-unlock-unit-locked={u.id}
              >
                <span>{u.name}</span>
                <span className="sc-unit-unlocks-req">({u.requires})</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </details>
  );
};
