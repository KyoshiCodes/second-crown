import React from "react";
import { EVENT_PERIOD, EventSystem, type GameState } from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import "./event-advanced.css";

/**
 * Advanced read-outs for the world event cards: progress toward the next event,
 * time left, and plain-language outcome hints.
 * Display only. The countdown reads EventSystem.nextEventTick() and EVENT_PERIOD
 * from the sim; nothing here rolls, predicts, or changes an event.
 */

export type EventOutcomeKind = "gain" | "loss" | "rival" | "pending" | "news";

export interface EventOutcome {
  kind: EventOutcomeKind;
  /** Short tag: Gain / Loss / Rival / Undecided / News. */
  label: string;
  /** One plain sentence about what the event did (or may do). */
  hint: string;
}

const OUTCOME_BY_ID: Record<string, EventOutcome> = {
  harvest: { kind: "gain", label: "Gain", hint: "Food was added to your stores." },
  timber: { kind: "gain", label: "Gain", hint: "Wood was added to your stores." },
  tribute: { kind: "gain", label: "Gain", hint: "Gold was added to your treasury." },
  spoil: { kind: "loss", label: "Loss", hint: "Food was taken from your stores." },
  levy: { kind: "rival", label: "Rival", hint: "A rival realm grew its army. Your stores are untouched." },
};

/** What an event did, in plain words, from its existing id. */
export function eventOutcome(id: string, choiceCount = 0): EventOutcome {
  if (choiceCount > 0) return { kind: "pending", label: "Undecided", hint: "The outcome depends on your choice." };
  return OUTCOME_BY_ID[id] ?? { kind: "news", label: "News", hint: "See the event text for what changed." };
}

/** The kinds of event that can fire next (no odds, no prediction). */
export const EVENT_POSSIBLE_OUTCOMES: readonly { id: string; kind: EventOutcomeKind; text: string }[] = [
  { id: "harvest", kind: "gain", text: "Food gain" },
  { id: "timber", kind: "gain", text: "Wood gain" },
  { id: "tribute", kind: "gain", text: "Gold gain" },
  { id: "spoil", kind: "loss", text: "Food loss" },
  { id: "levy", kind: "rival", text: "Rival levy" },
];

/** Sim ticks as a short time: 42s, 3m 5s, 1h 4m. Rounds up to whole seconds. */
export function formatEventSpan(ticks: number): string {
  const total = Math.max(0, Math.ceil(ticks / TICKS_PER_SECOND));
  if (total < 60) return `${total}s`;
  const m = Math.floor(total / 60);
  if (m < 60) return `${m}m ${total % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export interface EventPace {
  nextTick: number;
  period: number;
  /** Ticks already passed in this period. */
  elapsed: number;
  /** Ticks until the next event fires. */
  left: number;
  /** 0..1 progress toward the next event. */
  fill: number;
}

/** Progress toward the next event, read from the sim's own schedule. */
export function eventPace(state: GameState): EventPace | null {
  const nextTick = EventSystem.nextEventTick(state);
  if (nextTick === null) return null;
  const period = EVENT_PERIOD;
  const left = Math.min(period, Math.max(0, nextTick - state.meta.tick));
  const elapsed = period - left;
  return { nextTick, period, elapsed, left, fill: elapsed / period };
}

/** "50s ago" for a past event; null when the clock is unknown or behind the event. */
export function eventAgeLabel(nowTick: number | undefined, eventTick: number): string | null {
  if (nowTick === undefined || nowTick < eventTick) return null;
  const age = nowTick - eventTick;
  return age < TICKS_PER_SECOND ? "just now" : `${formatEventSpan(age)} ago`;
}

/** Countdown card: progress bar, time left, and what could happen. */
export function EventNextCard(props: { state: GameState }) {
  const pace = eventPace(props.state);
  if (!pace) return null;
  const pct = Math.round(pace.fill * 100);
  return (
    <div className={`sc-event-next${pace.left <= 5 * TICKS_PER_SECOND ? " is-soon" : ""}`} data-event-next={pace.nextTick}>
      <div className="sc-event-next-head">
        <span className="sc-event-next-title">Next event</span>
        <span className="sc-event-next-left">
          in <strong>{formatEventSpan(pace.left)}</strong>
        </span>
      </div>
      <span
        className="sc-event-next-meter"
        role="progressbar"
        aria-label="Progress to next event"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <span className="sc-event-next-fill" style={{ width: `${pct}%` }} />
      </span>
      <div className="sc-event-next-sub">
        {pct}% · {pace.elapsed} / {pace.period} ticks
      </div>
      <div className="sc-event-next-hints">
        <span className="sc-event-next-hints-label">Could be</span>
        {EVENT_POSSIBLE_OUTCOMES.map((o) => (
          <span key={o.id} className={`sc-event-hint-chip is-${o.kind}`}>
            {o.text}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Footer on an event card: outcome tag, plain hint, and how long ago it fired. */
export function EventOutcomeFoot(props: { eventId: string; eventTick: number; choiceCount?: number; nowTick?: number }) {
  const outcome = eventOutcome(props.eventId, props.choiceCount);
  const age = eventAgeLabel(props.nowTick, props.eventTick);
  return (
    <div className={`sc-event-foot is-${outcome.kind}`} data-event-outcome={outcome.kind}>
      <span className="sc-event-outcome-tag">{outcome.label}</span>
      <span className="sc-event-outcome-hint">{outcome.hint}</span>
      {age ? <span className="sc-event-age">{age}</span> : null}
    </div>
  );
}
