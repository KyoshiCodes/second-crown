import React from "react";
import type { GameState } from "@second-crown/sim";
import { formatLetterSuffix, getUnitType, realmPower, D, toDecimalString, playerCultureId, cultureOfRealm } from "@second-crown/sim";
import type Decimal from "break_infinity.js";
import { Crest } from "./Crest";
import { UnitIcon } from "./UnitIcon";
import { isFoodStoresEmptyOrLow } from "@second-crown/render";

interface AggregatedUnit {
  typeId: string;
  name: string;
  count: Decimal;
}

function getAggregatedUnits(state: GameState | undefined, realmId: string): AggregatedUnit[] {
  if (!state) return [];
  const counts = new Map<string, Decimal>();

  for (const u of state.units) {
    if (u.realmId === realmId) {
      const current = counts.get(u.typeId) ?? D(0);
      counts.set(u.typeId, current.add(D(u.count)));
    }
  }

  const result: AggregatedUnit[] = [];
  for (const [typeId, count] of counts.entries()) {
    if (count.gt(0)) {
      const def = getUnitType(typeId);
      // Real unit type names only (militia, spearman, champion, etc.).
      // No leftover debug labels or personal character names (e.g. Suki).
      const name = def?.name ?? typeId.charAt(0).toUpperCase() + typeId.slice(1);
      result.push({ typeId, name, count });
    }
  }
  return result;
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

  const enemyRealm = state?.realms.find((r) => r.id === enemyRealmId) ?? state?.realms.find((r) => r.id !== "player");
  const enemyName = enemyRealm?.name ?? (enemyRealmId === "rival" ? "Lord Varric" : enemyRealmId);

  const playerPower = state ? realmPower(state, "player") : 0;
  const enemyPower = state ? realmPower(state, enemyRealmId) : 0;
  const totalPower = Math.max(1, playerPower + enemyPower);
  const playerPct = Math.round((playerPower / totalPower) * 100);

  const playerUnits = getAggregatedUnits(state, "player");
  const enemyUnits = getAggregatedUnits(state, enemyRealmId);

  const isTired = state ? isFoodStoresEmptyOrLow(state) : false;

  // Bob and arm offsets for 2-3 frame walker soldiers
  const bob = frame === 0 ? 0 : 2;
  const legL = frame === 1 ? -2 : frame === 2 ? 1 : 0;
  const legR = frame === 1 ? 1 : frame === 2 ? -2 : 0;
  const bannerWave = isTired ? 0 : (frame === 1 ? -2 : frame === 2 ? 2 : 0);
  const bearerBob = isTired ? 0 : bob;

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
          minHeight: 124,
          background: activeWar
            ? "radial-gradient(ellipse at 50% 50%, #301710 0%, #160c08 100%)"
            : "radial-gradient(ellipse at 50% 50%, #1a241c 0%, #0f1610 100%)",
          border: "1px solid #4a2b16",
          borderRadius: 6,
          overflow: "hidden",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          padding: "10px 14px 14px",
          gap: 12,
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
            zIndex: 1,
          }}
        />

        {/* Player Vanguard (Left Side) */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 10,
            zIndex: 2,
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* Royal Standard Bearer */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 2, flexShrink: 0 }}>
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
              <rect x="2" y={32 + bearerBob} width="8" height="12" fill="#15803d" rx="1" />
              <circle cx="6" cy={26 + bearerBob} r="4" fill="#fbcfe8" />
              <rect x="3" y={22 + bearerBob} width="6" height="3" fill="#94a3b8" /> {/* Helm */}
              {/* Boots */}
              <rect x={3 + (isTired ? 0 : legL)} y={44 + bearerBob} width="3" height="6" fill="#18181b" />
              <rect x={7 + (isTired ? 0 : legR)} y={44 + bearerBob} width="3" height="6" fill="#27272a" />
            </svg>
            <span style={{ fontSize: 9.5, color: "#86efac", fontWeight: 700, marginTop: 4 }}>Standard</span>
          </div>

          {/* Player Formations */}
          {playerUnits.length > 0 ? (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexWrap: "wrap" }}>
              {playerUnits.map((u) => (
                <div
                  key={u.typeId}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    flexShrink: 0,
                    transform: `translateY(${-bob}px)`,
                    transition: "transform 120ms ease",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      border: "1px solid #78531e",
                      borderRadius: 6,
                      overflow: "hidden",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.6)",
                      background: "#181410",
                      lineHeight: 0,
                    }}
                  >
                    <UnitIcon typeId={u.typeId} size={36} culture={state ? playerCultureId(state) : "western"} tired={isTired && u.typeId === "militia"} />
                  </div>
                  <div
                    style={{
                      background: "rgba(10, 8, 6, 0.92)",
                      border: "1px solid #78531e",
                      borderRadius: 4,
                      padding: "2px 6px",
                      fontSize: 10,
                      color: "#fef08a",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      textAlign: "center",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.7)",
                      pointerEvents: "none",
                    }}
                  >
                    {u.name} ×{formatLetterSuffix(toDecimalString(u.count))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 11, opacity: 0.75, color: "#86efac", padding: "6px 10px", background: "rgba(10, 8, 6, 0.6)", borderRadius: 4, border: "1px dashed #166534", marginBottom: 6 }}>
              No companies raised yet
            </div>
          )}
        </div>

        {/* Center Clash Sparks & Battle Demarcation */}
        <div
          style={{
            zIndex: 2,
            textAlign: "center",
            paddingBottom: 6,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexShrink: 0,
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
                  background: "rgba(0,0,0,0.85)",
                  padding: "2px 8px",
                  borderRadius: 4,
                  border: "1px solid #7c2d12",
                  marginTop: 2,
                  whiteSpace: "nowrap",
                }}
              >
                {playerPower >= enemyPower ? "Advantage: Yours" : "Advantage: Enemy"}
              </div>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                background: "rgba(15, 23, 18, 0.8)",
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid #2d3748",
              }}
            >
              <span style={{ fontSize: 12 }}>🛡️</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: 0.3, whiteSpace: "nowrap" }}>
                Border Boundary
              </span>
            </div>
          )}
        </div>

        {/* Enemy Vanguard (Right Side, Facing Left toward Player) */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-end",
            gap: 10,
            zIndex: 2,
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* Enemy Companies (Real unit names and counts) */}
          {enemyUnits.length > 0 ? (
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
              {enemyUnits.map((u) => (
                <div
                  key={u.typeId}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    flexShrink: 0,
                    transform: `translateY(${-bob}px)`,
                    transition: "transform 120ms ease",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      border: "1px solid #7f1d1d",
                      borderRadius: 6,
                      overflow: "hidden",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.6)",
                      background: "#181010",
                      lineHeight: 0,
                      transform: "scaleX(-1)", // Sprite faces towards the player
                    }}
                  >
                    <UnitIcon typeId={u.typeId} size={36} culture={state ? cultureOfRealm(state, enemyRealmId) : "western"} />
                  </div>
                  <div
                    style={{
                      background: "rgba(10, 8, 6, 0.92)",
                      border: "1px solid #7f1d1d",
                      borderRadius: 4,
                      padding: "2px 6px",
                      fontSize: 10,
                      color: "#fed7aa",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      textAlign: "center",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.7)",
                      pointerEvents: "none",
                    }}
                  >
                    {u.name} ×{formatLetterSuffix(toDecimalString(u.count))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 11, opacity: 0.75, color: "#fca5a5", padding: "6px 10px", background: "rgba(10, 8, 6, 0.6)", borderRadius: 4, border: "1px dashed #7f1d1d", marginBottom: 6 }}>
              No host fielded
            </div>
          )}

          {/* Enemy Standard Bearer (Facing Left) */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 2, flexShrink: 0 }}>
            <svg width="24" height="60" viewBox="0 0 24 60" style={{ overflow: "visible" }}>
              {/* Flagpole on the right at x=18 */}
              <line x1="18" y1="4" x2="18" y2="58" stroke="#a1a1aa" strokeWidth="2" />
              {/* Pennant pointing left towards player */}
              <polygon
                points={`18,6 ${2 - bannerWave},12 18,18`}
                fill="#dc2626"
                stroke="#991b1b"
                strokeWidth="1"
              />
              <circle cx="18" cy="4" r="2.5" fill="#f87171" />
              {/* Standard Bearer Body (facing left) */}
              <rect x="14" y={32 + bob} width="8" height="12" fill="#7f1d1d" rx="1" />
              <circle cx="18" cy={26 + bob} r="4" fill="#fbcfe8" />
              <rect x="15" y={22 + bob} width="6" height="3" fill="#64748b" />
              <rect x={14 + legL} y={44 + bob} width="3" height="6" fill="#18181b" />
              <rect x={18 + legR} y={44 + bob} width="3" height="6" fill="#27272a" />
            </svg>
            <span style={{ fontSize: 9.5, color: "#fca5a5", fontWeight: 700, marginTop: 4 }}>Host</span>
          </div>
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
