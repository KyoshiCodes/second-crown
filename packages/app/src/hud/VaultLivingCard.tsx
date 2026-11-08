import React from "react";
import { formatLetterSuffix, resourceLedger, type GameState } from "@second-crown/sim";
import { VaultSealLivingGlyph, VaultSealUnderlay } from "./VaultSealLivingGlyph";
import "./vault-living.css";

/**
 * Living vault cards on the Kingdom tab: stacked name / stock / safety rows, one card per store.
 * Display only. Every value comes from the sim's own `resourceLedger` (have, cap, vault, exposed,
 * full). No new game math: the only work here is choosing words and tones for existing numbers.
 */

export const VAULT_RESOURCES = ["food", "wood", "stone", "gold"] as const;
export type VaultResource = (typeof VAULT_RESOURCES)[number];

export type VaultRowKind = "name" | "stock" | "safety";
export type VaultRowTone = "safe" | "warn" | "danger" | "calm";

export interface VaultRow {
  kind: VaultRowKind;
  label: string;
  value: string;
  sub?: string;
  tone: VaultRowTone;
}

const NAME: Record<VaultResource, string> = {
  food: "Food",
  wood: "Wood",
  stone: "Stone",
  gold: "Gold",
};

function fmt(n: number): string {
  return formatLetterSuffix(String(Math.floor(n)));
}

/** Builds the three rows for one store from its ledger. */
export function vaultRows(state: GameState, res: VaultResource): VaultRow[] {
  const l = resourceLedger(state, res);
  const capped = Number.isFinite(l.cap);

  const name: VaultRow = { kind: "name", label: "Name", value: `${NAME[res]} vault`, tone: "calm" };

  const stock: VaultRow = l.full
    ? { kind: "stock", label: "Stock", value: fmt(l.have), sub: capped ? `/ ${fmt(l.cap)} full` : "full", tone: "danger" }
    : { kind: "stock", label: "Stock", value: fmt(l.have), sub: capped ? `/ ${fmt(l.cap)}` : undefined, tone: "calm" };

  // Safety: the vault floor is what a raid cannot take; anything above it is exposed.
  const safety: VaultRow =
    l.exposed <= 0
      ? { kind: "safety", label: "Safety", value: "All hidden", sub: `floor ${fmt(l.vault)}`, tone: "safe" }
      : { kind: "safety", label: "Safety", value: `${fmt(l.exposed)} exposed`, sub: `floor ${fmt(l.vault)}`, tone: "warn" };

  return [name, stock, safety];
}

export function VaultLivingCard(props: { state: GameState; res: VaultResource }) {
  const rows = vaultRows(props.state, props.res);
  const safe = rows[2]?.tone === "safe";
  return (
    <section
      className={`sc-vault-card is-living is-${props.res} ${safe ? "is-safe" : "is-exposed"}`}
      aria-label={`${NAME[props.res]} vault`}
    >
      <VaultSealUnderlay state={props.state} res={props.res} />
      <dl className="sc-vault-card-rows">
        {rows.map((r) => (
          <div key={r.kind} className={`sc-vault-card-row is-${r.kind} tone-${r.tone}`}>
            <dt className="sc-vault-card-label">
              <span className="sc-vault-card-pip" aria-hidden="true" />
              {r.label}
            </dt>
            <dd className="sc-vault-card-value">
              <span className="sc-vault-card-main">{r.value}</span>
              {r.sub ? <span className="sc-vault-card-sub">{r.sub}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
      <VaultSealLivingGlyph state={props.state} res={props.res} />
    </section>
  );
}

/** The four-card vault strip. */
export function VaultLivingCards(props: { state: GameState }) {
  return (
    <div className="sc-vault-cards" role="group" aria-label="Vaults">
      {VAULT_RESOURCES.map((res) => (
        <VaultLivingCard key={res} state={props.state} res={res} />
      ))}
    </div>
  );
}
