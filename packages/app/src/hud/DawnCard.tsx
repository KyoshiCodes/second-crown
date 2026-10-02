import { listAchievements, type GameState } from "@second-crown/sim";
import "./dawn-card.css";

/**
 * Second Dawn card on the Crown tab. Read-only: it shows facts already in the save
 * (achievements done, sieges the hold stood, offline shield bought). It has no buttons;
 * the Second Dawn action itself stays on the Ascend row (tryAscend).
 */
export function DawnCard(props: { state: GameState | undefined }) {
  const { state } = props;
  const achievements = state ? listAchievements(state) : [];
  const done = achievements.filter((a) => a.done).length;
  const dawned = achievements.some((a) => a.def.id === "ach_ascend" && a.done);
  const shieldBought = achievements.some((a) => a.def.id === "ach_shield" && a.done);
  // Sieges on the player's hold are wars with ids "w_siege_<tick>"; defender_won means the hold stood.
  // state.wars is cleared on ascent, so this counts the current age only.
  const holdStood = state
    ? state.wars.filter((w) => w.id.startsWith("w_siege_") && w.defenderRealmId === "player" && w.status === "defender_won").length
    : 0;

  return (
    <div className={`sc-work-card sc-dawn-card ${dawned ? "is-dawned" : ""}`}>
      <div className="sc-work-head">
        <span className="sc-work-name">Second Dawn</span>
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
    </div>
  );
}
