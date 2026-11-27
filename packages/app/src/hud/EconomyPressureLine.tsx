import React from "react";
import {
  economyPressureSnapshot,
  type EconomyPressure,
  type GameState,
  type PressureLevel,
} from "@second-crown/sim";
import "./economy-pressure-status.css";

/**
 * Defensive pure reader over `@second-crown/sim`'s `economyPressureSnapshot(state)`.
 * Returns `null` when `living_economy_status` is off or state is partial.
 */
export function resolveEconomyPressure(
  state: GameState | null | undefined,
): EconomyPressure | null {
  if (!state?.resources || !state.flags || !state.meta || !Array.isArray(state.buildings)) {
    return null;
  }
  return economyPressureSnapshot(state);
}

const RESOURCE_KEYS = [
  ["food", "foodPressure"],
  ["wood", "woodPressure"],
  ["stone", "stonePressure"],
  ["gold", "goldPressure"],
] as const;

/**
 * Calm Kingdom tab / resource-strip pressure indicator reading `economyPressureSnapshot`.
 * Hides cleanly when `living_economy_status` is off or all stores are `ok`.
 */
export const EconomyPressureLine: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const snap = resolveEconomyPressure(state);
  if (!snap) return null;

  const items: Array<{ key: string; level: PressureLevel | "full"; label: string }> = [];
  for (const [res, field] of RESOURCE_KEYS) {
    const level = snap[field];
    if (level === "high") {
      items.push({
        key: `${res}-high`,
        level: "high",
        label: res === "food" && snap.bareFood ? "food bare" : `${res} low`,
      });
    } else if (level === "low") {
      items.push({
        key: `${res}-low`,
        level: "low",
        label: `${res} ample`,
      });
    }
  }

  if (snap.fullStores.length > 0) {
    items.push({
      key: "full-stores",
      level: "full",
      label: `full: ${snap.fullStores.join(", ")}`,
    });
  }

  if (items.length === 0) return null;

  return (
    <p
      className="sc-econ-status-line"
      data-bare-food={snap.bareFood ? "true" : "false"}
      data-food-pressure={snap.foodPressure}
      data-wood-pressure={snap.woodPressure}
      data-stone-pressure={snap.stonePressure}
      data-gold-pressure={snap.goldPressure}
    >
      {items.map((item) => (
        <span key={item.key} className="sc-econ-tag">
          <span className={`sc-econ-pip is-${item.level}`} aria-hidden="true" />
          <span>{item.label}</span>
        </span>
      ))}
    </p>
  );
};
