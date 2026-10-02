import React from "react";
import {
  canAfford,
  countBuilding,
  edgeWallCount,
  gateHp,
  gateOnRim,
  getBuildingType,
  hasClosedWallRing,
  healTicks,
  healTicksLeft,
  housingCap,
  infirmaryBeds,
  isHoldRim,
  keepBonus,
  keepLevel,
  listBuildableTypes,
  listHealing,
  population,
  settlementName,
  staffBonus,
  upgradeJobFor,
  wallHp,
  workPlotCap,
  workPlotsUsed,
  woundedCount,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { quarryHintPlot } from "./buildHints";
import { HallChip } from "./hud/HallChip";
import { RoomBackdrop } from "./RoomBackdrop";
import { BedPip } from "./hud/BedPip";
import { WallPip } from "./hud/WallPip";
import { AnvilPip } from "./hud/AnvilPip";
import { KeepRoomPip } from "./hud/KeepRoomPip";
import "./keep-interior.css";
import "./hud/button-pips.css";
import "./hud/keep-room.css";
import "./hud/keep-room-pips.css";

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
              {r.id === "hall" && <BedPip size={16} active={room === "hall"} />}
              {r.id === "wall" && <WallPip size={16} closed={hasClosedWallRing(state)} hp={wallHp(state)} />}
              {r.id === "yard" && <AnvilPip size={16} active={room === "yard"} />}
              <span>{r.label}</span>
            </button>
          ))}
        </div>

        {room === "hall" ? (
          <div role="tabpanel" aria-label="Hall" className="sc-keepin-room-panel is-hall">
            <RoomBackdrop room="hall" />
            <HallCards state={state} />
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

/** One fact as a work card: name, tag, status line, optional foot. Read-only, no sim calls. */
function FactCard(props: {
  name: string;
  tag?: string;
  status: string;
  foot?: string;
  tone: "good" | "warn" | "bad" | "idle";
  pip?: React.ReactNode;
}) {
  const { name, tag, status, foot, tone, pip } = props;
  return (
    <div className={`sc-work-card sc-keeproom-card is-${tone}`}>
      <div className="sc-work-head">
        <span className="sc-work-title-group" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {pip}
          <span className="sc-work-name">{name}</span>
        </span>
        {tag ? <span className="sc-work-level">{tag}</span> : null}
      </div>
      <div className="sc-work-status">{status}</div>
      {foot ? (
        <div className="sc-work-foot">
          <span className="sc-work-where">{foot}</span>
        </div>
      ) : null}
    </div>
  );
}

/** Keep level, people and plot slots: the same numbers as the keep header. */
function HallCards(props: { state: GameState }) {
  const { state } = props;
  const lv = keepLevel(state);
  const pop = population(state);
  const cap = housingCap(state);
  const used = workPlotsUsed(state);
  const plots = workPlotCap(state);
  return (
    <div className="sc-keeproom-grid">
      <FactCard
        name="Keep"
        tag={lv ? `lv ${lv}` : "none"}
        status={lv ? `Keep ${lv}` : "No Keep"}
        tone={lv ? "good" : "bad"}
        pip={<BedPip size={16} active={lv > 0} />}
      />
      <FactCard
        name="People"
        tag={`${pop}/${cap}`}
        status={pop >= cap ? "Housing full" : `Room for ${cap - pop} more`}
        tone={pop >= cap ? "warn" : "idle"}
        pip={<BedPip size={16} active={pop >= cap} full={pop >= cap} pop={pop} cap={cap} />}
      />
      <FactCard
        name="Plots"
        tag={`${used}/${plots}`}
        status={used >= plots ? "All slots used" : `${plots - used} slots free`}
        tone={used >= plots ? "warn" : "idle"}
        pip={<BedPip size={16} active={used > 0} />}
      />
    </div>
  );
}

/** Wall HP, ring and gate, read from the same sim helpers the War room uses. */
function WallRoom(props: { state: GameState }) {
  const { state } = props;
  const mine = state.buildings.filter((b) => b.realmId === "player" && (b.typeId === "walls" || b.typeId === "gate"));
  const gateUp = gateOnRim(state);
  const edge = edgeWallCount(state, "player");
  const ring = hasClosedWallRing(state);
  return (
    <div role="tabpanel" aria-label="Wall" className="sc-keepin-room-body is-wall">
      <RoomBackdrop room="wall" />
      <div className="sc-keeproom-grid">
        <FactCard
          name="Walls"
          tag={`${wallHp(state)} HP`}
          status={`${edge} on the rim · ${countBuilding(state, "walls")} total`}
          tone={edge > 0 ? "good" : "idle"}
          pip={<WallPip size={16} rim={edge} closed={ring} hp={wallHp(state)} />}
        />
        <FactCard
          name="Ring"
          tag={ring ? "closed" : "open"}
          status={ring ? "Closed" : "Open"}
          tone={ring ? "good" : "warn"}
          pip={<WallPip size={16} closed={ring} rim={edge} />}
        />
        <FactCard
          name="Gate"
          tag={gateUp ? `${gateHp(state)} HP` : "down"}
          status={gateUp ? `Up · ${gateHp(state)} HP` : "Down"}
          tone={gateUp ? "good" : "bad"}
          pip={<WallPip size={16} gate={gateUp} closed={ring} />}
        />
      </div>
      <p className="sc-keepin-hint">Siege hits walls first, then the yard, then the keep.</p>
      <WorkList state={state} works={mine} empty="No walls or gate raised." />
    </div>
  );
}

/** Beds and heal time (same reads as the Hall's Yard room), then finished works on a keep edge. */
function YardRoom(props: { state: GameState }) {
  const { state } = props;
  const yard = state.buildings.filter(
    (b) => b.realmId === "player" && b.completesAtTick === null && keepBonus(state, b) > 1
  );
  const wounded = woundedCount(state);
  const beds = infirmaryBeds(state);
  const healing = listHealing(state).length;
  const healLeft = Math.ceil(healTicksLeft(state) / TICKS_PER_SECOND);
  const healSec = healTicks(state) / TICKS_PER_SECOND;
  return (
    <div role="tabpanel" aria-label="Yard" className="sc-keepin-room-body is-yard">
      <RoomBackdrop room="yard" />
      <div className="sc-keeproom-grid">
        <FactCard
          name="Beds"
          tag={`${wounded}/${beds}`}
          status={beds < 1 ? "No Infirmary" : `Wounded ${wounded} / ${beds} beds`}
          foot={`4 food · ${healSec}s per treat`}
          tone={beds < 1 ? "idle" : wounded >= beds ? "warn" : "good"}
          pip={<BedPip size={16} active={wounded > 0} wounded={wounded > 0} />}
        />
        <FactCard
          name="Healing"
          tag={healing > 0 ? `${healLeft}s` : "idle"}
          status={healing > 0 ? `Treating ${healing} (${healLeft}s)` : "No one on a cot"}
          tone={healing > 0 ? "good" : "idle"}
          pip={<BedPip size={16} active={healing > 0} />}
        />
        <FactCard
          name="Keep edge"
          tag={`${yard.length}`}
          status={`Works touching the keep (${yard.length})`}
          tone={yard.length > 0 ? "good" : "idle"}
          pip={<AnvilPip size={16} active={yard.length > 0} count={yard.length} />}
        />
      </div>
      <WorkList state={state} works={yard} empty="No works on the keep edge." />
    </div>
  );
}

/** Works as read-only work cards: same head / status / foot as Kingdom works, no buttons. */
function WorkList(props: { state: GameState; works: Building[]; empty: string }) {
  const { state, works, empty } = props;
  if (works.length === 0) return <p className="sc-keepin-empty">{empty}</p>;
  const tick = state.meta.tick;
  return (
    <div className="sc-keeproom-grid">
      {works.map((b) => {
        const nm = getBuildingType(b.typeId)?.name ?? b.typeId;
        const done = b.completesAtTick;
        const raising = done !== null;
        const secs = raising ? Math.max(0, Math.ceil((done - tick) / TICKS_PER_SECOND)) : 0;
        const staffed = !raising && staffBonus(state, b) > 1;
        return (
          <div key={b.id} className={`sc-work-card sc-keeproom-card ${raising ? "is-raising" : staffed ? "is-staffed" : "is-empty"}`}>
            <div className="sc-work-head">
              <span className="sc-work-title-group">
                <HallChip typeId={b.typeId} staffed={staffed} size={20} />
                <span className="sc-work-name">{nm}</span>
              </span>
              <span className="sc-work-level">lv {b.level}</span>
            </div>
            <div className="sc-work-status">{raising ? `Raising, ${secs}s left` : staffed ? "Staffed" : "Empty"}</div>
            <div className="sc-work-foot">
              <span className="sc-work-where">plot {b.x},{b.y}</span>
            </div>
          </div>
        );
      })}
    </div>
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
