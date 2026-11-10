import React from "react";
import type { WorldEvent } from "@second-crown/sim";
import { formatLetterSuffix } from "@second-crown/sim";
import { OmenPip, resolveOmenVariant } from "./OmenPip";
import { eventLedgerRows } from "./EventsLedger";
import { EventOmenLivingGlyph, EventOmenUnderlay, resolveOmenLiving } from "./EventsLivingGlyph";
import { EventLivingRows } from "./EventLivingRows";
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
  const choiceCount = choices?.length ?? 0;
  const { state } = resolveOmenLiving({ omen, eventId: event.id, latest, choiceCount });

  // EventLivingRows: omen pip in a tinted chip beside stacked Name / Omen / Duration rows,
  // all read from eventLedgerRows(); living omen glyph rests directly underneath, choices below.
  return (
    <div className={`sc-event-card is-${event.id}${latest ? " is-latest" : ""}`} data-event={event.id}>
      <EventOmenUnderlay omen={omen} eventId={event.id} latest={latest} choiceCount={choiceCount} />
      <EventLivingRows
        eventId={event.id}
        omen={omen}
        state={state}
        rows={eventLedgerRows({
          id: event.id,
          title,
          body,
          tickLabel: formatLetterSuffix(event.tick),
          latest,
          choiceCount,
        }).map((r) => (r.kind === "name" ? { ...r, lead: <OmenPip variant={omen} size={24} /> } : r))}
      />
      <EventOmenLivingGlyph omen={omen} eventId={event.id} latest={latest} choiceCount={choiceCount} />
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
