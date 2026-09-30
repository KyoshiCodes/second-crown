import React from "react";
import {
  canAfford,
  countBuilding,
  getBuildingType,
  housingCap,
  isHoldRim,
  keepBonus,
  keepLevel,
  listBuildableTypes,
  population,
  settlementName,
  staffBonus,
  upgradeJobFor,
  workPlotCap,
  workPlotsUsed,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { HallChip } from "./hud/HallChip";
import "./keep-interior.css";

/** Hold grid size. Mirrors HOLD_W / HOLD_H in packages/sim/src/actions/build.ts. */
const HOLD_W = 16;
const HOLD_H = 10;

type Building = GameState["buildings"][number];

/**
 * Inside the keep: the hold's plots drawn as a courtyard, from state.buildings only.
 * Every tap goes through onTap (the same handler the map canvas uses), so there are no new build rules here.
 */
export function KeepInterior(props: {
  state: GameState | undefined;
  selectedBuild: string | null;
  setSelectedBuild: (id: string) => void;
  onTap: (x: number, y: number) => void;
  onClose: () => void;
}) {
  const { state, selectedBuild, setSelectedBuild, onTap, onClose } = props;

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
            <div className="sc-keepin-title">{settlementName(state)} · Keep yard</div>
            <div className="sc-keepin-sub">
              {keepLevel(state) ? `Keep ${keepLevel(state)}` : "No Keep"} · People {population(state)}/{housingCap(state)} ·
              Plots {workPlotsUsed(state)}/{workPlotCap(state)}
            </div>
          </div>
          <button type="button" className="sc-keepin-close" onClick={onClose}>
            Leave the keep
          </button>
        </div>

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
              <button key={t.id} type="button" className={cls} title={t.blurb} onClick={() => setSelectedBuild(t.id)}>
                {t.name}
                {n ? ` x${n}` : ""}
              </button>
            );
          })}
        </div>
      </div>
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
  onTap: (x: number, y: number) => void;
}) {
  const { state, x, y, b, tick, pickedName, onTap } = props;
  const rim = isHoldRim(x, y);
  const cls = ["sc-keepin-plot", rim ? "is-rim" : ""];
  let label = "";
  let tip: string;

  if (!b) {
    cls.push("is-empty");
    tip = pickedName ? `Plot ${x},${y} · raise ${pickedName}` : `Plot ${x},${y} · empty`;
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
