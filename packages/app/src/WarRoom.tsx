import React from "react";
import {
  canAffordTrain,
  gateOnRim,
  housingCap,
  incomingOnHome,
  infirmaryBeds,
  listScarred,
  peaceTicksRemaining,
  population,
  realmPower,
  tryDeclareWar,
  tryGiftGold,
  tryRepair,
  tryResolveWar,
  tryTrain,
  tryTreatWounded,
  tryWhitePeace,
  wallHp,
  warSummary,
  watchtowerWarning,
  woundedCount,
  type GameState,
} from "@second-crown/sim";
import { DiplomacyPanel } from "./HudControls";
import { BattleVisual, type BattleSnap } from "./BattleVisual";
import { WarLivingStrip } from "./WarLivingStrip";
import type { ActFn } from "./game/useGameEngine";
import { getGiftThanks, getWarTaunt } from "./content/flavor";
import { sfx } from "./sfx";

export function WarRoom(props: {
  state: GameState | undefined;
  act: ActFn;
  rivalOp: number;
  playerOp: number;
  battleSnap: BattleSnap | null;
  setBattleSnap: (snap: BattleSnap | null) => void;
}) {
  const { state, act, rivalOp, playerOp, battleSnap, setBattleSnap } = props;
  const activeWar = state?.wars.find((w) => w.status === "active");
  const otherRealms = (state?.realms ?? []).filter((r) => r.id !== "player");
  const mine = state ? realmPower(state, "player") : 0;
  const canLevy = state ? canAffordTrain(state, "militia", 5) : false;
  const summary = state ? warSummary(state) : null;
  const activeDecrees = summary?.decrees.filter((d) => d.ticksLeft > 0) ?? [];
  const incoming = state ? incomingOnHome(state) : [];
  const seen = state ? watchtowerWarning(state) : undefined;
  const scarred = state ? listScarred(state) : [];
  const hp = state ? wallHp(state) : 0;
  const gateUp = state ? gateOnRim(state) : false;
  const wounded = state ? woundedCount(state) : 0;
  const beds = state ? infirmaryBeds(state) : 0;
  const pop = state ? population(state) : 0;
  const cap = state ? housingCap(state) : 0;
  const tick = state?.meta.tick ?? 0;
  const nameOf = (id: string) => state?.realms.find((r) => r.id === id)?.name ?? id;
  const etaOf = (arrivesTick: number) => Math.max(0, Math.ceil((arrivesTick - tick) / 10));

  return (
    <div className="sc-tab-war">
      <WarLivingStrip state={state} />
      <div className="sc-realm-card" style={{ margin: "10px 0", fontSize: 13 }}>
        <strong>Briefing</strong>
        <div style={{ margin: "6px 0" }}>
          <div style={{ opacity: 0.85, marginBottom: 2 }}>Incoming</div>
          {incoming.length > 0 ? (
            <ul style={{ margin: "0 0 4px", paddingLeft: 18 }}>
              {incoming.map((m) => (
                <li key={m.id}>
                  {seen ? nameOf(m.realmId) : "Unknown host"} — ETA {etaOf(m.arrivesTick)}s
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: "4px 0", opacity: 0.7 }}>No column on your gates.</p>
          )}
          <p style={{ margin: "4px 0" }}>
            Wall HP {hp}. Gate {gateUp ? "up" : "down"}. Siege hits walls first, then the yard, then the keep.
          </p>
        </div>
        <p style={{ margin: "4px 0" }}>
          Wounded {wounded} / {beds} beds.{" "}
          <button
            type="button"
            disabled={wounded <= 0}
            onClick={() => act((st) => (tryTreatWounded(st) ? "Treated 1 wounded." : "Need 4 food."))}
          >
            Treat (4 food)
          </button>
        </p>
        <p style={{ margin: "4px 0" }}>
          People {pop} / {cap} housing.
        </p>
        {scarred.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => act((st) => (tryRepair(st, b.id) ? `Repaired ${b.typeId}.` : "Need 8 stone."))}
          >
            Repair {b.typeId} (8 stone)
          </button>
        ))}
      </div>
      <DiplomacyPanel
        rivalOp={rivalOp}
        playerOp={playerOp}
        onGift={() => act((st) => (tryGiftGold(st) ? `Lord Varric: "${getGiftThanks("rival")}"` : "Need 15 gold."))}
      />
      <p style={{ fontSize: 12, opacity: 0.7 }}>Your power {mine}. Green odds favor you; red favors them. Combat still rolls.</p>
      <button
        type="button"
        disabled={!canLevy}
        onClick={() => act((st) => {
          const ok = tryTrain(st, { typeId: "militia", count: 5 });
          if (ok) sfx.train();
          return ok ? "Raised 5 militia." : "Cannot afford 5 militia.";
        })}
      >
        Raise 5 militia
      </button>
      <div className="sc-realm-card" style={{ margin: "10px 0", fontSize: 12 }}>
        <strong>Defenses &amp; decrees</strong>
        <p style={{ margin: "4px 0" }}>
          {summary && summary.fortifyTicksLeft > 0
            ? `Walls stand (${Math.ceil(summary.fortifyTicksLeft / 10)}s left).`
            : "No fortification raised. Swear one on the Crown tab."}
        </p>
        <p style={{ margin: "4px 0" }}>
          {activeDecrees.length > 0
            ? `Active decrees: ${activeDecrees.map((d) => d.name).join(", ")}.`
            : "No decree running. Swear one on the Crown tab."}
        </p>
      </div>
      <BattleVisual snap={battleSnap} active={!!activeWar} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {otherRealms.map((r) => {
          const left = state ? peaceTicksRemaining(state, "player", r.id) : 0;
          const theirs = state ? realmPower(state, r.id) : 0;
          const locked = !!activeWar || left > 0;
          const favored = mine >= theirs;
          return (
            <button
              key={r.id}
              type="button"
              disabled={locked}
              style={{ borderColor: favored ? "#3fb950" : "#f85149", borderWidth: 1, borderStyle: "solid" }}
              onClick={() => act((st) => {
                const ok = tryDeclareWar(st, { attackerRealmId: "player", defenderRealmId: r.id });
                if (!ok) return "Cannot declare war.";
                return `${r.name}: "${getWarTaunt(r.id)}"`;
              })}
            >
              {left > 0
                ? `Peace with ${r.name} (${Math.ceil(left / 10)}s)`
                : `Declare on ${r.name} (${mine} vs ${theirs})`}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled={!activeWar}
        onClick={() => act((st, eng) => {
          const war = st.wars.find((w) => w.status === "active");
          const atk = war ? realmPower(st, war.attackerRealmId) : 0;
          const def = war ? realmPower(st, war.defenderRealmId) : 0;
          const r = tryResolveWar(st, eng.rng);
          if (r.ok && r.result && war) {
            setBattleSnap({
              attackerId: war.attackerRealmId,
              defenderId: war.defenderRealmId,
              winnerId: r.result.winnerId,
              attackerPower: r.result.attackerPower ?? atk,
              defenderPower: r.result.defenderPower ?? def,
              phases: r.result.phases,
            });
            if (r.result.winnerId === "player") sfx.win();
            else sfx.lose();
            return r.result.winnerId === "player" ? "Victory." : "Defeat.";
          }
          return "No active war.";
        })}
      >
        Fight
      </button>
      <button type="button" disabled={!activeWar} onClick={() => act((st) => (tryWhitePeace(st) ? "White peace signed." : "No war."))}>
        White Peace
      </button>
    </div>
  );
}
