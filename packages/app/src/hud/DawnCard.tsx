import React from "react";
import { listAchievements, formatLetterSuffix, tryAscend, type GameState } from "@second-crown/sim";
import type { ActFn } from "../game/useGameEngine";
import { DawnSealPip } from "./DawnSealPip";
import "./dawn-card.css";

/**
 * Second Dawn card on the Crown tab. Shows facts already in the save
 * (achievements done, sieges the hold stood, offline shield bought) and holds the one
 * Ascend button. The button only calls tryAscend; all wipe/keep rules live in the sim.
 * Displays a 28px living Dawn Seal Pip (pointer-events none).
 */
export function DawnCard(props: { state: GameState | undefined; act: ActFn; ascendReady: boolean; ascendNeed: number }) {
  const { state, act, ascendReady, ascendNeed } = props;
  const [note, setNote] = React.useState("");
  const refusal = `Ascend at ${formatLetterSuffix(ascendNeed)} total resources.`;
  const achievements = state ? listAchievements(state) : [];
  const done = achievements.filter((a) => a.done).length;
  const dawned = achievements.some((a) => a.def.id === "ach_ascend" && a.done);
  const shieldBought = achievements.some((a) => a.def.id === "ach_shield" && a.done);
  // Sieges on the player's hold are wars with ids "w_siege_<tick>"; defender_won means the hold stood.
  // state.wars is cleared on ascent, so this counts the current age only.
  const holdStood = state
    ? state.wars.filter((w) => w.id.startsWith("w_siege_") && w.defenderRealmId === "player" && w.status === "defender_won").length
    : 0;
  // Dawn count is prestige_level in the save. The sim's stacking dawn bonus is +1 production per dawn
  // (each point is +4% income) and it stacks. The first dawn also grants 1 militia, +20 food and
  // +10 wood once per crown (flags.dawn_gift in tryAscend); that gift does not stack.
  const dawnCount = state ? Number(state.flags["prestige_level"] ?? 0) : 0;
  const bonusLine =
    dawnCount === 0
      ? "Dawn 0 · next crown starts with +1 production (+4% income)"
      : `Dawn ${dawnCount} · +${dawnCount} production kept; next crown stacks to +${dawnCount + 1} (+${(dawnCount + 1) * 4}% income)`;

  return (
    <div className={`sc-work-card sc-dawn-card ${dawned ? "is-dawned" : ""}`}>
      <div className="sc-work-head">
        <span className="sc-dawn-title-group">
          <DawnSealPip active={dawned} size={28} />
          <span className="sc-work-name">Second Dawn</span>
        </span>
        <span className="sc-work-level">{dawned ? "risen" : "not yet"}</span>
      </div>
      <ul className="sc-dawn-facts">
        <li className={done === achievements.length && done > 0 ? "is-met" : ""}>
          <span className="sc-dawn-label">Achievements</span>
          <span className="sc-dawn-value">{done} / {achievements.length}</span>
        </li>
        <li className={holdStood > 0 ? "is-met" : ""}>
          <span className="sc-dawn-label">Hold stood</span>
          <span className="sc-dawn-value">{holdStood > 0 ? `${holdStood} siege${holdStood === 1 ? "" : "s"} this age` : "no siege yet"}</span>
        </li>
        <li className={shieldBought ? "is-met" : ""}>
          <span className="sc-dawn-label">Offline shield</span>
          <span className="sc-dawn-value">{shieldBought ? "bought" : "never bought"}</span>
        </li>
      </ul>
      <div className="sc-dawn-ascend">
        <span className="sc-dawn-ascend-note">{ascendReady ? note || "The crown is ready." : refusal}</span>
        <button
          type="button"
          className="sc-work-btn"
          disabled={!state || !ascendReady}
          title={ascendReady ? undefined : refusal}
          onClick={() =>
            act((st) => {
              const msg = tryAscend(st) ? "Ascended. Pick a doctrine." : "Not ready.";
              setNote(msg);
              return msg;
            })
          }
        >
          Ascend
        </button>
      </div>
      <div className="sc-dawn-bonus">{bonusLine}</div>
      <div className="sc-dawn-stores">First dawn also starts with +20 food and +10 wood. It does not stack.</div>
    </div>
  );
}
