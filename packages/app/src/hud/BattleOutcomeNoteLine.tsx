import React from "react";
import {
  battleOutcomeNoteSnapshot,
  type BattleOutcomeNote,
  type GameState,
} from "@second-crown/sim";
import "./battle-outcome-note.css";

/**
 * Defensive pure reader over `@second-crown/sim`'s `battleOutcomeNoteSnapshot(state)`.
 * Returns `null` with no recent battle, `living_battle_notes` off, or partial state.
 */
export function resolveBattleOutcomeNote(
  state: GameState | null | undefined,
): BattleOutcomeNote | null {
  if (!state?.flags || !state.meta) {
    return null;
  }
  try {
    return battleOutcomeNoteSnapshot(state);
  } catch {
    return null;
  }
}

/**
 * Quiet War tab last-battle note & suggestion reading `battleOutcomeNoteSnapshot(state)`.
 * Hides cleanly when `null` or empty.
 */
export const BattleOutcomeNoteLine: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const snap = resolveBattleOutcomeNote(state);
  if (!snap || (!snap.last && !snap.suggestion)) return null;

  return (
    <div
      className="sc-battle-note-line"
      data-battle-note-tick={snap.last?.tick ?? "none"}
    >
      <span className="sc-battle-note-pip" aria-hidden="true" />
      {snap.last ? (
        <>
          <span className="sc-battle-note-text">{snap.last.text}</span>
          <span className="sc-battle-note-tick">T{snap.last.tick}</span>
        </>
      ) : null}
      {snap.suggestion ? (
        <span className="sc-battle-note-suggest">· {snap.suggestion}</span>
      ) : null}
    </div>
  );
};
