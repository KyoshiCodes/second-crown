import React from "react";
import {
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
  getProvince,
  housingCap,
  incomingOnHome,
  incomingOnPlayerFlags,
  incomingOnProvince,
  KEEP_GATES,
  keepLevel,
  keepNotice,
  laborPerTick,
  listOutposts,
  listScarred,
  MARKET_OFFERS,
  outpostTithePerTick,
  PAIR_LABEL,
  population,
  resourceLedger,
  settlementName,
  tryAbandonOutpost,
  tryAssignCitizen,
  unpairedWorks,
  watchtowerWarning,
  workPlotCap,
  workPlotsUsed,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "../game/useGameEngine";
import { PeoplePanel } from "../PeoplePanel";
import { Fold } from "../hud/Fold";
import { KeepGateCard } from "../KeepGateCard";
import { StudyLine } from "../StudyLine";
import { ResearchHint } from "../ResearchHint";
import { ResearchPace } from "../ResearchPace";
import { AcademyPace } from "../AcademyPace";
import { VisionPace } from "../VisionPace";
import { WallPace } from "../WallPace";
import { DecreeHint } from "../DecreeHint";
import { MarketHint } from "../MarketHint";
import { MarketPace } from "../MarketPace";
import { CultureLine } from "../CultureLine";
import { CultureStatusLine } from "../hud/CultureStatusLine";
import { StampsStatusLine } from "../hud/StampsStatusLine";
import { DecreesStatusLine } from "../hud/DecreesStatusLine";
import { EventsStatusLine } from "../hud/EventsStatusLine";
import { QuestsStatusLine } from "../hud/QuestsStatusLine";
import { ResearchStatusLine } from "../hud/ResearchStatusLine";
import { PrestigeLine } from "../PrestigeLine";
import { SeasonClaimLine } from "../SeasonClaimLine";
import { quarryHintPlot, staffQuarryHint, staffTowerHint, wallsReadyHint, wallsStoneHint } from "../buildHints";
import { WallLine } from "../WallLine";
import { VisionLine } from "../VisionLine";
import { WorkCard } from "../hud/WorkCard";
import { RaiseImproveFold } from "../hud/RaiseImproveFold";
import { OfferCard } from "../hud/OfferCard";
import { VaultLivingCards } from "../hud/VaultLivingCard";
import { OutpostLivingCard } from "../hud/OutpostLivingCard";
import { FlagsSummaryLine, KeepBannerLine } from "../hud/BannerStatusLine";
import { BalanceNotes } from "../BalanceNotes";
import { SeasonPip } from "../hud/SeasonPip";
import { SeasonEffectLine } from "../hud/SeasonEffectLine";
import { DayNightLine } from "../hud/DayNightLine";
import { WeatherLine } from "../hud/WeatherLine";
import { PrestigeRankLine } from "../hud/PrestigeRankLine";
import { AgeStatusLine } from "../hud/AgeStatusLine";
import "../hud/season-pip.css";
import "../hud/map-strip.css";
import "../hud/plain-buttons.css";

export function KingdomTab(props: {
  state: GameState | undefined;
  act: ActFn;
  selectedBuild: string | null;
  setSelectedBuild: (id: string) => void;
}) {
  const { state, act, selectedBuild, setSelectedBuild } = props;
  const marketsN = state ? countBuilding(state, "market") : 0;
  const hold = state ? settlementName(state) : "Your Hold";
  const season = state ? currentSeason(state) : "Spring";
  const scarred = state ? listScarred(state) : [];
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
            <span>
              <SeasonPip season={season} size={13} style={{ marginRight: 4, verticalAlign: "-2px" }} />
              {season}. People {pop}/{beds}. Work plots {plots}/{plotCap} (cottages buy more).
            </span>
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
      <SeasonClaimLine state={state} act={act} />
      <Fold id="kingdom-notes" noisy title="Realm notes" summary="Season, income, studies, culture, vaults, pairing">
      <SeasonEffectLine state={state} />
      <DayNightLine state={state} />
      <WeatherLine state={state} />
      <p style={{ fontSize: 12, opacity: 0.85 }}>
        Income /s · food {formatLetterSuffix(income.food ?? "0")} · wood {formatLetterSuffix(income.wood ?? "0")} · stone{" "}
        {formatLetterSuffix(income.stone ?? "0")} · gold {formatLetterSuffix(income.gold ?? "0")}. Flag tithe /tick · food{" "}
        {tithe.food} · wood {tithe.wood} · stone {tithe.stone} · gold {tithe.gold}.
      </p>
      <StudyLine state={state} />
      <ResearchHint state={state} />
      <ResearchPace state={state} />
      <AcademyPace state={state} />
      <VisionPace state={state} />
      <WallPace state={state} />
      <CultureLine state={state} act={act} />
      <CultureStatusLine state={state} />
      <PrestigeLine state={state} act={act} />
      <PrestigeRankLine state={state} threshold={false} />
      <AgeStatusLine state={state} />
      <StampsStatusLine />
      <DecreesStatusLine state={state} />
      <EventsStatusLine state={state} />
      <QuestsStatusLine state={state} />
      <ResearchStatusLine state={state} />
      <DecreeHint state={state} />
      <MarketHint state={state} />
      <MarketPace state={state} />
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
      {state ? <VaultLivingCards state={state} /> : null}
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
      </Fold>
      <KeepGateCard gate={gateRow} keepLv={keepLv} beds={beds} pop={pop} plots={plots} plotCap={plotCap} />
      {state ? <KeepBannerLine state={state} nameOf={nameOf} /> : null}
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
      <RaiseImproveFold state={state} act={act} selectedBuild={selectedBuild} setSelectedBuild={setSelectedBuild} />
      {state && standing.length + scarred.length > 0 ? (
        <Fold id="kingdom-standing" noisy title="Standing works" summary={`${standing.length} standing${scarred.length ? ` · ${scarred.length} scarred` : ""}`}>
          <div className="sc-work-grid">
            {scarred.map((b) => (
              <WorkCard key={b.id} state={state} b={b} scarred act={act} />
            ))}
            {standing.map((b) => (
              <WorkCard key={b.id} state={state} b={b} scarred={false} act={act} />
            ))}
          </div>
        </Fold>
      ) : null}
      {flags.length > 0 ? (
        <Fold id="kingdom-flags" title="Flags" summary={`${flags.length} planted`}>
          {state ? <FlagsSummaryLine state={state} /> : null}
          <div className="sc-plain-grid">
          {flags.map((p) => {
            const posted = state ? garrisonAt(state, p.id) : undefined;
            const hit = state ? incomingOnProvince(state, p.id) : undefined;
            return (
              <div key={p.id} className={`sc-work-card sc-plain-card ${hit ? "is-warn" : posted ? "is-done" : ""}`}>
                {state ? <OutpostLivingCard state={state} province={p} nameOf={nameOf} /> : null}
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
        </Fold>
      ) : null}
      <Fold id="kingdom-people" noisy title="People" summary={`${pop}/${beds} housed`}>
        <PeoplePanel state={state} act={act} />
      </Fold>
      <BalanceNotes state={state} />
      <Fold id="kingdom-market" noisy title="Market" summary={marketsN < 1 ? "No market yet" : `Markets x${marketsN}`}>
        <p style={{ fontSize: 12 }}>{marketsN < 1 ? "Build a Market to trade." : `Markets x${marketsN}`}</p>
        <div className="sc-offer-grid">
          {MARKET_OFFERS.map((o) => (
            <OfferCard key={o.id} state={state} offer={o} act={act} />
          ))}
        </div>
      </Fold>
    </>
  );
}
