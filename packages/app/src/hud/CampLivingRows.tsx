import React from "react";
import {
  GATHER_NODES,
  getProvince,
  incomingOnProvince,
  nodeStock,
  nodeStockMax,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { CampLivingGlyph, CampLivingUnderlay, type CampMood } from "./CampLivingGlyph";
import "./camp-living.css";

/**
 * Living camp rows for the War Room Garrisons cards: stacked name / flag / resources.
 * Display only. Every value comes from the province and the sim's existing readers
 * (`getProvince`, `incomingOnProvince`, `nodeStock`, `nodeStockMax`, `GATHER_NODES`).
 * No new game math: the only work here is choosing words and tones for existing numbers.
 */

export type CampRowKind = "name" | "flag" | "resources";
export type CampRowTone = "safe" | "warn" | "danger" | "calm";

export interface CampRow {
  kind: CampRowKind;
  label: string;
  value: string;
  sub?: string;
  tone: CampRowTone;
}

const NODE_NAME: Record<string, string> = {
  none: "Open ground",
  hold: "Hold",
  camp: "Hostile camp",
  woodcut: "Timber stand",
  quarry: "Stone outcrop",
  field: "Forage field",
  ruins: "Ruins",
};

const RESOURCE_NAME: Record<string, string> = { wood: "wood", food: "food", stone: "stone" };

function realmName(state: GameState, id: string): string {
  return state.realms.find((r) => r.id === id)?.name ?? id;
}

/** Builds the three rows for the camp a garrison holds at `provinceId`. Empty if the tile is gone. */
export function campRows(
  state: GameState,
  provinceId: string,
  nameOf: (realmId: string) => string = (id) => realmName(state, id),
): CampRow[] {
  const p = getProvince(state, provinceId);
  if (!p) return [];
  const hit = incomingOnProvince(state, provinceId);
  const eta = hit ? Math.max(0, Math.ceil((hit.arrivesTick - state.meta.tick) / TICKS_PER_SECOND)) : 0;

  const name: CampRow = {
    kind: "name",
    label: "Name",
    value: NODE_NAME[p.node] ?? p.node,
    sub: `${p.x},${p.y}`,
    tone: "calm",
  };

  const flag: CampRow = hit
    ? { kind: "flag", label: "Flag", value: "Under threat", sub: `${nameOf(hit.realmId)} in ${eta}s`, tone: "danger" }
    : p.occupantRealmId === "player"
      ? { kind: "flag", label: "Flag", value: "Flying", sub: "no host inbound", tone: "safe" }
      : { kind: "flag", label: "Flag", value: "Struck", sub: "flag not yours", tone: "warn" };

  const gather = GATHER_NODES[p.node as keyof typeof GATHER_NODES];
  let resources: CampRow;
  if (gather) {
    const left = nodeStock(state, provinceId);
    const max = nodeStockMax(p.node);
    const res = RESOURCE_NAME[gather.resource] ?? gather.resource;
    resources = {
      kind: "resources",
      label: "Stock",
      value: left > 0 ? `${Math.floor(left)} ${res}` : "Dry",
      sub: `of ${max}`,
      tone: left < max / 4 ? "warn" : "safe",
    };
  } else {
    resources = { kind: "resources", label: "Stock", value: "No pile", sub: "nothing to gather", tone: "calm" };
  }

  return [name, flag, resources];
}

export function CampLivingRows(props: {
  state: GameState;
  provinceId: string;
  nameOf?: (realmId: string) => string;
}) {
  const { state, provinceId, nameOf } = props;
  const rows = campRows(state, provinceId, nameOf);
  if (rows.length === 0) return null;
  const p = getProvince(state, provinceId);
  const node = p?.node ?? "none";
  const hit = Boolean(incomingOnProvince(state, provinceId));
  const mood: CampMood = hit ? "threatened" : p?.occupantRealmId === "player" ? "flying" : "struck";

  return (
    <div className={`sc-camp-card is-living is-${node} is-${mood}`}>
      <CampLivingUnderlay mood={mood} node={node} />
      <dl className={`sc-camp-rows is-${node}`} aria-label="Camp status">
        {rows.map((r) => (
          <div key={r.kind} className={`sc-camp-row is-${r.kind} tone-${r.tone}`}>
            <dt className="sc-camp-label">
              <span className="sc-camp-pip" aria-hidden="true" />
              {r.label}
            </dt>
            <dd className="sc-camp-value">
              <span className="sc-camp-main">{r.value}</span>
              {r.sub ? <span className="sc-camp-sub">{r.sub}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
      <CampLivingGlyph state={state} provinceId={provinceId} nameOf={nameOf} />
    </div>
  );
}

export const CampLivingCard = CampLivingRows;
