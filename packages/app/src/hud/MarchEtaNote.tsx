import React from "react";
import {
  marchEtaSnapshot,
  type GameState,
  type MarchEta,
} from "@second-crown/sim";
import "./march-eta.css";

/**
 * Defensive pure reader over `@second-crown/sim`'s `marchEtaSnapshot(state, provinceId)`.
 * Returns `null` for partial state, unknown id, or when `living_march_eta` is off.
 */
export function resolveMarchEta(
  state: GameState | null | undefined,
  provinceId: string | null | undefined,
): MarchEta | null {
  if (!provinceId || !state?.board?.provinces || !state.flags || !state.meta) {
    return null;
  }
  try {
    return marchEtaSnapshot(state, provinceId);
  } catch {
    return null;
  }
}

/**
 * Quiet incoming / outgoing march ETA note inside `ProvinceInspect`, reading
 * `marchEtaSnapshot(state, provinceId)`. Hides cleanly when `null` or both lists are empty.
 */
export const MarchEtaNote: React.FC<{
  state: GameState | undefined;
  provinceId: string | null | undefined;
}> = ({ state, provinceId }) => {
  const snap = resolveMarchEta(state, provinceId);
  if (!snap || (snap.incoming.length === 0 && snap.outgoing.length === 0)) {
    return null;
  }

  return (
    <div
      className="sc-march-eta-note"
      data-march-eta-in={snap.incoming.length}
      data-march-eta-out={snap.outgoing.length}
    >
      <span className="sc-march-eta-pip" aria-hidden="true" />
      {snap.incoming.length > 0 ? (
        <span className="sc-march-eta-group">
          <span className="sc-march-eta-tag is-in">In:</span>
          {snap.incoming.map((m) => (
            <span
              key={m.id}
              className="sc-march-eta-item"
              data-march-eta-id={m.id}
            >
              {m.kind} ~{Math.max(0, Math.ceil(m.ticksLeft / 10))}s ({m.ticksLeft}t)
            </span>
          ))}
        </span>
      ) : null}
      {snap.outgoing.length > 0 ? (
        <span className="sc-march-eta-group">
          <span className="sc-march-eta-tag is-out">Out:</span>
          {snap.outgoing.map((m) => (
            <span
              key={m.id}
              className="sc-march-eta-item"
              data-march-eta-id={m.id}
            >
              {m.kind} ~{Math.max(0, Math.ceil(m.ticksLeft / 10))}s ({m.ticksLeft}t)
            </span>
          ))}
        </span>
      ) : null}
    </div>
  );
};
