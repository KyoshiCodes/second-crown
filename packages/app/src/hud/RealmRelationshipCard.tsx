import React from "react";
import {
  realmRelationshipSummary,
  type GameState,
  type RealmRelationship,
  type RelationshipStance,
} from "@second-crown/sim";
import { formatWhisperCultureTag } from "./NextWhisperHintLine";
import "./relationship-summary.css";

export const RELATIONSHIP_STANCE_LABEL: Record<RelationshipStance, string> = {
  war: "War",
  pact: "Pact",
  peace: "Peace",
  neutral: "Neutral",
};

const ACTIONABLE_NEXT = new Set(["can fight", "can reply", "can declare"]);

/**
 * Defensive pure reader over `@second-crown/sim`'s `realmRelationshipSummary(state)`.
 * Returns `[]` when the switch is off, no NPC realm is known, or state is partial.
 */
export function listRealmRelationships(
  state: GameState | null | undefined,
): RealmRelationship[] {
  if (
    !state?.board?.provinces ||
    !state.flags ||
    !state.meta ||
    !Array.isArray(state.realms) ||
    !Array.isArray(state.wars)
  ) {
    return [];
  }
  return realmRelationshipSummary(state);
}

/**
 * Calm World tab card below the culture whispers fold showing one compact row per known
 * NPC realm from `realmRelationshipSummary`: name, culture, stance, last interaction, and
 * next possible action. Hides cleanly when empty.
 */
export const RealmRelationshipCard: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const rows = listRealmRelationships(state);
  if (rows.length === 0) return null;

  return (
    <section
      className="sc-rel-card"
      aria-label="Realm relationships"
      data-relationship-count={rows.length}
    >
      <div className="sc-rel-header">
        <h4 className="sc-rel-title">Known Realms</h4>
        <span className="sc-rel-count">
          {rows.length} {rows.length === 1 ? "realm" : "realms"}
        </span>
      </div>

      <ul className="sc-rel-list">
        {rows.map((row) => {
          const cultureLabel = formatWhisperCultureTag(row.culture) ?? row.culture;
          const stanceLabel = RELATIONSHIP_STANCE_LABEL[row.stance];
          const isActionable = row.nextPossible !== null && ACTIONABLE_NEXT.has(row.nextPossible);

          return (
            <li
              key={row.realmId}
              className={`sc-rel-row is-stance-${row.stance}`}
              data-rel-realm={row.realmId}
              data-rel-stance={row.stance}
              data-rel-culture={row.culture}
              data-rel-last={row.lastInteraction ?? "none"}
              data-rel-next={row.nextPossible ?? "none"}
            >
              <div className="sc-rel-top">
                <span className={`sc-rel-pip is-stance-${row.stance}`} aria-hidden="true" />
                <span className="sc-rel-name">{row.name}</span>
                <span className="sc-rel-culture">({cultureLabel})</span>
                <span className={`sc-rel-stance is-stance-${row.stance}`}>
                  {stanceLabel}
                </span>
              </div>

              <div className="sc-rel-meta">
                <span className="sc-rel-last">
                  Last: {row.lastInteraction ?? "none yet"}
                </span>
                <span className={`sc-rel-next${isActionable ? " is-actionable" : ""}`}>
                  Next: {row.nextPossible ?? "—"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
