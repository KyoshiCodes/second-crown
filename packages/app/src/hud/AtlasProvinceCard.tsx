import React from "react";
import { getProvince, isProvinceSeen, type GameState } from "@second-crown/sim";
import "./atlas-living.css";

/**
 * Living province cards under the Overworld Atlas: stacked name / terrain / owner rows.
 * Display only. Every value is read from existing state fields (province node, terrain,
 * occupantRealmId, home id) and the sim's own fog reader. No new game math.
 */

export type AtlasRowKind = "name" | "terrain" | "owner";
export type AtlasRowTone = "you" | "rival" | "warn" | "calm" | "fog";

export interface AtlasProvinceRow {
  kind: AtlasRowKind;
  label: string;
  value: string;
  sub?: string;
  tone: AtlasRowTone;
  /** Terrain key for the swatch on the terrain row. */
  terrain?: string;
}

export type AtlasCardRole = "selected" | "hover" | "home";

const TERRAIN: Record<string, string> = {
  plain: "Plain",
  wood: "Wood",
  hill: "Hill",
  waste: "Waste",
  shore: "Shore",
  peak: "Peak",
};

/** Same node names the inspect card uses. */
const NODE: Record<string, string> = {
  none: "Open ground",
  hold: "Hold",
  camp: "Hostile camp",
  woodcut: "Timber stand",
  quarry: "Stone outcrop",
  field: "Forage field",
  ruins: "Ruins",
};

const ROLE_LABEL: Record<AtlasCardRole, string> = {
  selected: "Selected",
  hover: "Pointing at",
  home: "Home",
};

function realmName(state: GameState, id: string): string {
  return state.realms.find((r) => r.id === id)?.name ?? id;
}

/** Builds the three rows for one province. Returns [] when the id is unknown. */
export function atlasProvinceRows(state: GameState, provinceId: string): AtlasProvinceRow[] {
  const p = getProvince(state, provinceId);
  if (!p) return [];
  const home = provinceId === state.board.homeProvinceId;
  const seen = home || isProvinceSeen(state, provinceId);
  const occ = p.occupantRealmId;
  const coords = `${p.x},${p.y}`;

  // Name: node label + grid coords (the War Room labels provinces by coords too). Fog hides the node.
  const name: AtlasProvinceRow = home
    ? { kind: "name", label: "Name", value: "Your hold", sub: coords, tone: "you" }
    : seen
      ? { kind: "name", label: "Name", value: NODE[p.node] ?? p.node, sub: coords, tone: p.node === "camp" ? "warn" : "calm" }
      : { kind: "name", label: "Name", value: "Uncharted", sub: coords, tone: "fog" };

  const terrain: AtlasProvinceRow = seen
    ? { kind: "terrain", label: "Terrain", value: TERRAIN[p.terrain] ?? p.terrain, tone: "calm", terrain: p.terrain }
    : { kind: "terrain", label: "Terrain", value: "Unknown", tone: "fog" };

  // Owner: same reading as the inspect card's status stack.
  let owner: AtlasProvinceRow;
  if (home || (seen && occ === "player")) owner = { kind: "owner", label: "Owner", value: "You", tone: "you" };
  else if (!seen) owner = { kind: "owner", label: "Owner", value: "Unknown", tone: "fog" };
  else if (occ) owner = { kind: "owner", label: "Owner", value: realmName(state, occ), tone: "rival" };
  else owner = { kind: "owner", label: "Owner", value: "Empty", tone: "calm" };

  return [name, terrain, owner];
}

export function AtlasProvinceCard(props: { state: GameState; provinceId: string; role: AtlasCardRole }) {
  const rows = atlasProvinceRows(props.state, props.provinceId);
  if (rows.length === 0) return null;
  return (
    <section className={`sc-atlas-card is-${props.role}`} aria-label={`${ROLE_LABEL[props.role]} province`}>
      <header className="sc-atlas-card-role">{ROLE_LABEL[props.role]}</header>
      <dl className="sc-atlas-card-rows">
        {rows.map((r) => (
          <div key={r.kind} className={`sc-atlas-card-row is-${r.kind} tone-${r.tone}`} data-terrain={r.terrain}>
            <dt className="sc-atlas-card-label">
              <span className="sc-atlas-card-pip" aria-hidden="true" />
              {r.label}
            </dt>
            <dd className="sc-atlas-card-value">
              <span className="sc-atlas-card-main">{r.value}</span>
              {r.sub ? <span className="sc-atlas-card-sub">{r.sub}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * The card strip under the atlas: selected card, plus a hover card when pointing at another tile.
 * Falls back to a home card when nothing is selected or hovered.
 */
export function AtlasProvinceCards(props: {
  state: GameState;
  selectedId?: string | null;
  hoveredId?: string | null;
}) {
  const { state, selectedId, hoveredId } = props;
  const cards: Array<{ id: string; role: AtlasCardRole }> = [];
  if (selectedId && getProvince(state, selectedId)) cards.push({ id: selectedId, role: "selected" });
  if (hoveredId && hoveredId !== selectedId && getProvince(state, hoveredId)) cards.push({ id: hoveredId, role: "hover" });
  if (cards.length === 0) cards.push({ id: state.board.homeProvinceId, role: "home" });
  return (
    <div className="sc-atlas-cards">
      {cards.map((c) => (
        <AtlasProvinceCard key={c.role} state={state} provinceId={c.id} role={c.role} />
      ))}
    </div>
  );
}
