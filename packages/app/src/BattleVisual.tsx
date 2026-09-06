import React from "react";
import { Crest } from "./Crest";

export interface BattleSnap {
  attackerId: string;
  defenderId: string;
  winnerId: string;
  attackerPower: number;
  defenderPower: number;
}

export function BattleVisual(props: { snap: BattleSnap | null; active: boolean }) {
  if (props.active && !props.snap) {
    return (
      <div
        style={{
          background: "#1a120e",
          border: "1px solid #5a3a28",
          borderRadius: 8,
          padding: 12,
          margin: "12px 0",
        }}
      >
        Armies are in the field. Press Fight to resolve the battle.
      </div>
    );
  }
  if (!props.snap) return null;
  const { attackerId, defenderId, winnerId, attackerPower, defenderPower } = props.snap;
  return (
    <div
      style={{
        background: "linear-gradient(180deg, #2a1810, #120c08)",
        border: "1px solid #6a4a28",
        borderRadius: 8,
        padding: 14,
        margin: "12px 0",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Crest realmId={attackerId} /> Attacker · {attackerPower} power
        </div>
        <div style={{ opacity: 0.6 }}>vs</div>
        <div>
          Defender · {defenderPower} power <Crest realmId={defenderId} />
        </div>
      </div>
      <div style={{ marginTop: 10, textAlign: "center", color: "#e3b341", fontWeight: 700 }}>
        {winnerId === "player" ? "Your host holds the field." : `${winnerId} holds the field.`}
      </div>
    </div>
  );
}
