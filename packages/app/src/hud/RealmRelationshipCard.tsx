import React from "react";
import {
  realmRelationshipSummary,
  relationshipDetailSnapshot,
  relationshipHistorySnapshot,
  type GameState,
  type RealmRelationship,
  type RelationshipDetail,
  type RelationshipHistoryEntry,
  type RelationshipStance,
} from "@second-crown/sim";
import { formatWhisperCultureTag } from "./NextWhisperHintLine";
import "./relationship-summary.css";
import "./relationship-history.css";
import "./relationship-detail.css";

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
 * Defensive pure reader over `@second-crown/sim`'s `relationshipHistorySnapshot(state, realmId)`.
 * Returns `[]` when `living_relationship_history` is off, unknown realm, or partial state.
 */
export function listRealmRelationshipHistory(
  state: GameState | null | undefined,
  realmId: string,
): RelationshipHistoryEntry[] {
  if (
    !state?.board?.provinces ||
    !state.flags ||
    !state.meta ||
    !Array.isArray(state.realms) ||
    !Array.isArray(state.wars)
  ) {
    return [];
  }
  return relationshipHistorySnapshot(state, realmId);
}

/**
 * Defensive pure reader over `@second-crown/sim`'s `relationshipDetailSnapshot(state, realmId)`.
 * Returns `null` when `living_relationship_detail` is off, unknown realm, or partial state.
 */
export function resolveRealmRelationshipDetail(
  state: GameState | null | undefined,
  realmId: string,
): RelationshipDetail | null {
  if (
    !state?.flags ||
    !state.meta ||
    !Array.isArray(state.realms) ||
    !Array.isArray(state.inputLog)
  ) {
    return null;
  }
  try {
    return relationshipDetailSnapshot(state, realmId);
  } catch {
    return null;
  }
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
          const history = listRealmRelationshipHistory(state, row.realmId);
          const detail = resolveRealmRelationshipDetail(state, row.realmId);

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

              {detail && (detail.lastGift || detail.suggestion) ? (
                <div
                  className="sc-rel-detail-note"
                  data-rel-detail-realm={row.realmId}
                  data-rel-opinion={detail.opinion}
                >
                  <span className="sc-rel-detail-pip" aria-hidden="true" />
                  {detail.lastGift ? (
                    <span className="sc-rel-detail-gift">{detail.lastGift}</span>
                  ) : null}
                  {detail.suggestion ? (
                    <span className="sc-rel-detail-suggest">{detail.suggestion}</span>
                  ) : null}
                </div>
              ) : null}

              {history.length > 0 ? (
                <details className="sc-rel-history" data-rel-history-count={history.length}>
                  <summary className="sc-rel-history-toggle">
                    Recent ({history.length})
                  </summary>
                  <ul className="sc-rel-history-list">
                    {history.map((entry, idx) => (
                      <li
                        key={`${entry.tick}-${entry.kind}-${idx}`}
                        className="sc-rel-history-entry"
                        data-history-kind={entry.kind}
                        data-history-tick={entry.tick}
                      >
                        <span className="sc-rel-history-pip" aria-hidden="true" />
                        <span className="sc-rel-history-kind">{entry.kind}</span>
                        <span className="sc-rel-history-text">{entry.text}</span>
                        <span className="sc-rel-history-tick">T{entry.tick}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
};
