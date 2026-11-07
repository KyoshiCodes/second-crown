import React from "react";
import { ScrollPip } from "./ScrollPip";
import { EventsLedger, questLedgerRows } from "./EventsLedger";
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

  return (
    <div className={`sc-quest-card is-${status}`} data-quest={id}>
      <EventsLedger
        rows={questLedgerRows({ name, hint, gold, status, statusLabel: STATUS_LABEL[status] }).map((r) => {
          if (r.kind === "name") return { ...r, lead: <ScrollPip status={status} size={24} /> };
          if (r.kind === "reward" && status === "ready") {
            return {
              ...r,
              slot: (
                <button type="button" className="sc-quest-btn" onClick={props.onClaim}>
                  Claim {gold} gold
                </button>
              ),
            };
          }
          return r;
        })}
      />
    </div>
  );
}
