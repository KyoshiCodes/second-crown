import React from "react";
import type { GameState } from "@second-crown/sim";
import { realmPower, playerTitle } from "@second-crown/sim";
import { Crest } from "./Crest";
import { crestFor } from "./crests";
import { getRealmFlavor } from "./content/flavor";

export function WorldPanel(props: {
  state: GameState | undefined;
  onFoundGuild: () => void;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onGift?: (realmId: string) => void;
}) {
  const state = props.state;
  if (!state) return null;
  const title = playerTitle(state);
  const playerFlavor = getRealmFlavor("player");
  const playerCrest = crestFor("player");
  const others = state.realms.filter((r) => r.id !== "player");

  return (
    <div className="sc-world-view" style={{ margin: "14px 0" }}>
      {/* Player Sovereign Banner */}
      <div className="sc-player-banner">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <Crest realmId="player" size={44} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <strong style={{ fontSize: 16, color: "#fcd34d" }}>Your Crown</strong>
              <span className="sc-rank-badge">{title}</span>
              <span className="sc-charge-pill" title={playerCrest.chargeDesc}>
                🛡 {playerFlavor.chargeName}
              </span>
            </div>
            <p className="sc-realm-blurb" style={{ margin: "8px 0 0", fontStyle: "italic", fontSize: 12.5, lineHeight: 1.5, opacity: 0.9 }}>
              {playerFlavor.blurb}
            </p>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: 15, margin: "20px 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
        <span>Known Crowns & Dynasties</span>
        <span style={{ fontSize: 12, opacity: 0.6, fontWeight: 400 }}>({others.length} realms)</span>
      </h3>

      <div className="sc-realms-list">
        {others.map((r) => {
          const ruler = state.characters.find((c) => c.id === r.rulerId);
          const op =
            state.opinions.find((o) => o.from === r.rulerId && o.to === "char_player")?.value ?? 0;
          const flavor = getRealmFlavor(r.id);
          const crest = crestFor(r.id);
          const power = realmPower(state, r.id);

          let opLabel = "Neutral";
          let opClass = "op-neutral";
          if (op >= 20) {
            opLabel = "Friendly";
            opClass = "op-friendly";
          } else if (op <= -40) {
            opLabel = "Hostile";
            opClass = "op-hostile";
          }

          return (
            <div key={r.id} className="sc-realm-card">
              <div className="sc-realm-card-header">
                <Crest realmId={r.id} size={38} />
                <div style={{ flex: 1 }}>
                  <div className="sc-realm-name-row">
                    <strong style={{ fontSize: 15 }}>{r.name}</strong>
                    <span className="sc-ruler-title">
                      {flavor.title} · {ruler?.name ?? flavor.rulerName}
                    </span>
                    <span className="sc-charge-pill" title={crest.chargeDesc}>
                      🛡 {flavor.chargeName}
                    </span>
                  </div>
                  <div className="sc-realm-meta">
                    <span>Era: <strong>{r.era}</strong></span>
                    <span>·</span>
                    <span>Lifestyle: <strong>{r.lifestyle}</strong></span>
                    <span>·</span>
                    <span>Power: <strong>{power}</strong></span>
                    <span>·</span>
                    <span className={`sc-op-tag ${opClass}`}>
                      Opinion: {op > 0 ? `+${op}` : op} ({opLabel})
                    </span>
                  </div>
                </div>
              </div>

              <div className="sc-realm-body">
                <p className="sc-realm-blurb">{flavor.blurb}</p>
                <div className="sc-realm-taunt">
                  <span style={{ opacity: 0.6 }}>War Cry:</span> <em>"{flavor.warTaunt}"</em>
                </div>
              </div>

              {props.onGift ? (
                <div className="sc-realm-actions">
                  <button
                    type="button"
                    className="sc-btn sc-btn-gift"
                    onClick={() => props.onGift?.(r.id)}
                  >
                    Send 15 Gold Tribute to {ruler?.name ?? r.name}
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <h3 style={{ fontSize: 15, margin: "24px 0 10px" }}>Factions & Compacts</h3>
      <div className="sc-factions-list">
        {(state.factions ?? []).map((f) => {
          const mine = f.memberRealmIds.includes("player");
          return (
            <div key={f.id} className={`sc-faction-card ${mine ? "sc-faction-member" : ""}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <strong>{f.name}</strong> <span style={{ opacity: 0.65, fontSize: 12 }}>({f.kind})</span>
                  <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                    Stance: <strong>{f.stance}</strong>
                    {mine ? " · (You are a sworn member)" : ""}
                    {f.stance < 0 ? " · (Souring)" : ""}
                  </div>
                </div>
                <div>
                  {mine ? (
                    <button type="button" className="sc-btn sc-btn-danger" onClick={() => props.onLeave(f.id)}>
                      Renounce Oath (Leave)
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="sc-btn"
                      onClick={() => props.onJoin(f.id)}
                      disabled={f.stance < -10}
                    >
                      Swear Oath (Join)
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!state.factions?.some((f) => f.leaderRealmId === "player") && (
        <div style={{ marginTop: 14 }}>
          <button type="button" className="sc-btn sc-btn-primary" onClick={props.onFoundGuild}>
            Found Your Royal Guild
          </button>
        </div>
      )}
    </div>
  );
}

