import React from "react";
import type { GameState } from "@second-crown/sim";
import type { DiploLedgerRow, DiploLedgerTone } from "./DiploLedger";
import type { RealmStance } from "./RealmCard";
import "./diplo-living-rows.css";

/**
 * Living status column on a realm card: the crest pip sits in a stance-tinted
 * chip beside stacked Name / Stance / Pact rows, with the existing Power row
 * kept underneath. Display only. Name, Stance and Power are the rows
 * realmLedgerRows() already builds; Pact reads the factions' own fields
 * (name, kind, leaderRealmId, memberRealmIds). No new game math. Cards keep
 * their own buttons.
 */

export type DiploLivingKind = "name" | "stance" | "pact" | "power";

export const DIPLO_LIVING_KINDS: readonly DiploLivingKind[] = ["name", "stance", "pact", "power"];

const LABEL: Record<DiploLivingKind, string> = {
  name: "Realm",
  stance: "Stance",
  pact: "Pact",
  power: "Power",
};

const STANCE_WORD: Record<RealmStance, string> = {
  war: "at war",
  truce: "truce",
  friendly: "friendly",
  wary: "wary",
  hostile: "hostile",
};

type Faction = NonNullable<GameState["factions"]>[number];

export interface RealmPact {
  name: string;
  kind?: string;
  leads: boolean;
  withYou: boolean;
  sworn: number;
  more: number;
}

/** First faction the realm is sworn to, read straight from faction fields. */
export function realmPactOf(factions: readonly Faction[] | undefined, realmId: string): RealmPact | null {
  const sworn = (factions ?? []).filter((f) => f.memberRealmIds.includes(realmId));
  const f = sworn[0];
  if (!f) return null;
  return {
    name: f.name,
    kind: f.kind,
    leads: f.leaderRealmId === realmId,
    withYou: f.memberRealmIds.includes("player"),
    sworn: f.memberRealmIds.length,
    more: sworn.length - 1,
  };
}

export interface DiploLivingRow {
  kind: DiploLivingKind;
  value: string;
  sub?: string;
  tone: DiploLedgerTone;
  fill?: number;
}

export function pactLivingRow(pact: RealmPact | null): DiploLivingRow {
  if (!pact) return { kind: "pact", value: "No pact", sub: "unsworn", tone: "calm" };
  const bits = [
    pact.kind,
    pact.leads ? "leads it" : undefined,
    `${pact.sworn} sworn`,
    pact.withYou ? "with you" : undefined,
    pact.more > 0 ? `+${pact.more} more` : undefined,
  ].filter(Boolean);
  return { kind: "pact", value: pact.name, sub: bits.join(" · "), tone: pact.withYou ? "ready" : "busy" };
}

/** Name / Stance / Pact / Power order from the existing ledger rows plus the pact row. */
export function orderDiploRows(rows: DiploLedgerRow[], pact: RealmPact | null): DiploLivingRow[] {
  const out: DiploLivingRow[] = [];
  for (const kind of DIPLO_LIVING_KINDS) {
    if (kind === "pact") {
      out.push(pactLivingRow(pact));
      continue;
    }
    const r = rows.find((x) => x.kind === kind);
    if (r) out.push({ kind, value: r.value, sub: r.sub, tone: r.tone, fill: r.fill });
  }
  return out;
}

export function DiploLivingRows(props: {
  realmId: string;
  stance: RealmStance;
  rows: DiploLedgerRow[];
  pact: RealmPact | null;
}) {
  const { realmId, stance, pact } = props;
  const lead = props.rows.find((r) => r.kind === "name")?.lead;
  const rows = orderDiploRows(props.rows, pact);
  return (
    <div className={`sc-diplo-living-head is-${stance}${pact?.withYou ? " is-sworn" : ""}`} data-realm-rows={realmId}>
      <span className="sc-diplo-living-chip" aria-hidden="true">
        {lead}
      </span>
      <dl className="sc-diplo-living-rows">
        {rows.map((r) => (
          <div key={r.kind} className={`sc-diplo-living-row is-${r.kind} tone-${r.tone}`} data-kind={r.kind}>
            <dt className="sc-diplo-living-label">{LABEL[r.kind]}</dt>
            <dd className="sc-diplo-living-value">
              <span className="sc-diplo-living-main">{r.value}</span>
              {r.kind === "name" ? (
                <span className="sc-diplo-living-tag">{STANCE_WORD[stance]}</span>
              ) : null}
              {r.sub ? <span className="sc-diplo-living-sub">{r.sub}</span> : null}
            </dd>
            {r.fill !== undefined ? (
              <span
                className="sc-diplo-living-meter"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={r.fill}
              >
                <span className="sc-diplo-living-meter-fill" style={{ width: `${Math.round(r.fill * 100)}%` }} />
              </span>
            ) : null}
          </div>
        ))}
      </dl>
    </div>
  );
}
