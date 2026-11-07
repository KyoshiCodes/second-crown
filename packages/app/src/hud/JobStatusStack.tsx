import React from "react";
import "./job-status-stack.css";

/**
 * Stacked living status rows on a People card: job, post, idle.
 * Display only. Every value is read from what JobCard already has (card name, worker count,
 * the walk-to sites it already labels, the post list it already offers) plus the kingdom idle
 * count PeoplePanel already grouped. No new game math, no sim calls.
 */

export type JobStatusKind = "job" | "post" | "idle";

export type JobStatusTone = "busy" | "warn" | "calm" | "none";

export type JobStatusRow = {
  kind: JobStatusKind;
  label: string;
  value: string;
  tone: JobStatusTone;
};

export type JobStatusInput = {
  /** Card title, e.g. "Farmer" or "Idle". */
  name: string;
  idle: boolean;
  /** Workers on this card. */
  count: number;
  /** Walk-to sites JobCard already labels, as [label, hands]. */
  sites: ReadonlyArray<readonly [string, number]>;
  /** How many buildings the card's "Post at…" list offers. */
  postCount: number;
  /** Hands on the Idle card across the kingdom (0 when there is no Idle card). */
  kingdomIdle: number;
};

const hands = (n: number) => `${n} ${n === 1 ? "hand" : "hands"}`;
const posts = (n: number) => `${n} ${n === 1 ? "post" : "posts"}`;

/** Builds the three rows, always in the same order. Pure: does not touch its input. */
export function jobStatusRows(input: JobStatusInput): JobStatusRow[] {
  const { name, idle, count, sites, postCount, kingdomIdle } = input;
  const rows: JobStatusRow[] = [];

  // Job: the trade and how many hands work it.
  rows.push(
    idle
      ? { kind: "job", label: "Job", value: `No trade yet · ${hands(count)}`, tone: "none" }
      : { kind: "job", label: "Job", value: `${name} · ${hands(count)}`, tone: count > 0 ? "busy" : "none" }
  );

  // Post: where the hands walk, or how many posts the picker offers.
  if (idle) {
    rows.push(
      postCount > 0
        ? { kind: "post", label: "Post", value: `None · ${posts(postCount)} to pick`, tone: "warn" }
        : { kind: "post", label: "Post", value: "None · build a staffed hall", tone: "none" }
    );
  } else if (sites.length === 0) {
    rows.push({ kind: "post", label: "Post", value: "—", tone: "none" });
  } else {
    const text = sites.map(([k, n]) => (n > 1 ? `${k} ×${n}` : k)).join(" · ");
    rows.push({ kind: "post", label: "Post", value: text, tone: "calm" });
  }

  // Idle: on the Idle card, who is waiting; elsewhere, spare hands in the kingdom.
  if (idle) {
    rows.push({ kind: "idle", label: "Idle", value: `${hands(count)} waiting for work`, tone: count > 0 ? "warn" : "calm" });
  } else if (kingdomIdle > 0) {
    rows.push({ kind: "idle", label: "Idle", value: `None here · ${hands(kingdomIdle)} idle in kingdom`, tone: "warn" });
  } else {
    rows.push({ kind: "idle", label: "Idle", value: "None · every hand posted", tone: "calm" });
  }

  return rows;
}

export function JobStatusStack(props: JobStatusInput) {
  const rows = jobStatusRows(props);
  return (
    <dl className="sc-jobstat" aria-label={`${props.name} living status`}>
      {rows.map((r) => (
        <div key={r.kind} className={`sc-jobstat-row is-${r.kind} tone-${r.tone}`}>
          <dt className="sc-jobstat-label">
            <span className="sc-jobstat-pip" aria-hidden="true" />
            {r.label}
          </dt>
          <dd className="sc-jobstat-value">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
