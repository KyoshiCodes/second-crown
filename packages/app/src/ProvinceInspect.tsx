import React from "react";
import {
  GATHER_NODES,
  NODE_REGEN_PERIOD,
  activePlayerMarch,
  campThreat,
  currentSeason,
  edgeWallCount,
  gateHp,
  getBuildingType,
  gateOnRim,
  garrisonAt,
  garrisonPower,
  getProvince,
  hasClosedWallRing,
  incomingOnProvince,
  isProvinceSeen,
  keepBonus,
  listGathers,
  listMarches,
  listOutposts,
  listUnitTypes,
  maxMarches,
  nodeStock,
  nodeStockMax,
  outpostTithePerTick,
  scoutCost,
  settlementName,
  storedNodeStock,
  tryAbandonOutpost,
  tryDispatchGarrison,
  tryDispatchRecallGarrison,
  tryDispatchScout,
  tryGather,
  tryMarchWith,
  tryRecallGather,
  tryRecallMarch,
  wallHp,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import type { ActFn } from "./game/useGameEngine";
import "./hud/inspect-card.css";

const TERRAIN: Record<string, string> = {
  plain: "Plain",
  wood: "Wood",
  hill: "Hill",
  waste: "Waste",
  shore: "Shore",
  peak: "Peak",
};

const NODE: Record<string, string> = {
  none: "Open ground",
  hold: "Hold",
  camp: "Hostile camp",
  woodcut: "Timber stand",
  quarry: "Stone outcrop",
  field: "Forage field",
  ruins: "Ruins",
};

const RESOURCE: Record<string, string> = {
  wood: "Wood",
  food: "Food",
  stone: "Stone",
};

type Site = { kind: "outpost" | "rival" | "camp"; label: string } | null;

/** Outpost/camp status from existing state: node + occupantRealmId. No new sim fields. */
function siteOf(state: GameState, id: string, seen: boolean): Site {
  const p = getProvince(state, id);
  if (!p || !seen || id === state.board.homeProvinceId) return null;
  if (p.node === "camp") return { kind: "camp", label: "Camp" };
  if (p.node === "hold" || !p.occupantRealmId) return null;
  if (p.occupantRealmId === "player") return { kind: "outpost", label: "Your outpost" };
  const who = state.realms.find((r) => r.id === p.occupantRealmId)?.name ?? p.occupantRealmId;
  return { kind: "rival", label: `${who} outpost` };
}

/** Finished player works on a keep edge (keepBonus lifts them). Names as WorkCard shows them. */
function keepYardWorks(state: GameState): string[] {
  return state.buildings
    .filter((b) => b.realmId === "player" && b.completesAtTick === null && keepBonus(state, b) > 1)
    .map((b) => getBuildingType(b.typeId)?.name ?? b.typeId);
}

type MarchHere = { key: string; who: string; mine: boolean; what: string; secs: number };

/** Marches whose toId is this tile. Reads existing March fields only; fog hides rival columns. */
function marchesHere(state: GameState, id: string, seen: boolean): MarchHere[] {
  return listMarches(state)
    .filter((m) => m.toId === id && (seen || m.realmId === "player"))
    .map((m) => {
      const mine = m.realmId === "player";
      const who = mine ? "Your column" : state.realms.find((r) => r.id === m.realmId)?.name ?? m.realmId;
      const secs = Math.max(0, Math.ceil((m.arrivesTick - state.meta.tick) / TICKS_PER_SECOND));
      return { key: m.id, who, mine, what: m.purpose ?? m.kind, secs };
    });
}

function owned(state: GameState, typeId: string): number {
  const u = state.units.find((x) => x.realmId === "player" && x.typeId === typeId);
  return Number(u?.count ?? 0);
}

export function ProvinceInspect(props: {
  state: GameState | undefined;
  selectedId: string | null;
  onClear: () => void;
  act: ActFn;
}) {
  const { state, selectedId, onClear, act } = props;
  const [force, setForce] = React.useState<Record<string, number>>({ militia: 5 });
  if (!state || !selectedId) return null;
  const p = getProvince(state, selectedId);
  if (!p) return null;
  const roster = listUnitTypes();
  const home = selectedId === state.board.homeProvinceId;
  const march = activePlayerMarch(state);
  const gathers = listGathers(state);
  const here = gathers.find((g) => g.toId === selectedId && g.phase !== "returning");
  const seen = isProvinceSeen(state, selectedId);
  const cost = scoutCost(state);
  const gold = Number(state.resources.gold ?? 0);
  const canGather = seen && p.node in GATHER_NODES;
  const stock = canGather ? nodeStock(state, selectedId) : 0;
  const stockMax = canGather ? nodeStockMax(p.node) : 0;
  const stored = canGather ? storedNodeStock(state, selectedId) : null;
  const stockRes = canGather ? GATHER_NODES[p.node as keyof typeof GATHER_NODES].resource : "";
  const slotsUsed =
    listMarches(state).filter((m) => m.realmId === "player").length +
    gathers.filter((g) => g.phase !== "returning").length;
  const full = slotsUsed >= maxMarches(state);
  const flagged = listOutposts(state).some((o) => o.id === selectedId);
  const tithe = flagged ? outpostTithePerTick(state) : null;
  const posted = garrisonAt(state, selectedId);
  const incoming = incomingOnProvince(state, selectedId);
  const incomingName = incoming
    ? state.realms.find((r) => r.id === incoming.realmId)?.name ?? incoming.realmId
    : "";
  const occupant = seen
    ? p.occupantRealmId
      ? state.realms.find((r) => r.id === p.occupantRealmId)?.name ?? p.occupantRealmId
      : "None"
    : "Unknown (fog)";
  const canScout =
    !seen && gold >= cost && !full && (owned(state, "skirmisher") >= 1 || owned(state, "militia") >= 1);
  const name = home ? settlementName(state) : seen ? NODE[p.node] ?? p.node : "Unscouted province";
  const site = siteOf(state, selectedId, seen);
  const yard = home ? keepYardWorks(state) : [];
  const onTile = marchesHere(state, selectedId, seen);
  const terrain = seen ? TERRAIN[p.terrain] ?? p.terrain : "Unknown";
  const season = currentSeason(state);
  return (
    <div className={`sc-inspect-card${home ? " is-home" : ""}${flagged ? " is-flagged" : ""}${seen ? "" : " is-fog"}`}>
      <div className="sc-inspect-head">
        <div className="sc-inspect-name">{name}</div>
        {site ? <span className={`sc-inspect-site is-${site.kind}`}>{site.label}</span> : null}
        <button type="button" className="sc-inspect-close" onClick={onClear}>
          Close
        </button>
      </div>
      <dl className="sc-inspect-facts">
        <div>
          <dt>Terrain</dt>
          <dd>{terrain}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{occupant}</dd>
        </div>
        <div className={`sc-inspect-sight${seen ? " is-seen" : " is-unseen"}`}>
          <dt>Sight</dt>
          <dd>{seen ? "Seen" : "Unseen"}</dd>
        </div>
        <div>
          <dt>Tile</dt>
          <dd>
            {p.x},{p.y}
          </dd>
        </div>
        <div className={`sc-inspect-season is-${season.toLowerCase()}`}>
          <dt>Season</dt>
          <dd>{season}</dd>
        </div>
        <div>
          <dt>Gold</dt>
          <dd>{gold}</dd>
        </div>
        {home ? (
          <>
            <div className="sc-inspect-wall">
              <dt>Wall HP</dt>
              <dd>{wallHp(state)}</dd>
            </div>
            <div className={`sc-inspect-wall${gateOnRim(state) ? "" : " is-none"}`}>
              <dt>Gate HP</dt>
              <dd>{gateOnRim(state) ? gateHp(state) : "No gate on rim"}</dd>
            </div>
            <div
              className={`sc-inspect-gate${
                !gateOnRim(state) ? " is-none" : hasClosedWallRing(state) ? " is-closed" : " is-open"
              }`}
            >
              <dt>Gate</dt>
              <dd>{!gateOnRim(state) ? "None" : hasClosedWallRing(state) ? "Closed · ring sealed" : "Open · rim has gaps"}</dd>
            </div>
            <div className={`sc-inspect-wall${hasClosedWallRing(state) ? " is-closed" : " is-open"}`}>
              <dt>Rim ring</dt>
              <dd>
                {edgeWallCount(state, "player")}/8 · {hasClosedWallRing(state) ? "closed" : "open"}
              </dd>
            </div>
            <div className={`sc-inspect-yard${yard.length > 0 ? "" : " is-none"}`}>
              <dt>Keep yard ({yard.length})</dt>
              <dd>{yard.length > 0 ? yard.join(" · ") : "No works on the keep edge"}</dd>
            </div>
          </>
        ) : null}
        {stored !== null ? (
          <div>
            <dt>{RESOURCE[stockRes] ?? stockRes} left</dt>
            <dd>{stored}</dd>
          </div>
        ) : null}
      </dl>
      {!seen ? <div className="sc-inspect-line">Fog hides the token.</div> : null}
      {canGather ? (
        <div className="sc-inspect-line">
          {NODE[p.node] ?? p.node} {stock}/{stockMax}
          {stock < stockMax ? ` · refills +1 / ${NODE_REGEN_PERIOD / 10}s` : ""}
          {stock <= 0 ? " · dry" : ""}
        </div>
      ) : null}
      {seen && p.node === "camp" ? <div className="sc-inspect-line">Camp threat {campThreat(state, p)}</div> : null}
      {flagged ? (
        <div className="sc-inspect-line is-good">
          Your flag. Tithe / tick — food {tithe?.food ?? 0} wood {tithe?.wood ?? 0} stone {tithe?.stone ?? 0} gold{" "}
          {tithe?.gold ?? 0}
          {posted ? ` · Garrison power ${garrisonPower(state, selectedId)}` : " · No garrison"}
        </div>
      ) : null}
      {incoming ? (
        <div className="sc-inspect-line is-bad">
          Incoming contest · {incomingName} · {Math.max(0, incoming.arrivesTick - state.meta.tick)} ticks
        </div>
      ) : null}
      {onTile.length > 0 ? (
        <ul className="sc-inspect-marches">
          {onTile.map((m) => (
            <li key={m.key} className={`sc-inspect-march${m.mine ? " is-mine" : " is-rival"}`}>
              <span className="sc-inspect-march-who">{m.who}</span>
              <span className="sc-inspect-march-what">{m.what}</span>
              <span className="sc-inspect-march-eta">{m.secs > 0 ? `${m.secs}s left` : "on tile"}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {march ? (
        <div className="sc-inspect-line is-warn">
          Column · {march.purpose ?? "raid"} · {Math.max(0, march.arrivesTick - state.meta.tick)} ticks left
          {march.arrivesTick > state.meta.tick ? (
            <button type="button" className="sc-inspect-inline-btn" onClick={() => act((s) => (tryRecallMarch(s) ? "Column recalled." : "Cannot recall."))}>
              Recall column
            </button>
          ) : null}
        </div>
      ) : null}
      {here ? (
        <div className="sc-inspect-line">
          Gathering {here.node} · load {here.load}/{here.capacity} · {here.phase}
          <button type="button" className="sc-inspect-inline-btn" onClick={() => act((s) => (tryRecallGather(s, here.id) ? "Column recalled." : "Cannot recall."))}>
            Recall gather
          </button>
        </div>
      ) : null}
      {home ? (
        <div className="sc-inspect-home">
          <div className="sc-inspect-hint">This is your hold. Zoom in to build.</div>
        </div>
      ) : (
        <>
          <div className="sc-inspect-actions">
            {!seen ? (
              <button
                type="button"
                disabled={!canScout}
                onClick={() =>
                  act((s) => {
                    const c = scoutCost(s);
                    if (tryDispatchScout(s, selectedId)) return `Scout column sent (${c} gold).`;
                    return `Need ${c} gold and one skirmisher or militia, plus a free column.`;
                  })
                }
              >
                Scout column ({cost} gold)
              </button>
            ) : null}
            {canGather ? (
              <button
                type="button"
                disabled={Boolean(here) || full || stock <= 0}
                onClick={() =>
                  act((s) => {
                    const pack: Record<string, number> = {};
                    for (const [k, v] of Object.entries(force)) if (v > 0) pack[k] = v;
                    if (Object.keys(pack).length === 0) pack.militia = 5;
                    return tryGather(s, selectedId, pack) ? "Gather column sent." : "Cannot gather.";
                  })
                }
              >
                {stock <= 0 ? "Tile is dry" : "Gather here"}
              </button>
            ) : null}
            {flagged ? (
              <>
                <button
                  type="button"
                  disabled={Boolean(march) || full}
                  onClick={() =>
                    act((s) => {
                      const pack: Record<string, number> = {};
                      for (const [k, v] of Object.entries(force)) if (v > 0) pack[k] = v;
                      if (Object.keys(pack).length === 0) pack.militia = 3;
                      return tryDispatchGarrison(s, selectedId, pack) ? "Garrison marching." : "Cannot send garrison.";
                    })
                  }
                >
                  Station garrison
                </button>
                {posted ? (
                  <button
                    type="button"
                    disabled={Boolean(march) || full}
                    onClick={() => act((s) => (tryDispatchRecallGarrison(s, selectedId) ? "Garrison marching home." : "No garrison."))}
                  >
                    Recall garrison
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => act((s) => (tryAbandonOutpost(s, selectedId) ? "Banner pulled. Garrison home." : "Cannot abandon."))}
                >
                  Abandon flag
                </button>
              </>
            ) : null}
          </div>
          <div className="sc-inspect-column">
            <div className="sc-inspect-column-label">Column</div>
            {roster.map((u) => {
              const have = owned(state, u.id);
              if (have <= 0 && !(force[u.id] > 0)) return null;
              return (
                <label key={u.id} className="sc-inspect-unit">
                  <span>
                    {u.name} (have {have})
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={have}
                    value={force[u.id] ?? 0}
                    onChange={(e) =>
                      setForce((f) => ({
                        ...f,
                        [u.id]: Math.max(0, Math.min(have, Number(e.target.value) || 0)),
                      }))
                    }
                  />
                </label>
              );
            })}
          </div>
          <button
            type="button"
            className="sc-inspect-raid"
            disabled={Boolean(march) || roster.every((u) => !(force[u.id] > 0))}
            onClick={() =>
              act((s) => {
                if (activePlayerMarch(s)) return "Company already on the board.";
                const ok = tryMarchWith(s, selectedId, force);
                if (!ok) return "Cannot raid.";
                return "Raid column ordered.";
              })
            }
          >
            Send raid column
          </button>
        </>
      )}
    </div>
  );
}
