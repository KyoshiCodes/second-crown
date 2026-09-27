import React from "react";
import type { WorldEvent } from "@second-crown/sim";
import { formatLetterSuffix } from "@second-crown/sim";
import { OmenPip, resolveOmenVariant } from "./OmenPip";
import "./event-card.css";

export type EventChoice = {
  id: string;
  label: string;
  disabled?: boolean;
  onPick: () => void;
};

export function splitEventText(text: string): { title: string; body: string } {
  const at = text.indexOf(" — ");
  if (at < 0) return { title: text, body: "" };
  return { title: text.slice(0, at), body: text.slice(at + 3) };
}

export function EventCard(props: {
  event: WorldEvent;
  latest?: boolean;
  choices?: EventChoice[];
}) {
  const { event, latest, choices } = props;
  const { title, body } = splitEventText(event.text);
  const omen = resolveOmenVariant(event.id, event.text);

  return (
    <div className={`sc-event-card is-${event.id}${latest ? " is-latest" : ""}`} data-event={event.id}>
      <span className="sc-event-head">
        <OmenPip variant={omen} size={24} />
        <span className="sc-event-title">{title}</span>
        <span className="sc-event-tick">t{formatLetterSuffix(event.tick)}</span>
      </span>
      {body ? <span className="sc-event-body">{body}</span> : null}
      {choices && choices.length > 0 ? (
        <span className="sc-event-choices">
          {choices.map((c) => (
            <button key={c.id} type="button" className="sc-event-btn" disabled={c.disabled} onClick={c.onPick}>
              {c.label}
            </button>
          ))}
        </span>
      ) : null}
    </div>
  );
}
