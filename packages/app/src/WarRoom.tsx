import React from "react";
import {
  canAffordTrain,
  canSally,
  gateOnRim,
  healTicksLeft,
  housingCap,
  incomingOnHome,
  infirmaryBeds,
  lastBattleStory,
  listHealing,
  listLedger,
  listScarred,
  peaceTicksRemaining,
  population,
  realmPower,
  tryDeclareWar,
  tryGiftGold,
  tryRepair,
  tryResolveWar,
  trySally,
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
import { MarshalCard } from "./MarshalCard";
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
  const healing = state ? listHealing(state).length : 0;
  const healLeft = state ? healTicksLeft(state) : 0;
  const pop = state ? population(state) : 0;
  const cap = state ? housingCap(state) : 0;
  const tick = state?.meta.tick ?? 0;
  const sallyReady = state ? canSally(state) : false;
  const nameOf = (id: string) => state?.realms.find((r) => r.id === id)?.name ?? id;
  const etaOf = (arrivesTick: number) => Math.max(0, Math.ceil((arrivesTick - tick) / 10));
  const lastField = state
    ? listLedger(state).find((e) => /march|battle|camp|siege|hold|garrison|flag|storm|sally/i.test(`${e.kind} ${e.text}`))
    : undefined;
  const story = state ? lastBattleStory(state) : null;

  const card = { margin: "10px 0", fontSize: 13 } as const;
  const h = { display: "block", marginBottom: 6 } as const;
  const resolveWar = () => act((st, eng) => {
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
  });

  return (
    <div className="sc-tab-war">
      <WarLivingStrip state={state} />
      <MarshalCard state={state} act={act} />

      <section className="sc-realm-card" style={card}>
        <strong style={h}>Odds</strong>
        <p style={{ margin: "0 0 6px", fontSize: 12, opacity: 0.75 }}>
          Your power {mine}. Green favors you, red favors them. Combat still rolls.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {otherRealms.map((r) => {
            const left = state ? peaceTicksRemaining(state, "player", r.id) : 0;
            const theirs = state ? realmPower(state, r.id) : 0;
            const locked = !!activeWar || left > 0;
            const favored = mine >= theirs;
            const share = mine + theirs > 0 ? Math.round((mine / (mine + theirs)) * 100) : 50;
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
                  : `Declare on ${r.name} · ${mine} vs ${theirs} (${share}%)`}
              </button>
            );
          })}
        </div>
        <DiplomacyPanel
          rivalOp={rivalOp}
          playerOp={playerOp}
          onGift={() => act((st) => (tryGiftGold(st) ? `Lord Varric: "${getGiftThanks("rival")}"` : "Need 15 gold."))}
        />
      </section>

      <section className="sc-realm-card" style={card}>
        <strong style={h}>Levy and fight</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
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
          <button type="button" disabled={!activeWar} onClick={resolveWar}>
            Fight
          </button>
          <button type="button" disabled={!activeWar} onClick={() => act((st) => (tryWhitePeace(st) ? "White peace signed." : "No war."))}>
            White Peace
          </button>
        </div>
        {!activeWar ? <p style={{ margin: "6px 0 0", fontSize: 12, opacity: 0.7 }}>No war declared. Fight opens once one is.</p> : null}
        <BattleVisual snap={battleSnap} active={!!activeWar} />
      </section>

      <section className="sc-realm-card" style={card}>
        <strong style={h}>Last battle</strong>
        {lastField ? (
          <p style={{ margin: "0 0 4px" }}>{lastField.text}</p>
        ) : (
          <p style={{ margin: "0 0 4px", opacity: 0.7 }}>No field report yet.</p>
        )}
        {story && story.events.length > 0 ? (
          <ul style={{ margin: "0 0 4px", paddingLeft: 18, fontSize: 12 }}>
            {story.events.slice(0, 8).map((ev, i) => (
              <li key={`${ev.round}-${i}`}>{ev.text}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="sc-realm-card" style={card}>
        <strong style={h}>Home front</strong>
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
        <button
          type="button"
          disabled={!sallyReady}
          onClick={() =>
            act((st) => {
              if (!trySally(st)) return "Need 5 militia and a column on the road.";
              return "Sally at the gate.";
            })
          }
        >
          Sally (5 militia)
        </button>
        <p style={{ margin: "4px 0" }}>
          Wall HP {hp}. Gate {gateUp ? "up" : "down"}. Siege hits walls first, then the yard, then the keep.
        </p>
        <p style={{ margin: "4px 0" }}>
          Wounded {wounded} / {beds} beds{healing > 0 ? ` · treating ${healing} (${Math.ceil(healLeft / 10)}s)` : ""}.{" "}
          <button
            type="button"
            disabled={wounded <= 0}
            onClick={() => act((st) => (tryTreatWounded(st) ? "Sent 1 wounded to the ward." : "Need 4 food."))}
          >
            Treat (4 food, 5s)
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
      </section>

      <section className="sc-realm-card" style={{ ...card, fontSize: 12 }}>
        <strong style={h}>Decrees</strong>
        <p style={{ margin: "4px 0" }}>
          {summary && summary.fortifyTicksLeft > 0
            ? `Walls stand (${Math.ceil(summary.fortifyTicksLeft / 10)}s left).`
            : "No fortification raised. Swear one on the Crown tab."}
        </p>
        <p style={{ margin: "4px 0" }}>
          {activeDecrees.length > 0
            ? `Active: ${activeDecrees.map((d) => `${d.name} (${Math.ceil(d.ticksLeft / 10)}s)`).join(", ")}.`
            : "No decree running. Swear one on the Crown tab."}
        </p>
      </section>
    </div>
  );
}
