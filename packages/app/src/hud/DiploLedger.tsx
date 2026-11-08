import React from "react";
import type { RealmStance } from "./RealmCard";
import "./diplo-living.css";

/**
 * Stacked status rows for Diplomacy cards: name, stance, power.
 * Display only. Realm rows read what the realm cards already read
 * (realm name, stance, peace ticks left, opinion, realmPower). Pact rows read
 * the faction's own fields (name, kind, stance, memberRealmIds, leaderRealmId).
 * No new game math. Cards keep their own buttons.
 */

export type DiploLedgerKind = "name" | "stance" | "power";
export type DiploLedgerTone = "calm" | "busy" | "ready" | "off" | "truce";

export interface DiploLedgerRow {
  kind: DiploLedgerKind;
  label: string;
  value: string;
  sub?: string;
  tone: DiploLedgerTone;
  /** 0..1 bar under the row (your share of the power match-up). */
  fill?: number;
  /** Leading glyph (crest or seal pip). */
  lead?: React.ReactNode;
}

const STANCE_LABEL: Record<RealmStance, string> = {
  war: "At war",
  truce: "Truce",
  friendly: "Friendly",
  wary: "Wary",
  hostile: "Hostile",
};

const STANCE_TONE: Record<RealmStance, DiploLedgerTone> = {
  war: "off",
  truce: "truce",
  friendly: "ready",
  wary: "busy",
  hostile: "off",
};

/** Rows for one realm card. Truce seconds use the same rounding as the old header (10 ticks per second). */
export function realmLedgerRows(input: {
  name: string;
  nameSub?: string;
  stance: RealmStance;
  peaceLeft: number;
  opinion: number;
  myOpinion?: number;
  /** War-room match-up: your power vs theirs. */
  matchup?: { mine: number; theirs: number };
  /** World tab: their power if scouted, otherwise unknown. */
  power?: number;
  scouted?: boolean;
  lead?: React.ReactNode;
}): DiploLedgerRow[] {
  const { name, nameSub, stance, peaceLeft, opinion, myOpinion, matchup, power, scouted, lead } = input;

  const stanceRow: DiploLedgerRow = {
    kind: "stance",
    label: "Stance",
    value: `${STANCE_LABEL[stance]}${stance === "truce" ? ` ${Math.ceil(peaceLeft / 10)}s` : ""}`,
    sub: `opinion ${opinion}${myOpinion !== undefined ? ` · yours ${myOpinion}` : ""}`,
    tone: STANCE_TONE[stance],
  };

  let powerRow: DiploLedgerRow;
  if (matchup) {
    const { mine, theirs } = matchup;
    const favored = mine >= theirs;
    const share = mine + theirs > 0 ? Math.round((mine / (mine + theirs)) * 100) : 50;
    powerRow = {
      kind: "power",
      label: "Power",
      value: `${mine} vs ${theirs}`,
      sub: `${share}% yours`,
      tone: favored ? "ready" : "off",
      fill: share / 100,
    };
  } else {
    const seen = scouted ?? power !== undefined;
    powerRow = {
      kind: "power",
      label: "Power",
      value: seen && power !== undefined ? String(power) : "?",
      sub: seen ? "scouted" : "not scouted",
      tone: "calm",
    };
  }

  return [{ kind: "name", label: "Realm", value: name, sub: nameSub, tone: "calm", lead }, stanceRow, powerRow];
}

/** Rows for one pact (faction) card. Same cold rule the Join button already uses (stance below -10). */
export function pactLedgerRows(input: {
  name: string;
  kind?: string;
  stance: number;
  member: boolean;
  sworn: number;
  leadsIt?: boolean;
  lead?: React.ReactNode;
}): DiploLedgerRow[] {
  const { name, kind, stance, member, sworn, leadsIt, lead } = input;
  const cold = stance < -10;
  return [
    { kind: "name", label: "Pact", value: name, sub: kind, tone: "calm", lead },
    {
      kind: "stance",
      label: "Stance",
      value: String(stance),
      sub: member ? "member" : cold ? "too cold to join" : "open to you",
      tone: member ? "ready" : cold ? "off" : "calm",
    },
    {
      kind: "power",
      label: "Power",
      value: `${sworn} sworn`,
      sub: leadsIt ? "you lead" : undefined,
      tone: leadsIt ? "ready" : "calm",
    },
  ];
}

export function DiploLedger(props: { rows: DiploLedgerRow[]; className?: string }) {
  return (
    <dl className={`sc-diplo-ledger${props.className ? ` ${props.className}` : ""}`}>
      {props.rows.map((r) => (
        <div key={r.kind} className={`sc-diplo-ledger-row is-${r.kind} tone-${r.tone}`}>
          <dt className="sc-diplo-ledger-label">{r.label}</dt>
          <dd className="sc-diplo-ledger-value">
            {r.lead ? <span className="sc-diplo-ledger-lead">{r.lead}</span> : null}
            <span className="sc-diplo-ledger-main">{r.value}</span>
            {r.sub ? <span className="sc-diplo-ledger-sub">{r.sub}</span> : null}
          </dd>
          {r.fill !== undefined ? (
            <span
              className="sc-diplo-ledger-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={r.fill}
            >
              <span className="sc-diplo-ledger-fill" style={{ width: `${Math.round(r.fill * 100)}%` }} />
            </span>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
