import React from "react";
import { ScrollPip } from "./ScrollPip";
import "./quest-card.css";

export type QuestStatus = "open" | "ready" | "claimed";

export function questStatus(complete: boolean, claimed: boolean): QuestStatus {
  if (claimed) return "claimed";
  if (complete) return "ready";
  return "open";
}

const STATUS_LABEL: Record<QuestStatus, string> = {
  open: "In progress",
  ready: "Ready",
  claimed: "Claimed",
};

export function QuestCard(props: {
  id: string;
  name: string;
  hint: string;
  gold: number;
  complete: boolean;
  claimed: boolean;
  onClaim: () => void;
}) {
  const { id, name, hint, gold, complete, claimed } = props;
  const status = questStatus(complete, claimed);
  const done = complete || claimed ? 1 : 0;

  return (
    <div className={`sc-quest-card is-${status}`} data-quest={id}>
      <span className="sc-quest-head">
        <span className="sc-quest-title-group">
          <ScrollPip status={status} size={24} />
          <span className="sc-quest-title">{name}</span>
        </span>
        <span className={`sc-quest-status is-${status}`}>{STATUS_LABEL[status]}</span>
      </span>
      <span className="sc-quest-hint">{hint}</span>
      <span className="sc-quest-progress" role="progressbar" aria-valuemin={0} aria-valuemax={1} aria-valuenow={done}>
        <span className="sc-quest-progress-fill" style={{ width: `${done * 100}%` }} />
      </span>
      <span className="sc-quest-foot">
        <span className="sc-quest-count">{done}/1</span>
        {status === "ready" ? (
          <button type="button" className="sc-quest-btn" onClick={props.onClaim}>
            Claim {gold} gold
          </button>
        ) : (
          <span className="sc-quest-reward">{claimed ? `+${gold} gold taken` : `${gold} gold`}</span>
        )}
      </span>
    </div>
  );
}
