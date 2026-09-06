import React from "react";
import type { GameState } from "@second-crown/sim";
import { realmPower, playerTitle } from "@second-crown/sim";
import { Crest } from "./Crest";

export function WorldPanel(props: {
  state: GameState | undefined;
  onFoundGuild: () => void;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
}) {
  const state = props.state;
  if (!state) return null;
  const title = playerTitle(state);
  const others = state.realms.filter((r) => r.id !== "player");

  return (
    <div style={{ margin: "12px 0" }}>
      <div style={{ fontSize: 13, marginBottom: 8 }}>
        <Crest realmId="player" /> Your rank: <strong>{title}</strong>
      </div>
      <h3 style={{ fontSize: 14, margin: "12px 0 6px" }}>Other Crowns</h3>
      <ul style={{ fontSize: 13, paddingLeft: 18 }}>
        {others.map((r) => {
          const ruler = state.characters.find((c) => c.id === r.rulerId);
          const op =
            state.opinions.find((o) => o.from === r.rulerId && o.to === "char_player")?.value ?? 0;
          return (
            <li key={r.id} style={{ marginBottom: 8, listStyle: "none", marginLeft: -18 }}>
              <Crest realmId={r.id} />
              <strong>{r.name}</strong> — {ruler?.name}
              <div style={{ opacity: 0.7, fontSize: 12, marginLeft: 34 }}>
                {r.era} · {r.lifestyle} · power {realmPower(state, r.id)} · opinion {op}
              </div>
            </li>
          );
        })}
      </ul>
      <h3 style={{ fontSize: 14, margin: "12px 0 6px" }}>Factions</h3>
      <ul style={{ fontSize: 13, paddingLeft: 18 }}>
        {(state.factions ?? []).map((f) => {
          const mine = f.memberRealmIds.includes("player");
          return (
            <li key={f.id} style={{ marginBottom: 8 }}>
              <strong>{f.name}</strong> ({f.kind}) stance {f.stance}
              {mine ? " · you are a member" : ""}
              <div>
                {mine ? (
                  <button type="button" onClick={() => props.onLeave(f.id)}>
                    Leave
                  </button>
                ) : (
                  <button type="button" onClick={() => props.onJoin(f.id)} disabled={f.stance < -10}>
                    Join
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {!state.factions?.some((f) => f.leaderRealmId === "player") && (
        <button type="button" onClick={props.onFoundGuild}>
          Found Your Guild
        </button>
      )}
    </div>
  );
}
