import React from "react";
import { Crest } from "./Crest";

export interface BattleSnap {
  attackerId: string;
  defenderId: string;
  winnerId: string;
  attackerPower: number;
  defenderPower: number;
  phases?: { title: string; text: string }[];
}

export function BattleVisual(props: { snap: BattleSnap | null; active: boolean }) {
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    setStep(0);
    if (!props.snap?.phases?.length) return;
    const id = window.setInterval(() => {
      setStep((s) => Math.min(s + 1, (props.snap?.phases?.length ?? 1) - 1));
    }, 700);
    return () => window.clearInterval(id);
  }, [props.snap]);

  if (props.active && !props.snap) {
    return (
      <div className="sc-battle" style={{ background: "#1a120e", border: "1px solid #5a3a28", borderRadius: 8, padding: 12, margin: "12px 0" }}>
        <span className="sc-march">⚔ ⚔ ⚔</span> Armies are in the field. Press Fight to resolve the battle.
      </div>
    );
  }
  if (!props.snap) return null;
  const { attackerId, defenderId, winnerId, attackerPower, defenderPower, phases } = props.snap;
  const shown = phases?.slice(0, step + 1) ?? [];
  return (
    <div
      className="sc-battle"
      style={{
        background: "linear-gradient(180deg, #2a1810, #120c08)",
        border: "1px solid #6a4a28",
        borderRadius: 8,
        padding: 14,
        margin: "12px 0",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div className="sc-badge">
          <Crest realmId={attackerId} /> Attacker · {attackerPower} power
        </div>
        <div style={{ opacity: 0.6 }}>vs</div>
        <div className="sc-badge">
          Defender · {defenderPower} power <Crest realmId={defenderId} />
        </div>
      </div>
      {shown.map((p, i) => (
        <div key={p.title} style={{ marginTop: 8, opacity: i === shown.length - 1 ? 1 : 0.65 }}>
          <strong>{p.title}.</strong> {p.text}
        </div>
      ))}
      <div style={{ marginTop: 10, textAlign: "center", color: "#e3b341", fontWeight: 700 }}>
        {winnerId === "player" ? "Your host holds the field." : "The enemy holds the field."}
      </div>
    </div>
  );
}
