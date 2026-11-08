import React from "react";
import {
  GATHER_NODES,
  garrisonAt,
  garrisonPower,
  incomingOnProvince,
  nodeStock,
  nodeStockMax,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { OutpostLivingGlyph, OutpostLivingUnderlay } from "./OutpostLivingGlyph";
import "./outpost-living.css";
import "./flag-living.css";

/**
 * Living outpost rows for the Kingdom tab Flags cards: stacked name / camp / flag / resources.
 * Display only. Every value comes from the province itself and the sim's existing readers
 * (`garrisonAt`, `garrisonPower`, `incomingOnProvince`, `nodeStock`, `nodeStockMax`,
 * `GATHER_NODES`). No new game math: the only work here is choosing words and tones for
 * existing numbers.
 */

export type OutpostRowKind = "name" | "camp" | "flag" | "resources";
export type OutpostRowTone = "safe" | "warn" | "danger" | "calm";

export interface OutpostRow {
  kind: OutpostRowKind;
  label: string;
  value: string;
  sub?: string;
  tone: OutpostRowTone;
  /** 0..1 fill for the resources meter: stock left over its max. Only on the resources row. */
  fill?: number;
}

export interface OutpostTile {
  id: string;
  node: string;
  x: number;
  y: number;
}

const NODE_NAME: Record<string, string> = {
  none: "Open ground",
  camp: "Hostile camp",
  woodcut: "Timber stand",
  quarry: "Stone outcrop",
  field: "Forage field",
  ruins: "Ruins",
};

const RESOURCE_NAME: Record<string, string> = { wood: "wood", food: "food", stone: "stone" };

/** Fallback realm name when the caller does not pass its own (fog-aware) resolver. */
function realmName(state: GameState, id: string): string {
  return state.realms.find((r) => r.id === id)?.name ?? id;
}

/** Builds the four rows for one of your flags. */
export function outpostRows(
  state: GameState,
  p: OutpostTile,
  nameOf: (realmId: string) => string = (id) => realmName(state, id),
): OutpostRow[] {
  const posted = garrisonAt(state, p.id);
  const power = posted ? garrisonPower(state, p.id) : 0;
  const troops = posted ? Object.values(posted.force).reduce((a, n) => a + (n > 0 ? n : 0), 0) : 0;
  const hit = incomingOnProvince(state, p.id);
  const eta = hit ? Math.max(0, Math.ceil((hit.arrivesTick - state.meta.tick) / TICKS_PER_SECOND)) : 0;

  const name: OutpostRow = {
    kind: "name",
    label: "Name",
    value: NODE_NAME[p.node] ?? p.node,
    sub: `${p.x},${p.y}`,
    tone: "calm",
  };

  const camp: OutpostRow = posted
    ? {
        kind: "camp",
        label: "Camp",
        value: `Garrison ${power}`,
        sub: `${troops} ${troops === 1 ? "soldier" : "soldiers"}`,
        tone: hit ? "warn" : "safe",
      }
    : { kind: "camp", label: "Camp", value: "Unguarded", sub: "no garrison", tone: hit ? "danger" : "warn" };

  const flag: OutpostRow = hit
    ? { kind: "flag", label: "Flag", value: "Under threat", sub: `${nameOf(hit.realmId)} in ${eta}s`, tone: "danger" }
    : { kind: "flag", label: "Flag", value: "Flying", sub: "no host inbound", tone: "safe" };

  const gather = GATHER_NODES[p.node as keyof typeof GATHER_NODES];
  let resources: OutpostRow;
  if (gather) {
    const left = nodeStock(state, p.id);
    const max = nodeStockMax(p.node);
    const res = RESOURCE_NAME[gather.resource] ?? gather.resource;
    resources = {
      kind: "resources",
      label: "Stock",
      value: left > 0 ? `${Math.floor(left)} ${res}` : "Dry",
      sub: `of ${max}`,
      tone: left <= 0 ? "danger" : left < max / 4 ? "warn" : "safe",
      fill: max > 0 ? Math.max(0, Math.min(1, left / max)) : 0,
    };
  } else {
    resources = { kind: "resources", label: "Stock", value: "No pile", sub: "nothing to gather", tone: "calm" };
  }

  return [name, camp, flag, resources];
}

export function OutpostLivingCard(props: {
  state: GameState;
  province: OutpostTile;
  nameOf?: (realmId: string) => string;
}) {
  const { state, province, nameOf } = props;
  const rows = outpostRows(state, province, nameOf);
  const posted = Boolean(garrisonAt(state, province.id));
  const hit = Boolean(incomingOnProvince(state, province.id));
  const mood = hit ? "is-threatened" : posted ? "is-guarded" : "is-bare";
  const rawMood = hit ? "threatened" : posted ? "guarded" : "bare";
  return (
    <section
      className={`sc-outpost-card is-living is-${province.node} ${mood} sc-flag-living`}
      aria-label={`${NODE_NAME[province.node] ?? province.node} flag at ${province.x},${province.y}`}
    >
      <OutpostLivingUnderlay mood={rawMood} />
      <dl className="sc-outpost-card-rows">
        {rows.map((r) => (
          <div key={r.kind} className={`sc-outpost-card-row is-${r.kind} tone-${r.tone}`}>
            <dt className="sc-outpost-card-label">
              <span className="sc-outpost-card-pip" aria-hidden="true" />
              {r.label}
            </dt>
            <dd className="sc-outpost-card-value">
              <span className="sc-outpost-card-main">{r.value}</span>
              {r.sub ? <span className="sc-outpost-card-sub">{r.sub}</span> : null}
              {r.fill !== undefined ? (
                <span className="sc-flag-meter" aria-hidden="true">
                  <span className="sc-flag-meter-fill" style={{ width: `${Math.round(r.fill * 100)}%` }} />
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
      <OutpostLivingGlyph state={state} province={province} nameOf={nameOf} />
    </section>
  );
}
