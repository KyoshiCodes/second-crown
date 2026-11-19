import React from "react";
import { listQuests, type GameState } from "@second-crown/sim";
import { ScrollPip } from "./ScrollPip";
import { questStatus } from "./QuestCard";
import "./quests-status-line.css";

/**
 * A quest in the sim is one goal: `done(state)` is either met or not, and its gold is paid once on
 * Claim. The line treats every quest not yet claimed as "active", shows its progress as 0/1 or 1/1
 * (the same count the quest cards show), and the gold it grants.
 */

export interface QuestStatusRow {
  /** The quest's id in the sim's QUESTS table. */
  id: string;
  name: string;
  /** "open": goal not met yet. "ready": goal met, gold waiting on Claim. */
  status: "open" | "ready";
  /** Goals met out of goals set, as on the quest card. */
  done: number;
  of: number;
  /** "0/1 in progress" or "1/1 ready to claim". */
  progress: string;
  /** Gold the sim pays on Claim, straight from QUESTS. */
  gold: number;
  reward: string;
  /** This quest's part of the line, e.g. "Raise a chapel, 0/1 in progress: 20 gold". */
  text: string;
}

export interface QuestsStatus {
  /** "none": every quest claimed. "active": at least one left. */
  kind: "none" | "active";
  active: number;
  /** Active quests whose goal is met and can be claimed now. */
  ready: number;
  /** Active quests, in table order. */
  rows: QuestStatusRow[];
  headline: string;
  /** The whole line as plain text, for labels and tests. */
  text: string;
}

export const QUESTS_NONE_TEXT = "Every quest claimed.";

/** Reads the sim's quest list and builds the line's text. No quest rules or gold math here. */
export function questsStatus(state: GameState): QuestsStatus {
  const rows: QuestStatusRow[] = [];
  for (const q of listQuests(state)) {
    const status = questStatus(q.complete, q.claimed);
    if (status === "claimed") continue;
    const done = status === "ready" ? 1 : 0;
    const progress = `${done}/1 ${status === "ready" ? "ready to claim" : "in progress"}`;
    const gold = q.def.gold;
    const reward = `${gold} gold`;
    rows.push({ id: q.def.id, name: q.def.name, status, done, of: 1, progress, gold, reward, text: `${q.def.name}, ${progress}: ${reward}` });
  }
  if (rows.length === 0) {
    const headline = "None active";
    return { kind: "none", active: 0, ready: 0, rows, headline, text: `Quests · ${headline} · ${QUESTS_NONE_TEXT}` };
  }
  const ready = rows.filter((r) => r.status === "ready").length;
  const headline = ready > 0 ? `${rows.length} active, ${ready} ready` : `${rows.length} active`;
  return {
    kind: "active",
    active: rows.length,
    ready,
    rows,
    headline,
    text: `Quests · ${headline} · ${rows.map((r) => r.text).join(" · ")}`,
  };
}

/**
 * Read-only quests status line for the Kingdom tab and the province inspect card: the quests not yet
 * claimed, the progress on each, and the gold each grants. No button; quests are claimed on the
 * Quests panel.
 */
export function QuestsStatusLine(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const s = questsStatus(state);
  const pip = s.kind === "none" ? "claimed" : s.ready > 0 ? "ready" : "open";
  return (
    <div
      className={`sc-quests-status-line is-${s.kind}${s.ready > 0 ? " has-ready" : ""}`}
      data-quests-status={s.kind}
      data-quests-active={s.active}
      data-quests-ready={s.ready}
      aria-label={s.text}
    >
      <ScrollPip status={pip} size={14} className="sc-quests-status-icon" />
      <span className="sc-quests-status-text">
        <span className="sc-quests-status-label">Quests</span> ·{" "}
        <span className="sc-quests-status-headline">{s.headline}</span>
        {s.kind === "none" ? (
          <>
            {" "}
            · <span className="sc-quests-status-note">{QUESTS_NONE_TEXT}</span>
          </>
        ) : (
          s.rows.map((r) => (
            <span key={r.id} className={`sc-quests-status-quest is-${r.status}`} data-quest={r.id}>
              {" "}
              · <strong>{r.name}</strong>, <span className="sc-quests-status-progress">{r.progress}</span>:{" "}
              <span className="sc-quests-status-reward">{r.reward}</span>
            </span>
          ))
        )}
      </span>
    </div>
  );
}
