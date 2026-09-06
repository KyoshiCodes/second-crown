import React from "react";
import {
  canAffordTrain,
  peaceTicksRemaining,
  realmPower,
  tryDeclareWar,
  tryGiftGold,
  tryResolveWar,
  tryTrain,
  tryWhitePeace,
  type GameState,
} from "@second-crown/sim";
import { DiplomacyPanel } from "../HudControls";
import { BattleVisual, type BattleSnap } from "../BattleVisual";
import type { ActFn } from "../game/useGameEngine";
import { getGiftThanks, getWarTaunt } from "../content/flavor";
import { sfx } from "../sfx";

export function WarTab(props: {
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

  return (
    <>
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
    </>
  );
}
