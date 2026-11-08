import React from "react";
import {
  GATHER_NODES,
  NODE_REGEN_PERIOD,
  getProvince,
  isProvinceSeen,
  nodeStock,
  nodeStockMax,
  storedNodeStock,
  type GameState,
} from "@second-crown/sim";
import { stockBadge } from "./stockBadge";
import "./node-living.css";

/**
 * Living node card in ProvinceInspect: stacked name / stock / pile rows for a seen gather node.
 * Display only. Every value comes from the sim's existing readers (`nodeStock`, `nodeStockMax`,
 * `storedNodeStock`, `GATHER_NODES`, `NODE_REGEN_PERIOD`) and the existing `stockBadge` text.
 * No new game math: the only work here is choosing words and tones for existing numbers.
 */

export type NodeRowKind = "name" | "stock" | "pile";
export type NodeRowTone = "safe" | "warn" | "danger" | "calm";

export interface NodeRow {
  kind: NodeRowKind;
  label: string;
  value: string;
  sub?: string;
  tone: NodeRowTone;
}

type GatherNode = keyof typeof GATHER_NODES;

const NODE_NAME: Record<GatherNode, string> = {
  woodcut: "Timber stand",
  quarry: "Stone outcrop",
  field: "Forage field",
};

const RESOURCE_NAME: Record<string, string> = {
  wood: "Wood",
  food: "Food",
  stone: "Stone",
};

function gatherNodeOf(state: GameState, provinceId: string): GatherNode | null {
  const p = getProvince(state, provinceId);
  if (!p || !isProvinceSeen(state, provinceId)) return null;
  return p.node in GATHER_NODES ? (p.node as GatherNode) : null;
}

/** Builds the three rows for a seen gather node, or null when the tile is not one. */
export function nodeRows(state: GameState, provinceId: string): NodeRow[] | null {
  const node = gatherNodeOf(state, provinceId);
  if (!node) return null;
  const have = nodeStock(state, provinceId);
  const max = nodeStockMax(node);
  const stored = storedNodeStock(state, provinceId);
  const res = RESOURCE_NAME[GATHER_NODES[node].resource] ?? GATHER_NODES[node].resource;
  const badge = stockBadge(have, max);

  const name: NodeRow = { kind: "name", label: "Name", value: NODE_NAME[node], sub: res, tone: "calm" };

  const refill = `refills +1 / ${NODE_REGEN_PERIOD / 10}s`;
  const stock: NodeRow =
    have <= 0
      ? { kind: "stock", label: "Stock", value: `${have}/${max}`, sub: `dry · ${refill}`, tone: "danger" }
      : have < max
        ? { kind: "stock", label: "Stock", value: `${have}/${max}`, sub: refill, tone: "warn" }
        : { kind: "stock", label: "Stock", value: `${have}/${max}`, sub: "full", tone: "safe" };

  // Pile: the stored flag is what the board pile reads; untouched tiles have never been drained.
  const pile: NodeRow =
    stored === null
      ? { kind: "pile", label: "Pile", value: "Untouched", sub: badge ? `badge ${badge}` : undefined, tone: "safe" }
      : {
          kind: "pile",
          label: "Pile",
          value: `${stored} ${res.toLowerCase()} left`,
          sub: badge ? `badge ${badge}` : undefined,
          tone: stored <= 0 ? "danger" : stored < max ? "warn" : "safe",
        };

  return [name, stock, pile];
}

export function NodeLivingCard(props: { state: GameState; provinceId: string }) {
  const node = gatherNodeOf(props.state, props.provinceId);
  const rows = nodeRows(props.state, props.provinceId);
  if (!node || !rows) return null;
  const have = nodeStock(props.state, props.provinceId);
  const max = nodeStockMax(node);
  const fill = max > 0 ? Math.max(0, Math.min(100, Math.round((have / max) * 100))) : 0;
  const state = have <= 0 ? "is-dry" : have < max ? "is-draining" : "is-full";
  return (
    <section className={`sc-node-card is-living is-${node} ${state}`} aria-label={`${NODE_NAME[node]} stock`}>
      <dl className="sc-node-card-rows">
        {rows.map((r) => (
          <div key={r.kind} className={`sc-node-card-row is-${r.kind} tone-${r.tone}`}>
            <dt className="sc-node-card-label">
              <span className="sc-node-card-pip" aria-hidden="true" />
              {r.label}
            </dt>
            <dd className="sc-node-card-value">
              <span className="sc-node-card-main">{r.value}</span>
              {r.sub ? <span className="sc-node-card-sub">{r.sub}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
      <div className="sc-node-card-meter" aria-hidden="true">
        <span className="sc-node-card-meter-fill" style={{ width: `${fill}%` }} />
      </div>
    </section>
  );
}
