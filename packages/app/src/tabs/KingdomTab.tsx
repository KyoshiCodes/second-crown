import React from "react";
import {
  buildTicksLeft,
  canAfford,
  canHouse,
  canRaiseWork,
  clearKeepNotice,
  computeIncomePerSecond,
  countBuilding,
  currentKeepGate,
  currentSeason,
  emptyStaffWorks,
  formatLetterSuffix,
  fullStores,
  garrisonAt,
  garrisonPower,
  getBuildingType,
  getProvince,
  housingCap,
  incomingOnHome,
  incomingOnPlayerFlags,
  incomingOnProvince,
  KEEP_GATES,
  keepLevel,
  keepNotice,
  laborPerTick,
  listBuildableTypes,
  listOutposts,
  listScarred,
  isScarred,
  listUpgrades,
  listWorksInProgress,
  MARKET_OFFERS,
  outpostTithePerTick,
  PAIR_LABEL,
  population,
  resourceLedger,
  settlementName,
  tryAbandonOutpost,
  tryAssignCitizen,
  tryCancelBuild,
  tryCancelUpgrade,
  unpairedWorks,
  watchtowerWarning,
  workPlotCap,
  workPlotsUsed,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "../game/useGameEngine";
import { PeoplePanel } from "../PeoplePanel";
import { KeepGateCard } from "../KeepGateCard";
import { StudyLine } from "../StudyLine";
import { quarryHintPlot, staffQuarryHint, staffTowerHint, wallsReadyHint, wallsStoneHint } from "../buildHints";
import { WallLine } from "../WallLine";
import { VisionLine } from "../VisionLine";
import { WorkCard } from "../hud/WorkCard";
import { OfferCard } from "../hud/OfferCard";
import "../hud/map-strip.css";
import "../hud/plain-buttons.css";

export function KingdomTab(props: {
  state: GameState | undefined;
  act: ActFn;
  selectedBuild: string | null;
  setSelectedBuild: (id: string) => void;
}) {
  const { state, act, selectedBuild, setSelectedBuild } = props;
  const types = listBuildableTypes();
  const marketsN = state ? countBuilding(state, "market") : 0;
  const selected = selectedBuild ? getBuildingType(selectedBuild) : undefined;
  const hold = state ? settlementName(state) : "Your Hold";
  const season = state ? currentSeason(state) : "Spring";
  const scarred = state ? listScarred(state) : [];
  const works = state ? listWorksInProgress(state).filter((b) => !isScarred(state, b)) : [];
  const upgrades = state ? listUpgrades(state) : [];
  const flags = state ? listOutposts(state) : [];
  const standing =
    state?.buildings.filter((b) => b.realmId === "player" && b.completesAtTick === null && b.typeId !== "keep") ?? [];
  const pop = state ? population(state) : 0;
  const beds = state ? housingCap(state) : 2;
  const plots = state ? workPlotsUsed(state) : 0;
  const plotCap = state ? workPlotCap(state) : 2;
  const incoming = state ? incomingOnHome(state) : [];
  const onFlags = state ? incomingOnPlayerFlags(state) : [];
  const seen = state ? watchtowerWarning(state) : undefined;
  const tick = state?.meta.tick ?? 0;
  const keepLv = state ? keepLevel(state) : 0;
  const gateRow = state ? currentKeepGate(state) : KEEP_GATES[0];
  const notice = state ? keepNotice(state) : "";
  const income = state ? computeIncomePerSecond(state) : {};
  const tithe = state ? outpostTithePerTick(state) : { food: 0, wood: 0, stone: 0, gold: 0 };
  const labor = state ? laborPerTick(state) : { food: 0, wood: 0, stone: 0, gold: 0 };
  const wallsHint = wallsStoneHint(state);
  const wallsReady = wallsReadyHint(state);
  const hintPlot = quarryHintPlot(state);
  const quarryStaff = staffQuarryHint(state);
  const towerStaff = staffTowerHint(state);
  const misses = state ? unpairedWorks(state) : [];
  const packed = state ? fullStores(state) : [];
  const idle = state ? emptyStaffWorks(state) : [];
  const room = state ? canHouse(state) : true;
  const plotRoom = state ? canRaiseWork(state) : true;
  const ledgers = state
    ? {
        food: resourceLedger(state, "food"),
        wood: resourceLedger(state, "wood"),
        stone: resourceLedger(state, "stone"),
        gold: resourceLedger(state, "gold"),
      }
    : null;
  const nameOf = (id: string) =>
    seen || (state && countBuilding(state, "watchtower") > 0)
      ? state?.realms.find((r) => r.id === id)?.name ?? id
      : "Unknown host";

  return (
    <>
      {notice ? (
        <div className="sc-work-card sc-plain-card sc-plain-inline is-notice">
          <span className="sc-work-status">{notice}</span>
          <button type="button" className="sc-work-btn" onClick={() => act((st) => { clearKeepNotice(st); return "Noted."; })}>
            Dismiss
          </button>
        </div>
      ) : null}
      <div className="sc-work-card sc-map-strip">
        <div className="sc-map-strip-row">
          <div className="sc-map-strip-cell is-hold">
            <span className="sc-work-name">{hold}</span>
            <span>{season}. People {pop}/{beds}. Work plots {plots}/{plotCap} (cottages buy more).</span>
          </div>
          <div className="sc-map-strip-cell">
            <WallLine state={state} />
          </div>
          <div className="sc-map-strip-cell">
            <VisionLine state={state} />
          </div>
        </div>
        <div className="sc-map-strip-hints">
          {wallsReady ? <p style={{ fontSize: 12, color: "#3fb950" }}>{wallsReady}</p> : null}
          {wallsHint ? (
            <p style={{ fontSize: 12, color: "#d29922" }}>
              {wallsHint}
              {hintPlot ? ` Plot ${hintPlot.x},${hintPlot.y} is free and marked in the Keep.` : ""}
            </p>
          ) : null}
          {quarryStaff ? (
            <p style={{ fontSize: 12, color: "#d29922", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span>
                Staff the {quarryStaff.name} at {quarryStaff.x},{quarryStaff.y} — no miner yet.
                {quarryStaff.idleId ? "" : " No idle hands; move someone with Post at… on People."}
              </span>
              {quarryStaff.idleId ? (
                <button
                  type="button"
                  onClick={() => {
                    const cid = quarryStaff.idleId;
                    const bid = quarryStaff.buildingId;
                    if (cid) act((st) => (tryAssignCitizen(st, cid, bid) ? "Worker posted." : "Cannot post there."));
                  }}
                >
                  Post an idle worker
                </button>
              ) : null}
            </p>
          ) : null}
          {towerStaff ? (
            <p style={{ fontSize: 12, color: "#d29922", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span>
                Staff the {towerStaff.name} at {towerStaff.x},{towerStaff.y} for gold — no guard yet.
                {towerStaff.idleId ? "" : " No idle hands; move someone with Post at… on People."}
              </span>
              {towerStaff.idleId ? (
                <button
                  type="button"
                  onClick={() => {
                    const cid = towerStaff.idleId;
                    const bid = towerStaff.buildingId;
                    if (cid) act((st) => (tryAssignCitizen(st, cid, bid) ? "Guard posted." : "Cannot post there."));
                  }}
                >
                  Post an idle guard
                </button>
              ) : null}
            </p>
          ) : null}
          {!room ? (
            <p style={{ fontSize: 12, color: "#d29922", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span>People {pop}/{beds}. Raise a Cottage for beds.</span>
              <button type="button" onClick={() => setSelectedBuild("cottage")}>
                {selectedBuild === "cottage" ? "Cottage picked — tap a plot" : "Pick Cottage"}
              </button>
            </p>
          ) : null}
          {!plotRoom ? (
            <p style={{ fontSize: 12, color: "#d29922" }}>Work plots full. Raise a Cottage before you place another farm or camp.</p>
          ) : null}
        </div>
      </div>
      <p style={{ fontSize: 12, opacity: 0.85 }}>
        Income /s · food {formatLetterSuffix(income.food ?? "0")} · wood {formatLetterSuffix(income.wood ?? "0")} · stone{" "}
        {formatLetterSuffix(income.stone ?? "0")} · gold {formatLetterSuffix(income.gold ?? "0")}. Flag tithe /tick · food{" "}
        {tithe.food} · wood {tithe.wood} · stone {tithe.stone} · gold {tithe.gold}.
      </p>
      <StudyLine state={state} />
      <p style={{ fontSize: 12, opacity: 0.75 }}>
        People labor /tick · food {labor.food} · wood {labor.wood} · stone {labor.stone} · gold {labor.gold}. Assign jobs on People.
      </p>
      {ledgers ? (
        <p style={{ fontSize: 12, opacity: 0.75 }}>
          Vault keeps (raid cannot take) · food {formatLetterSuffix(String(ledgers.food.vault))} · wood{" "}
          {formatLetterSuffix(String(ledgers.wood.vault))} · stone {formatLetterSuffix(String(ledgers.stone.vault))} · gold{" "}
          {formatLetterSuffix(String(ledgers.gold.vault))}. Exposed · food {formatLetterSuffix(String(ledgers.food.exposed))} · wood{" "}
          {formatLetterSuffix(String(ledgers.wood.exposed))} · stone {formatLetterSuffix(String(ledgers.stone.exposed))} · gold{" "}
          {formatLetterSuffix(String(ledgers.gold.exposed))}. Raise Keep, Mint, or Granary to hide more.
        </p>
      ) : null}
      {packed.length > 0 ? (
        <p style={{ fontSize: 12, color: "#f85149" }}>
          Store full — extra is lost. Raise {packed.map((p) => p.label).join(", ")} to hold more {packed.map((p) => p.res).join(", ")}.
        </p>
      ) : null}
      {idle.length > 0 ? (
        <p style={{ fontSize: 12, color: "#d29922" }}>
          No worker on {idle.slice(0, 5).map((w) => w.name).join(", ")}
          {idle.length > 5 ? ` +${idle.length - 5} more` : ""}. Assign on People for +20%.
        </p>
      ) : null}
      {misses.length > 0 ? (
        <p style={{ fontSize: 12, color: "#e8c36a" }}>
          Pair for +15%: {misses
            .slice(0, 6)
            .map((m) => `${PAIR_LABEL[m.typeId] ?? m.typeId} wants ${PAIR_LABEL[m.wants] ?? m.wants}`)
            .join(" · ")}
          {misses.length > 6 ? ` · +${misses.length - 6} more` : ""}.
        </p>
      ) : (
        <p style={{ fontSize: 12, opacity: 0.6 }}>Every farm/camp/mine that can pair is next to its warehouse.</p>
      )}
      <KeepGateCard gate={gateRow} keepLv={keepLv} beds={beds} pop={pop} plots={plots} plotCap={plotCap} />
      {incoming.length > 0 ? (
        <p style={{ fontSize: 13, color: "#f85149" }}>
          {incoming.map((m) => {
            const eta = Math.max(0, Math.ceil((m.arrivesTick - tick) / 10));
            return `${nameOf(m.realmId)} at the gates · ${eta}s`;
          }).join(" · ")}
        </p>
      ) : null}
      {onFlags.length > 0 ? (
        <p style={{ fontSize: 13, color: "#d29922" }}>
          {onFlags.map((m) => {
            const dest = state ? getProvince(state, m.toId) : undefined;
            const eta = Math.max(0, Math.ceil((m.arrivesTick - tick) / 10));
            const where = dest ? `${dest.x},{dest.y}` : m.toId;
            return `${nameOf(m.realmId)} on flag ${where} · ${eta}s`;
          }).join(" · ")}
        </p>
      ) : null}
      {selected ? <p style={{ fontSize: 12, opacity: 0.8 }}>{selected.name}: {selected.blurb}</p> : null}
      <div className="sc-plain-grid">
        {types.map((t) => {
          const n = state ? countBuilding(state, t.id) : 0;
          const afford = state ? canAfford(state, t.id) : false;
          const picked = selectedBuild === t.id;
          return (
            <button
              key={t.id}
              type="button"
              title={t.blurb}
              onClick={() => setSelectedBuild(t.id)}
              className={`sc-work-card sc-plain-pick ${picked ? "is-picked" : afford ? "is-afford" : "is-short"}`}
            >
              <span className="sc-work-head">
                <span className="sc-work-name">{t.name}</span>
                {n ? <span className="sc-work-level">x{n}</span> : null}
              </span>
              <span className="sc-work-status">{picked ? "Picked — tap a plot" : afford ? "Can afford" : "Short on stores"}</span>
            </button>
          );
        })}
      </div>
      {works.length > 0 ? (
        <>
          <h3>Raising</h3>
          <div className="sc-plain-grid">
          {works.map((b) => {
            const left = state ? buildTicksLeft(state, b.id) : 0;
            const nm = getBuildingType(b.typeId)?.name ?? b.typeId;
            return (
              <div key={b.id} className="sc-work-card sc-plain-card is-ready">
                <div className="sc-work-head">
                  <span className="sc-work-name">{nm}</span>
                </div>
                <div className="sc-work-status">{Math.ceil(left / 10)}s left</div>
                <div className="sc-plain-actions">
                <button
                  type="button"
                  className="sc-work-btn"
                  onClick={() => act((st) => (tryCancelBuild(st, b.id) ? `Struck the ${nm} scaffolding.` : "That work already stands."))}
                >
                  Cancel
                </button>
                </div>
              </div>
            );
          })}
          </div>
        </>
      ) : null}
      {upgrades.length > 0 ? (
        <>
          <h3>Improving</h3>
          <div className="sc-plain-grid">
          {upgrades.map((job) => {
            const b = state?.buildings.find((x) => x.id === job.buildingId);
            const nm = getBuildingType(b?.typeId ?? "")?.name ?? job.buildingId;
            const left = state ? Math.max(0, job.doneTick - state.meta.tick) : 0;
            return (
              <div key={job.id} className="sc-work-card sc-plain-card is-ready">
                <div className="sc-work-head">
                  <span className="sc-work-name">{nm}</span>
                  <span className="sc-work-level">→ lv {job.fromLevel + 1}</span>
                </div>
                <div className="sc-work-status">{Math.ceil(left / 10)}s left</div>
                <div className="sc-plain-actions">
                <button
                  type="button"
                  className="sc-work-btn"
                  onClick={() => act((st) => (tryCancelUpgrade(st, job.buildingId) ? `Stopped improving the ${nm}.` : "That work already finished."))}
                >
                  Cancel
                </button>
                </div>
              </div>
            );
          })}
          </div>
        </>
      ) : null}
      {state && standing.length + scarred.length > 0 ? (
        <>
          <h3>Standing works</h3>
          <div className="sc-work-grid">
            {scarred.map((b) => (
              <WorkCard key={b.id} state={state} b={b} scarred act={act} />
            ))}
            {standing.map((b) => (
              <WorkCard key={b.id} state={state} b={b} scarred={false} act={act} />
            ))}
          </div>
        </>
      ) : null}
      {flags.length > 0 ? (
        <>
          <h3>Flags</h3>
          <div className="sc-plain-grid">
          {flags.map((p) => {
            const posted = state ? garrisonAt(state, p.id) : undefined;
            const power = state && posted ? garrisonPower(state, p.id) : 0;
            const hit = state ? incomingOnProvince(state, p.id) : undefined;
            const eta = hit ? Math.max(0, Math.ceil((hit.arrivesTick - tick) / 10)) : 0;
            return (
              <div key={p.id} className={`sc-work-card sc-plain-card ${hit ? "is-warn" : posted ? "is-done" : ""}`}>
                <div className="sc-work-head">
                  <span className="sc-work-name">{p.node}</span>
                  <span className="sc-work-level">{p.x},{p.y}</span>
                </div>
                <div className="sc-work-status">
                  {posted ? `Garrison ${power}` : "Unguarded"}
                  {hit ? ` · ${nameOf(hit.realmId)} in ${eta}s` : ""}
                </div>
                <div className="sc-plain-actions">
                <button
                  type="button"
                  className="sc-work-btn"
                  onClick={() => act((st) => (tryAbandonOutpost(st, p.id) ? "Banner pulled. Garrison home." : "Cannot abandon."))}
                >
                  Abandon
                </button>
                </div>
              </div>
            );
          })}
          </div>
        </>
      ) : null}
      <PeoplePanel state={state} act={act} />
      <h3>Market</h3>
      <p style={{ fontSize: 12 }}>{marketsN < 1 ? "Build a Market to trade." : `Markets x${marketsN}`}</p>
      <div className="sc-offer-grid">
        {MARKET_OFFERS.map((o) => (
          <OfferCard key={o.id} state={state} offer={o} act={act} />
        ))}
      </div>
    </>
  );
}
