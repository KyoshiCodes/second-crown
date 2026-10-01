import React from "react";
import {
  canAfford,
  countBuilding,
  edgeWallCount,
  gateHp,
  gateOnRim,
  getBuildingType,
  hasClosedWallRing,
  housingCap,
  isHoldRim,
  keepBonus,
  keepLevel,
  listBuildableTypes,
  population,
  settlementName,
  staffBonus,
  upgradeJobFor,
  wallHp,
  workPlotCap,
  workPlotsUsed,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { quarryHintPlot } from "./buildHints";
import { HallChip } from "./hud/HallChip";
import { RoomBackdrop } from "./RoomBackdrop";
import "./keep-interior.css";
import "./hud/button-pips.css";

/** Hold grid size. Mirrors HOLD_W / HOLD_H in packages/sim/src/actions/build.ts. */
const HOLD_W = 16;
const HOLD_H = 10;

type Building = GameState["buildings"][number];

type Room = "hall" | "wall" | "yard";
const ROOMS: { id: Room; label: string }[] = [
  { id: "hall", label: "Hall" },
  { id: "wall", label: "Wall" },
  { id: "yard", label: "Yard" },
];

/**
 * Inside the keep: the hold's plots drawn as a courtyard, from state.buildings only.
 * Every tap goes through onTap (the same handler the map canvas uses), so there are no new build rules here.
 * Rooms (Hall / Wall / Yard) are local view state only; switching never touches the sim.
 */
export function KeepInterior(props: {
  state: GameState | undefined;
  selectedBuild: string | null;
  setSelectedBuild: (id: string) => void;
  onTap: (x: number, y: number) => void;
  onClose: () => void;
}) {
  const { state, selectedBuild, setSelectedBuild, onTap, onClose } = props;
  const [room, setRoom] = React.useState<Room>("hall");

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!state) return null;

  const byPlot = new Map<string, Building>();
  for (const b of state.buildings) byPlot.set(`${b.x},${b.y}`, b);
  const types = listBuildableTypes();
  const picked = selectedBuild ? getBuildingType(selectedBuild) : undefined;
  const tick = state.meta.tick;
  const hintPlot = quarryHintPlot(state);

  const cells: React.ReactNode[] = [];
  for (let y = 0; y < HOLD_H; y++) {
    for (let x = 0; x < HOLD_W; x++) {
      const b = byPlot.get(`${x},${y}`);
      cells.push(
        <PlotCell
          key={`${x},${y}`}
          state={state}
          x={x}
          y={y}
          b={b}
          tick={tick}
          pickedName={picked?.name}
          hinted={hintPlot?.x === x && hintPlot?.y === y}
          onTap={onTap}
        />
      );
    }
  }

  return (
    <div className="sc-keepin-backdrop" onClick={onClose}>
      <div
        className="sc-keepin"
        role="dialog"
        aria-label="Keep interior"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sc-keepin-head">
          <div>
            <div className="sc-keepin-title">{settlementName(state)} · Keep</div>
            <div className="sc-keepin-sub">
              {keepLevel(state) ? `Keep ${keepLevel(state)}` : "No Keep"} · People {population(state)}/{housingCap(state)} ·
              Plots {workPlotsUsed(state)}/{workPlotCap(state)}
            </div>
          </div>
          <button type="button" className="sc-keepin-close" onClick={onClose}>
            Leave the keep
          </button>
        </div>

        <div className="sc-keepin-rooms" role="tablist" aria-label="Keep rooms">
          {ROOMS.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={room === r.id}
              className={`sc-keepin-room${room === r.id ? " is-on" : ""}`}
              onClick={() => setRoom(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>

        {room === "hall" ? (
          <div role="tabpanel" aria-label="Hall" className="sc-keepin-room-panel is-hall">
            <RoomBackdrop room="hall" />
            <div className="sc-keepin-yard-wrap">
              <div className="sc-keepin-yard" style={{ gridTemplateColumns: `repeat(${HOLD_W}, 1fr)` }}>
                {cells}
              </div>
            </div>

            <div className="sc-keepin-legend">
              <span className="sc-keepin-key is-rim">Rim · walls &amp; gate</span>
              <span className="sc-keepin-key is-yard">Keep yard bonus</span>
              <span className="sc-keepin-key is-raising">Raising</span>
              <span className="sc-keepin-key is-improving">Improving</span>
              {hintPlot ? <span className="sc-keepin-key is-hint">Quarry here</span> : null}
            </div>
            <p className="sc-keepin-hint">
              Tap an empty plot to raise {picked ? <strong>{picked.name}</strong> : "the chosen work"}. Tap a work to improve it.
              Tap scaffolding to strike it. Same as tapping the map.
            </p>

            <div className="sc-keepin-palette">
              {types.map((t) => {
                const n = countBuilding(state, t.id);
                const on = selectedBuild === t.id;
                const cls = ["sc-keepin-pick", on ? "is-on" : "", canAfford(state, t.id) ? "is-afford" : ""].join(" ");
                return (
                  <button key={t.id} type="button" className={`${cls} sc-btn-with-pip`} title={t.blurb} onClick={() => setSelectedBuild(t.id)}>
                    <HallChip typeId={t.id} size={16} as="span" />
                    <span>
                      {t.name}
                      {n ? ` x${n}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        {room === "wall" ? <WallRoom state={state} /> : null}
        {room === "yard" ? <YardRoom state={state} /> : null}
      </div>
    </div>
  );
}

/** Wall HP, ring and gate, read from the same sim helpers the War room uses. */
function WallRoom(props: { state: GameState }) {
  const { state } = props;
  const mine = state.buildings.filter((b) => b.realmId === "player" && (b.typeId === "walls" || b.typeId === "gate"));
  const gateUp = gateOnRim(state);
  const edge = edgeWallCount(state, "player");
  return (
    <div role="tabpanel" aria-label="Wall" className="sc-keepin-room-body is-wall">
      <RoomBackdrop room="wall" />
      <dl className="sc-keepin-facts">
        <div>
          <dt>Wall HP</dt>
          <dd>{wallHp(state)}</dd>
        </div>
        <div>
          <dt>Rim walls</dt>
          <dd>
            {edge} on the rim · {countBuilding(state, "walls")} total
          </dd>
        </div>
        <div>
          <dt>Ring</dt>
          <dd>{hasClosedWallRing(state) ? "Closed" : "Open"}</dd>
        </div>
        <div>
          <dt>Gate</dt>
          <dd>{gateUp ? `Up · ${gateHp(state)} HP` : "Down"}</dd>
        </div>
      </dl>
      <p className="sc-keepin-hint">Siege hits walls first, then the yard, then the keep.</p>
      <WorkList state={state} works={mine} empty="No walls or gate raised." />
    </div>
  );
}

/** Finished works on a keep edge (keepBonus lifts them), same rule as the inspect card's keep yard line. */
function YardRoom(props: { state: GameState }) {
  const { state } = props;
  const yard = state.buildings.filter(
    (b) => b.realmId === "player" && b.completesAtTick === null && keepBonus(state, b) > 1
  );
  return (
    <div role="tabpanel" aria-label="Yard" className="sc-keepin-room-body is-yard">
      <RoomBackdrop room="yard" />
      <p className="sc-keepin-hint">Works touching the keep ({yard.length}).</p>
      <WorkList state={state} works={yard} empty="No works on the keep edge." />
    </div>
  );
}

function WorkList(props: { state: GameState; works: Building[]; empty: string }) {
  const { state, works, empty } = props;
  if (works.length === 0) return <p className="sc-keepin-empty">{empty}</p>;
  const tick = state.meta.tick;
  return (
    <ul className="sc-keepin-list">
      {works.map((b) => {
        const nm = getBuildingType(b.typeId)?.name ?? b.typeId;
        const done = b.completesAtTick;
        const raising = done !== null;
        const secs = raising ? Math.max(0, Math.ceil((done - tick) / TICKS_PER_SECOND)) : 0;
        return (
          <li key={b.id} className={raising ? "is-raising" : ""}>
            <HallChip typeId={b.typeId} staffed={!raising && staffBonus(state, b) > 1} size={20} />
            <span className="sc-keepin-list-name">{nm}</span>
            <span className="sc-keepin-list-meta">
              {raising ? `raising, ${secs}s left` : `lv ${b.level}`} · plot {b.x},{b.y}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function PlotCell(props: {
  state: GameState;
  x: number;
  y: number;
  b: Building | undefined;
  tick: number;
  pickedName: string | undefined;
  hinted: boolean;
  onTap: (x: number, y: number) => void;
}) {
  const { state, x, y, b, tick, pickedName, hinted, onTap } = props;
  const rim = isHoldRim(x, y);
  const cls = ["sc-keepin-plot", rim ? "is-rim" : ""];
  let label = "";
  let tip: string;

  if (!b) {
    cls.push("is-empty");
    tip = pickedName ? `Plot ${x},${y} · raise ${pickedName}` : `Plot ${x},${y} · empty`;
    if (hinted) {
      cls.push("is-hint");
      tip += " · a Quarry here would give stone for Walls";
    }
  } else {
    const nm = getBuildingType(b.typeId)?.name ?? b.typeId;
    const mine = b.realmId === "player";
    label = nm;
    if (!mine) cls.push("is-foreign");
    if (b.completesAtTick !== null) {
      const secs = Math.max(0, Math.ceil((b.completesAtTick - tick) / TICKS_PER_SECOND));
      cls.push("is-raising");
      tip = `${nm} · raising, ${secs}s left · tap to strike the scaffolding`;
    } else {
      const job = upgradeJobFor(state, b.id);
      if (job) {
        const secs = Math.max(0, Math.ceil((job.doneTick - tick) / TICKS_PER_SECOND));
        cls.push("is-improving");
        tip = `${nm} lv ${b.level} → ${b.level + 1}, ${secs}s left · tap to stop`;
      } else {
        if (mine && keepBonus(state, b) > 1) cls.push("is-yard");
        tip = `${nm} lv ${b.level} · tap to improve`;
      }
    }
    if (b.typeId === "keep") cls.push("is-keep");
  }

  return (
    <button type="button" className={cls.join(" ")} title={tip} aria-label={tip} onClick={() => onTap(x, y)}>
      {b ? (
        <>
          <HallChip typeId={b.typeId} staffed={b.completesAtTick === null && staffBonus(state, b) > 1} size={22} />
          <span className="sc-keepin-name">{label}</span>
          <span className="sc-keepin-lv">{b.level}</span>
        </>
      ) : null}
    </button>
  );
}
