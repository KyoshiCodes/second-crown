import React from "react";
import type { GameState, WorldEvent } from "@second-crown/sim";
import { EventCard } from "./hud/EventCard";
import { EventNextCard } from "./hud/EventAdvanced";
import { miraRemark } from "./content/mira";

export function EventPanel(props: {
  lastEvent: string;
  lastEventTick: number;
  log: WorldEvent[];
  state?: GameState;
}) {
  const mira = miraRemark(props.state, props.lastEvent);
  const newestFirst = props.log.slice().reverse();
  const latest = newestFirst[0] ?? (props.lastEvent ? { tick: props.lastEventTick, id: "latest", text: props.lastEvent } : undefined);
  const older = newestFirst.slice(1);
  const nowTick = props.state?.meta.tick;

  return (
    <div className="sc-event-panel">
      {props.state ? <EventNextCard state={props.state} /> : null}
      <div className="sc-event-label">Latest event</div>
      {latest ? (
        <EventCard event={latest} latest nowTick={nowTick} />
      ) : (
        <div className="sc-event-empty">Nothing yet — events fire every 500 ticks (~50s).</div>
      )}
      <div className="sc-event-mira">
        <div className="sc-event-mira-name">Advisor Mira</div>
        <em>{mira}</em>
      </div>
      {older.length > 0 && (
        <div className="sc-event-grid">
          {older.map((e) => (
            <EventCard key={`${e.tick}-${e.id}`} event={e} nowTick={nowTick} />
          ))}
        </div>
      )}
    </div>
  );
}
