import React from "react";
import {
  getProvince,
  unitWaitingSnapshot,
  type GameState,
  type UnitWaitingStates,
} from "@second-crown/sim";
import "./unit-waiting-list.css";

export type UnitWaitingBadgeKind = "posted" | "marching" | "both";

/**
 * Pure wrapper around `unitWaitingSnapshot(state)` with safe state guards so
 * callers hide cleanly when null, empty, or `living_unit_waiting` is off.
 */
export function resolveUnitWaiting(
  state: GameState | null | undefined,
): UnitWaitingStates | null {
  if (!state?.flags || !state.meta) return null;
  const snap = unitWaitingSnapshot(state);
  if (!snap) return null;
  if (snap.posted.length === 0 && snap.waiting.length === 0) return null;
  return snap;
}

/**
 * Resolves a concise state badge (`posted`, `marching`, `both`, or `null`)
 * for a given unit type from `unitWaitingSnapshot`.
 */
export function resolveUnitWaitingBadge(
  snap: UnitWaitingStates | null,
  typeId: string,
): UnitWaitingBadgeKind | null {
  if (!snap) return null;
  const isPosted = snap.posted.some((u) => u.id === typeId);
  const isWaiting = snap.waiting.some((u) => u.id === typeId);
  if (isPosted && isWaiting) return "both";
  if (isPosted) return "posted";
  if (isWaiting) return "marching";
  return null;
}

function formatProvinceCoord(state: GameState, provinceId: string): string {
  const p = getProvince(state, provinceId);
  return p ? `${p.x},${p.y}` : provinceId;
}

/**
 * Calm list of posted garrison units and units currently waiting/marching on the
 * road from `unitWaitingSnapshot`. Hides completely when `null`.
 */
export const UnitWaitingList: React.FC<{
  state: GameState | null | undefined;
  compact?: boolean;
}> = ({ state, compact = false }) => {
  const snap = resolveUnitWaiting(state);
  if (!snap || !state) return null;

  return (
    <div
      className={`sc-uw-list${compact ? " is-compact" : ""}`}
      data-uw-posted={snap.posted.length}
      data-uw-waiting={snap.waiting.length}
    >
      {snap.posted.length > 0 ? (
        <div className="sc-uw-group is-posted">
          <div className="sc-uw-group-title">Posted ({snap.posted.length})</div>
          <div className="sc-uw-rows">
            {snap.posted.map((u, idx) => (
              <div
                key={`post-${u.location}-${u.id}-${idx}`}
                className="sc-uw-row is-posted"
                data-uw-kind="posted"
                data-uw-unit={u.id}
                data-uw-location={u.location}
              >
                <span className="sc-uw-pip is-posted" aria-hidden="true" />
                <span className="sc-uw-unit">{u.name}</span>
                <span className="sc-uw-state-pill is-posted">Posted</span>
                <span className="sc-uw-where">@ {formatProvinceCoord(state, u.location)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {snap.waiting.length > 0 ? (
        <div className="sc-uw-group is-waiting">
          <div className="sc-uw-group-title">On road ({snap.waiting.length})</div>
          <div className="sc-uw-rows">
            {snap.waiting.map((u, idx) => {
              const etaSec = Math.max(0, Math.ceil(u.ticksLeft / 10));
              const stateWord = u.ticksLeft > 0 ? "Marching" : "Waiting";
              return (
                <div
                  key={`wait-${u.destination}-${u.id}-${u.ticksLeft}-${idx}`}
                  className="sc-uw-row is-waiting"
                  data-uw-kind="waiting"
                  data-uw-unit={u.id}
                  data-uw-destination={u.destination}
                  data-uw-ticks={u.ticksLeft}
                >
                  <span className="sc-uw-pip is-waiting" aria-hidden="true" />
                  <span className="sc-uw-unit">{u.name}</span>
                  <span className="sc-uw-state-pill is-waiting">{stateWord}</span>
                  <span className="sc-uw-where">→ {formatProvinceCoord(state, u.destination)}</span>
                  <span className="sc-uw-eta">~{etaSec}s ({u.ticksLeft}t)</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
