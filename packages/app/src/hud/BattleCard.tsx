import React from "react";
import type { LastBattleStory } from "@second-crown/sim";
import { ClashPip } from "./ClashPip";
import "./battle-card.css";

export function BattleCard(props: {
  story: LastBattleStory | null;
  report?: string;
  nameOf: (realmId: string) => string;
}) {
  const { story, report, nameOf } = props;
  if (!story) {
    return (
      <div className="sc-battle-card is-none">
        <span className="sc-battle-report">{report ?? "No field report yet."}</span>
      </div>
    );
  }
  const { winnerId, loserId } = story;
  const playerIn = winnerId === "player" || loserId === "player";
  const isLoss = playerIn && winnerId !== "player";
  const tone = !playerIn ? "is-other" : isLoss ? "is-lost" : "is-won";
  const verdict = !playerIn ? `${nameOf(winnerId)} won` : isLoss ? "Defeat" : "Victory";
  const pipVariant = isLoss ? "broken_shield" : "crossed_blades";
  const bill = story.phases.find((p) => /butcher/i.test(p.title));
  return (
    <div className={`sc-battle-card ${tone}`}>
      <span className="sc-battle-head">
        <span className="sc-battle-title-group">
          <ClashPip variant={pipVariant} size={28} />
          <span className="sc-battle-sides">
            <span className="sc-battle-side is-winner">{nameOf(winnerId)}</span>
            <span className="sc-battle-vs">vs</span>
            <span className="sc-battle-side">{nameOf(loserId)}</span>
          </span>
        </span>
        <span className="sc-battle-verdict">{verdict}</span>
      </span>
      {report ? <span className="sc-battle-report">{report}</span> : null}
      {bill ? <span className="sc-battle-bill">{bill.text}</span> : null}
      {story.events.length > 0 ? (
        <details className="sc-battle-log">
          <summary>Blow by blow ({Math.min(story.events.length, 8)})</summary>
          <ul>
            {story.events.slice(0, 8).map((ev, i) => (
              <li key={`${ev.round}-${i}`}>{ev.text}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
