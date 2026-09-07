import React from "react";
import {
  RESEARCH,
  countBuilding,
  getBuildingType,
  researchDone,
  researchTicksLeft,
  tryStartResearch,
  D,
  type GameState,
} from "@second-crown/sim";
import { UnitIcon } from "./UnitIcon";
import type { ActFn } from "./game/useGameEngine";

type ResearchId = keyof typeof RESEARCH;

const TOPIC_METADATA: Record<ResearchId, { icon: string; blurb: string }> = {
  horse: {
    icon: "🐎",
    blurb: "Equine husbandry, cavalry charges & chivalric harness.",
  },
  siege: {
    icon: "⚙️",
    blurb: "Torsion engines, counterweight ballistics & fortification breaching.",
  },
};

function StudyCard(props: {
  state: GameState;
  act: ActFn;
  id: ResearchId;
}) {
  const { state, act, id } = props;
  const def = RESEARCH[id];
  const meta = TOPIC_METADATA[id];
  const done = researchDone(state, id);
  const left = researchTicksLeft(state, id);
  const isBusyWithOther = Object.keys(RESEARCH).some(
    (k) => k !== id && researchTicksLeft(state, k as ResearchId) > 0
  );

  const bldgNeed = def.needs;
  const bldgCount = countBuilding(state, bldgNeed);
  const academyCount = countBuilding(state, "academy");
  const hasBuilding = bldgCount > 0 || (id === "horse" && academyCount > 0);
  const bldgName = getBuildingType(bldgNeed)?.name ?? bldgNeed;

  // Evaluate costs dynamically as exported by sim
  const costEntries = Object.entries(def.cost);
  const resourceAffordability = costEntries.map(([res, costStr]) => {
    const current = D(state.resources[res] ?? "0");
    const required = D(costStr);
    return {
      res,
      required: costStr,
      canAfford: current.gte(required),
    };
  });
  const canAffordAll = resourceAffordability.every((c) => c.canAfford);

  const canStart = hasBuilding && canAffordAll && !isBusyWithOther && !done && left === 0;

  // Compute disabled hint
  let disabledHint = "";
  if (isBusyWithOther) {
    disabledHint = "Scribes are currently studying another treatise.";
  } else if (!hasBuilding) {
    disabledHint = id === "horse" && academyCount > 0 ? "" : `Requires a ${bldgName} in your hold.`;
  } else if (!canAffordAll) {
    const missing = resourceAffordability
      .filter((c) => !c.canAfford)
      .map((c) => `${c.required} ${c.res}`)
      .join(", ");
    disabledHint = `Insufficient resources: need ${missing}.`;
  }

  const durationSec = Math.round(def.ticks / 10);
  const progressPercent =
    left > 0 ? Math.min(100, Math.round(((def.ticks - left) / def.ticks) * 100)) : done ? 100 : 0;

  return (
    <div
      className={`sc-study-card ${done ? "is-done" : left > 0 ? "is-active" : ""}`}
    >
      <div>
        {/* Top Header */}
        <div className="sc-study-top">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16 }}>{meta.icon}</span>
            <span className="sc-study-name">{def.name}</span>
          </div>
          <span className="sc-study-time">⏱️ {durationSec}s</span>
        </div>

        {/* Lore Blurb */}
        <div className="sc-study-blurb">{meta.blurb}</div>

        {/* Unlocks with Pixel Silhouettes */}
        <div className="sc-study-unlocks">
          <span style={{ opacity: 0.8 }}>Unlocks:</span>
          {def.unlocks.map((unitId) => (
            <span key={unitId} className="sc-study-unlock-tag">
              <UnitIcon typeId={unitId} size={18} animated={false} />
              <span style={{ textTransform: "capitalize" }}>{unitId}</span>
            </span>
          ))}
        </div>

        {/* Requirements and Resource Costs */}
        <div className="sc-study-reqs">
          {/* Building Prerequisite */}
          <span
            className={`sc-study-building-badge ${hasBuilding ? "has-bldg" : "missing-bldg"}`}
            title={hasBuilding ? `${bldgName} available` : `Requires ${bldgName}`}
          >
            {hasBuilding ? "✓" : "✗"}{" "}
            {id === "horse" && academyCount > 0 ? "Academy" : bldgName}
          </span>

          {/* Dynamic Resource Costs from Sim */}
          {resourceAffordability.map(({ res, required, canAfford }) => (
            <span
              key={res}
              className={`sc-study-chip ${canAfford ? "afford-yes" : "afford-no"}`}
              title={`${res}: ${state.resources[res] ?? "0"} / ${required}`}
            >
              {res === "gold" ? "🪙" : res === "wood" ? "🪵" : res === "stone" ? "🪨" : "🌾"}{" "}
              {required} {res}
            </span>
          ))}
        </div>
      </div>

      {/* Status or Action Footer */}
      <div style={{ marginTop: 8 }}>
        {done ? (
          <div className="sc-study-mastered-seal">
            <span>✓</span>
            <span>Mastered · Ready to train</span>
          </div>
        ) : left > 0 ? (
          <div>
            <div className="sc-study-progress-label">
              <span>📜 Inscribing folios · {Math.ceil(left / 10)}s remaining</span>
            </div>
            <div className="sc-study-progress-track">
              <div
                className="sc-study-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div>
            <button
              type="button"
              disabled={!canStart}
              title={disabledHint || `Commission scholars to study ${def.name.toLowerCase()}`}
              onClick={() =>
                act((s) =>
                  tryStartResearch(s, id)
                    ? `Scribes begin researching ${def.name.toLowerCase()}.`
                    : disabledHint || `Unable to begin ${def.name.toLowerCase()}.`
                )
              }
              style={{
                width: "100%",
                padding: "6px 10px",
                fontSize: 12.5,
                fontWeight: 600,
                background: canStart ? "#2563eb" : "#27272a",
                borderColor: canStart ? "#3b82f6" : "#3f3f46",
                color: canStart ? "#ffffff" : "#a1a1aa",
                cursor: canStart ? "pointer" : "not-allowed",
              }}
            >
              Study {def.name}
            </button>
            {disabledHint ? (
              <div style={{ fontSize: 11, color: "#f87171", marginTop: 4 }}>
                {disabledHint}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export function ResearchBar(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  if (!state) return null;

  const academyCount = countBuilding(state, "academy");

  return (
    <div className="sc-realm-card sc-research-lectern">
      {/* Lectern Card Header */}
      <div className="sc-lectern-header">
        <div className="sc-lectern-title-group">
          <span className="sc-lectern-icon">📖</span>
          <div>
            <div className="sc-lectern-title">Scriptorium Lectern · Realm Lore</div>
            <div className="sc-lectern-sub">
              Pore over ancient treatises and illuminated folios to master chivalric tactics and siegecraft.
            </div>
          </div>
        </div>
        {academyCount > 0 ? (
          <span
            style={{
              fontSize: 11.5,
              padding: "2px 8px",
              background: "rgba(37, 99, 235, 0.25)",
              border: "1px solid #3b82f6",
              borderRadius: 4,
              color: "#93c5fd",
            }}
          >
            🏫 Academy Active
          </span>
        ) : null}
      </div>

      {/* Study Cards Grid */}
      <div className="sc-study-grid">
        <StudyCard state={state} act={act} id="horse" />
        <StudyCard state={state} act={act} id="siege" />
      </div>
    </div>
  );
}
