import React from "react";
import type { GameState } from "@second-crown/sim";
import { formatLetterSuffix, getUnitType, championName, realmPower } from "@second-crown/sim";
import { Crest } from "./Crest";
import { UnitIcon } from "./UnitIcon";

interface WarLivingStripProps {
  state: GameState | undefined;
  activeWarId?: string;
}

export function WarLivingStrip(props: { state: GameState | undefined }) {
  const { state } = props;
  const [frame, setFrame] = React.useState<0 | 1 | 2>(0);

  // 2-3 frame marching cadence (cycles 0 -> 1 -> 0 -> 2)
  React.useEffect(() => {
    let step = 0;
    const interval = window.setInterval(() => {
      step = (step + 1) % 4;
      const f = step === 1 ? 1 : step === 3 ? 2 : 0;
      setFrame(f as 0 | 1 | 2);
    }, 240);
    return () => window.clearInterval(interval);
  }, []);

  const activeWar = state?.wars.find((w) => w.status === "active");
  const enemyRealmId = activeWar
    ? (activeWar.attackerRealmId === "player" ? activeWar.defenderRealmId : activeWar.attackerRealmId)
    : "rival";

  const enemyRealm = state?.realms.find((r) => r.id === enemyRealmId);
  const enemyName = enemyRealm?.name ?? (enemyRealmId === "rival" ? "Lord Varric" : enemyRealmId);

  const playerPower = state ? realmPower(state, "player") : 0;
  const enemyPower = state ? realmPower(state, enemyRealmId) : 0;
  const totalPower = Math.max(1, playerPower + enemyPower);
  const playerPct = Math.round((playerPower / totalPower) * 100);

  const playerUnits = (state?.units ?? []).filter((u) => u.realmId === "player");

  // Bob and arm offsets for 2-3 frame walker soldiers
  const bob = frame === 0 ? 0 : 2;
  const legL = frame === 1 ? -2 : frame === 2 ? 1 : 0;
  const legR = frame === 1 ? 1 : frame === 2 ? -2 : 0;
  const bannerWave = frame === 1 ? -2 : frame === 2 ? 2 : 0;

  return (
    <div
      className="sc-war-living-strip"
      style={{
        background: "linear-gradient(180deg, #1f140e 0%, #120b08 100%)",
        border: "1px solid #6b4324",
        borderRadius: 8,
        padding: "10px 12px 14px",
        margin: "12px 0",
        boxShadow: "0 4px 16px rgba(0,0,0,0.55)",
      }}
    >
      {/* Header bar: realm power confrontation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #3d2414",
          paddingBottom: 8,
          marginBottom: 10,
          fontSize: 12.5,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "#68d391" }}>
          <Crest realmId="player" />
          <span>Your Host ({formatLetterSuffix(playerPower)})</span>
        </div>

        <div style={{ textAlign: "center" }}>
          {activeWar ? (
            <span style={{ color: "#f87171", fontWeight: 700, letterSpacing: 0.5 }}>
              ⚔️ BATTLEFIELD CLASH IN PROGRESS ⚔️
            </span>
          ) : (
            <span style={{ color: "#d1d5db", opacity: 0.85 }}>
              🕊️ BORDER WATCH — FORCES AT READY
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "#f87171" }}>
          <span>{enemyName} ({formatLetterSuffix(enemyPower)})</span>
          <Crest realmId={enemyRealmId} />
        </div>
      </div>

      {/* Living Pixel Battlefield Canvas Strip */}
      <div
        style={{
          position: "relative",
          minHeight: 110,
          background: activeWar
            ? "radial-gradient(ellipse at 50% 50%, #301710 0%, #160c08 100%)"
            : "radial-gradient(ellipse at 50% 50%, #1a241c 0%, #0f1610 100%)",
          border: "1px solid #4a2b16",
          borderRadius: 6,
          overflow: "hidden",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          padding: "8px 16px 12px",
        }}
      >
        {/* Dirt & cobblestone battlefield ground */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 28,
            background: "#26170d",
            borderTop: "2px solid #452a18",
          }}
        />

        {/* Player Vanguard (Left Side) */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, zIndex: 2 }}>
          {/* Royal Standard Bearer */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 2 }}>
            <svg width="24" height="60" viewBox="0 0 24 60" style={{ overflow: "visible" }}>
              {/* Flagpole */}
              <line x1="6" y1="4" x2="6" y2="58" stroke="#d4a359" strokeWidth="2" />
              {/* Royal Pennant (animated 3-frame wave) */}
              <polygon
                points={`6,6 ${22 + bannerWave},12 6,18`}
                fill="#22c55e"
                stroke="#15803d"
                strokeWidth="1"
              />
              <circle cx="6" cy="4" r="2.5" fill="#facc15" />
              {/* Standard Bearer Body (2-3 frame walker) */}
              <rect x="2" y={32 + bob} width="8" height="12" fill="#15803d" rx="1" />
              <circle cx="6" cy={26 + bob} r="4" fill="#fbcfe8" />
              <rect x="3" y={22 + bob} width="6" height="3" fill="#94a3b8" /> {/* Helm */}
              {/* Boots */}
              <rect x={3 + legL} y={44 + bob} width="3" height="6" fill="#18181b" />
              <rect x={7 + legR} y={44 + bob} width="3" height="6" fill="#27272a" />
            </svg>
            <span style={{ fontSize: 10, color: "#86efac", fontWeight: 700, marginTop: 2 }}>Standard</span>
          </div>

          {/* Player Formations */}
          {playerUnits.length > 0 ? (
            playerUnits.slice(0, 5).map((u) => {
              const def = getUnitType(u.typeId);
              const name = u.typeId === "champion" && state ? championName(state) : def?.name ?? u.typeId;
              return (
                <div
                  key={u.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    transition: "transform 120ms ease",
                    transform: `translateY(${-bob}px)`,
                  }}
                >
                  <div style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
                    <UnitIcon typeId={u.typeId} size={36} />
                  </div>
                  <div
                    style={{
                      background: "rgba(10, 8, 6, 0.85)",
                      border: "1px solid #78531e",
                      borderRadius: 4,
                      padding: "1px 5px",
                      fontSize: 10,
                      color: "#fef08a",
                      fontWeight: 700,
                      marginTop: 4,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {name} ×{formatLetterSuffix(u.count)}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ fontSize: 12, opacity: 0.7, color: "#d1d5db", paddingBottom: 16 }}>
              No companies raised yet. Raise militia to march!
            </div>
          )}
        </div>

        {/* Center Clash Sparks & Banner */}
        <div
          style={{
            zIndex: 2,
            textAlign: "center",
            paddingBottom: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {activeWar ? (
            <>
              <div
                style={{
                  fontSize: 22,
                  animation: "sc-pulse 1s infinite alternate",
                  filter: "drop-shadow(0 0 8px #ef4444)",
                }}
              >
                ⚔️
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: playerPower >= enemyPower ? "#86efac" : "#fca5a5",
                  background: "rgba(0,0,0,0.75)",
                  padding: "2px 8px",
                  borderRadius: 4,
                  border: "1px solid #7c2d12",
                  marginTop: 2,
                }}
              >
                {playerPower >= enemyPower ? "Advantage: Yours" : "Advantage: Enemy"}
              </div>
            </>
          ) : (
            <div
              style={{
                fontSize: 11,
                color: "#9ca3af",
                background: "rgba(0,0,0,0.6)",
                padding: "3px 8px",
                borderRadius: 4,
                border: "1px solid #374151",
              }}
            >
              Stone Frontier Marker
            </div>
          )}
        </div>

        {/* Enemy Vanguard (Right Side, Facing Left) */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, zIndex: 2, transform: "scaleX(-1)" }}>
          {/* Enemy Standard Bearer */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 2 }}>
            <svg width="24" height="60" viewBox="0 0 24 60" style={{ overflow: "visible" }}>
              <line x1="6" y1="4" x2="6" y2="58" stroke="#a1a1aa" strokeWidth="2" />
              <polygon
                points={`6,6 ${22 + bannerWave},12 6,18`}
                fill="#dc2626"
                stroke="#991b1b"
                strokeWidth="1"
              />
              <circle cx="6" cy="4" r="2.5" fill="#f87171" />
              <rect x="2" y={32 + bob} width="8" height="12" fill="#7f1d1d" rx="1" />
              <circle cx="6" cy={26 + bob} r="4" fill="#fbcfe8" />
              <rect x="3" y={22 + bob} width="6" height="3" fill="#64748b" />
              <rect x={3 + legL} y={44 + bob} width="3" height="6" fill="#18181b" />
              <rect x={7 + legR} y={44 + bob} width="3" height="6" fill="#27272a" />
            </svg>
            <span
              style={{
                fontSize: 10,
                color: "#fca5a5",
                fontWeight: 700,
                marginTop: 2,
                transform: "scaleX(-1)",
              }}
            >
              Host
            </span>
          </div>

          {/* Enemy Companies / Garrisons */}
          {["spearman", "archer", "militia"].map((tid, idx) => (
            <div
              key={tid}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transform: `translateY(${-bob}px)`,
              }}
            >
              <div style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
                <UnitIcon typeId={tid} size={36} />
              </div>
              <div
                style={{
                  background: "rgba(10, 8, 6, 0.85)",
                  border: "1px solid #7f1d1d",
                  borderRadius: 4,
                  padding: "1px 5px",
                  fontSize: 10,
                  color: "#fed7aa",
                  fontWeight: 700,
                  marginTop: 4,
                  whiteSpace: "nowrap",
                  transform: "scaleX(-1)",
                }}
              >
                Cohort {idx + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tactical Power Odds Meter */}
      <div style={{ marginTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
          <span style={{ color: "#86efac" }}>Your Share: {playerPct}%</span>
          <span style={{ color: "#fca5a5" }}>Enemy Share: {100 - playerPct}%</span>
        </div>
        <div
          style={{
            height: 7,
            width: "100%",
            background: "#450a0a",
            borderRadius: 4,
            overflow: "hidden",
            display: "flex",
          }}
        >
          <div
            style={{
              width: `${playerPct}%`,
              background: "linear-gradient(90deg, #15803d, #22c55e)",
              transition: "width 300ms ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}
