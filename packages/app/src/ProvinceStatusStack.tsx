import React from "react";
import {
  GATHER_NODES,
  garrisonAt,
  garrisonPower,
  getProvince,
  isProvinceSeen,
  nodeStock,
  nodeStockMax,
  type GameState,
} from "@second-crown/sim";
import "./province-status-stack.css";

/**
 * Stacked living status rows at the top of ProvinceInspect: terrain, owner, stock, outpost, garrison.
 * Display only. Every value is read from existing state fields or sim readers. No new game math.
 */

export type ProvinceStatusKind = "terrain" | "owner" | "stock" | "outpost" | "garrison";

export type ProvinceStatusTone = "you" | "rival" | "warn" | "calm" | "fog" | "none";

export type ProvinceStatusRow = {
  kind: ProvinceStatusKind;
  label: string;
  value: string;
  tone: ProvinceStatusTone;
  /** 0..1 fill for a small bar. Only the stock row carries one. */
  bar?: number;
  /** Terrain key for the terrain row's swatch colour. */
  terrain?: string;
};

const TERRAIN: Record<string, string> = {
  plain: "Plain",
  wood: "Wood",
  hill: "Hill",
  waste: "Waste",
  shore: "Shore",
  peak: "Peak",
};

const RESOURCE: Record<string, string> = {
  wood: "wood",
  food: "food",
  stone: "stone",
};

function realmName(state: GameState, id: string): string {
  return state.realms.find((r) => r.id === id)?.name ?? id;
}

/** Builds the five rows for a province. Returns [] when the id is unknown. */
export function provinceStatusRows(state: GameState, provinceId: string): ProvinceStatusRow[] {
  const p = getProvince(state, provinceId);
  if (!p) return [];
  const home = provinceId === state.board.homeProvinceId;
  const seen = home || isProvinceSeen(state, provinceId);
  const occ = p.occupantRealmId;
  const rows: ProvinceStatusRow[] = [];

  // Terrain: the tile's terrain key, hidden by fog.
  rows.push(
    seen
      ? { kind: "terrain", label: "Terrain", value: TERRAIN[p.terrain] ?? p.terrain, tone: "calm", terrain: p.terrain }
      : { kind: "terrain", label: "Terrain", value: "Unknown", tone: "fog" }
  );

  // Owner: home id + occupantRealmId, same reading as the Owner fact below.
  if (home || (seen && occ === "player")) rows.push({ kind: "owner", label: "Owner", value: "You", tone: "you" });
  else if (!seen) rows.push({ kind: "owner", label: "Owner", value: "Unknown", tone: "fog" });
  else if (occ) rows.push({ kind: "owner", label: "Owner", value: realmName(state, occ), tone: "rival" });
  else rows.push({ kind: "owner", label: "Owner", value: "Empty", tone: "calm" });

  // Stock: only seen gather tiles hold a stock.
  if (!seen) {
    rows.push({ kind: "stock", label: "Stock", value: "Unseen", tone: "fog" });
  } else if (p.node in GATHER_NODES) {
    const have = nodeStock(state, provinceId);
    const max = nodeStockMax(p.node);
    const res = GATHER_NODES[p.node as keyof typeof GATHER_NODES].resource;
    rows.push({
      kind: "stock",
      label: "Stock",
      value: `${have}/${max} ${RESOURCE[res] ?? res}${have <= 0 ? " · dry" : ""}`,
      tone: have <= 0 ? "warn" : "calm",
      bar: max > 0 ? Math.min(1, Math.max(0, have / max)) : 0,
    });
  } else {
    rows.push({ kind: "stock", label: "Stock", value: "None here", tone: "none" });
  }

  // Outpost: node + occupantRealmId, same reading as the site tag in the card head.
  if (home) rows.push({ kind: "outpost", label: "Outpost", value: "Your hold", tone: "you" });
  else if (!seen) rows.push({ kind: "outpost", label: "Outpost", value: "Unseen", tone: "fog" });
  else if (p.node === "camp") rows.push({ kind: "outpost", label: "Outpost", value: "Hostile camp", tone: "warn" });
  else if (p.node !== "hold" && occ === "player")
    rows.push({ kind: "outpost", label: "Outpost", value: "Your flag", tone: "you" });
  else if (p.node !== "hold" && occ)
    rows.push({ kind: "outpost", label: "Outpost", value: `${realmName(state, occ)} flag`, tone: "rival" });
  else if (p.node === "hold" && occ)
    rows.push({ kind: "outpost", label: "Outpost", value: `${realmName(state, occ)} hold`, tone: "rival" });
  else rows.push({ kind: "outpost", label: "Outpost", value: "None", tone: "none" });

  // Garrison: posted force on the tile. Fog hides it.
  if (!seen) {
    rows.push({ kind: "garrison", label: "Garrison", value: "Unseen", tone: "fog" });
  } else {
    const g = garrisonAt(state, provinceId);
    const men = g ? Object.values(g.force).reduce((a, n) => a + Number(n ?? 0), 0) : 0;
    rows.push(
      men > 0
        ? { kind: "garrison", label: "Garrison", value: `${men} men · power ${garrisonPower(state, provinceId)}`, tone: "you" }
        : { kind: "garrison", label: "Garrison", value: "None", tone: "none" }
    );
  }

  return rows;
}

export function ProvinceStatusStack(props: { state: GameState; provinceId: string }) {
  const rows = provinceStatusRows(props.state, props.provinceId);
  if (rows.length === 0) return null;
  return (
    <dl className="sc-provstat" aria-label="Province status">
      {rows.map((r) => (
        <div
          key={r.kind}
          className={`sc-provstat-row is-${r.kind} tone-${r.tone}`}
          data-terrain={r.terrain}
        >
          <dt className="sc-provstat-label">
            <span className="sc-provstat-pip" aria-hidden="true" />
            {r.label}
          </dt>
          <dd className="sc-provstat-value">
            {r.value}
            {r.bar !== undefined ? (
              <span className="sc-provstat-bar" aria-hidden="true">
                <span className="sc-provstat-bar-fill" style={{ width: `${Math.round(r.bar * 100)}%` }} />
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
