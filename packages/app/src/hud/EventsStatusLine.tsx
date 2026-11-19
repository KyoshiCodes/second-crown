import React from "react";
import { EVENT_PERIOD, getEventLog, type GameState, type WorldEvent } from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { OmenPip } from "./OmenPip";
import { eventPace } from "./EventAdvanced";
import { splitEventText } from "./EventCard";
import "./events-status-line.css";

/**
 * World events in the sim fire once every EVENT_PERIOD ticks and apply their effect on that tick.
 * The line treats the event of the current period as "active": it stands until the next event
 * replaces it, and its time left is the sim's own countdown to that next event.
 */

export interface EventStatusRow {
  /** The event's id from the sim's event log (harvest, timber, spoil, levy, tribute). */
  id: string;
  /** The tick it fired on. */
  tick: number;
  name: string;
  /** Ticks until the next event replaces this one, from EventSystem.nextEventTick. Always above 0. */
  ticksLeft: number;
  /** Seconds left, rounded up like the "Next event" card. */
  secondsLeft: number;
  /** What the event granted: the part of the sim's text after the dash. */
  effect: string;
  /** This event's part of the line, e.g. "Bountiful harvest, 32s left: +25 food". */
  text: string;
}

export interface EventsStatus {
  /** "none": no event this period (fresh crown, or none fired yet). "active": one in force. */
  kind: "none" | "active";
  active: number;
  rows: EventStatusRow[];
  headline: string;
  /** Seconds until the next event fires. */
  nextSeconds: number;
  /** The whole line as plain text, for labels and tests. */
  text: string;
}

/** The event that fired in the current period, if any. Reads the sim's log, then its last_event flags. */
export function currentPeriodEvent(state: GameState): WorldEvent | null {
  const periodStart = Math.floor(state.meta.tick / EVENT_PERIOD) * EVENT_PERIOD;
  if (periodStart <= 0) return null;
  const log = getEventLog(state);
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i].tick === periodStart) return log[i];
  }
  const flagTick = Number(state.flags["last_event_tick"] ?? 0);
  const flagText = state.flags["last_event"];
  if (flagTick === periodStart && typeof flagText === "string" && flagText) {
    return { tick: flagTick, id: "latest", text: flagText };
  }
  return null;
}

export function eventsNoneText(nextSeconds: number): string {
  return `No event in force. Next event in ${nextSeconds}s.`;
}

/** Reads the sim's event log and schedule and builds the line's text. No event math here. */
export function eventsStatus(state: GameState): EventsStatus {
  const pace = eventPace(state);
  const ticksLeft = pace ? pace.left : EVENT_PERIOD;
  const nextSeconds = Math.ceil(ticksLeft / TICKS_PER_SECOND);
  const rows: EventStatusRow[] = [];
  const ev = currentPeriodEvent(state);
  if (ev && ticksLeft > 0) {
    const { title, body } = splitEventText(ev.text);
    const effect = body || "—";
    rows.push({
      id: ev.id,
      tick: ev.tick,
      name: title,
      ticksLeft,
      secondsLeft: nextSeconds,
      effect,
      text: `${title}, ${nextSeconds}s left: ${effect}`,
    });
  }
  if (rows.length === 0) {
    const headline = "None active";
    return { kind: "none", active: 0, rows, headline, nextSeconds, text: `Events · ${headline} · ${eventsNoneText(nextSeconds)}` };
  }
  const headline = `${rows.length} active`;
  return {
    kind: "active",
    active: rows.length,
    rows,
    headline,
    nextSeconds,
    text: `Events · ${headline} · ${rows.map((r) => r.text).join(" · ")}`,
  };
}

/**
 * Read-only events status line for the Kingdom tab and the province inspect card: the world event
 * of the current period, how long until the next one replaces it, and what it granted. No button.
 */
export function EventsStatusLine(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const s = eventsStatus(state);
  const lead = s.rows[0];
  return (
    <div
      className={`sc-events-status-line is-${s.kind}`}
      data-events-status={s.kind}
      data-events-active={s.active}
      aria-label={s.text}
    >
      <OmenPip size={14} eventId={lead?.id} text={lead ? lead.name : undefined} className="sc-events-status-icon" />
      <span className="sc-events-status-text">
        <span className="sc-events-status-label">Events</span> ·{" "}
        <span className="sc-events-status-headline">{s.headline}</span>
        {s.kind === "none" ? (
          <>
            {" "}
            · <span className="sc-events-status-note">{eventsNoneText(s.nextSeconds)}</span>
          </>
        ) : (
          s.rows.map((r) => (
            <span key={`${r.tick}-${r.id}`} className="sc-events-status-event" data-event={r.id}>
              {" "}
              · <strong>{r.name}</strong>, <span className="sc-events-status-time">{r.secondsLeft}s left</span>:{" "}
              <span className="sc-events-status-effect">{r.effect}</span>
            </span>
          ))
        )}
      </span>
    </div>
  );
}
