import React from "react";
import {
  edgeWallCount,
  gateHp,
  gateOnRim,
  hasClosedWallRing,
  wallHp,
  type GameState,
} from "@second-crown/sim";
import { WallPip } from "./hud/WallPip";

export function WallLine(props: { state: GameState | undefined; realmId?: string; showPip?: boolean }) {
  const { state, realmId = "player", showPip = true } = props;
  if (!state) return null;
  const rim = edgeWallCount(state, realmId);
  const closed = hasClosedWallRing(state, realmId);
  const hp = wallHp(state, realmId);
  const gate = gateOnRim(state, realmId);
  const gHp = gate ? gateHp(state, realmId) : 0;
  return (
    <p style={{ fontSize: 12, opacity: 0.85, display: "inline-flex", alignItems: "center", gap: 6, margin: 0 }}>
      {showPip ? <WallPip rim={rim} closed={closed} hp={hp} gate={gate} size={20} /> : null}
      <span>
        Walls · rim {rim}/8 · ring{" "}
        <span style={{ color: closed ? "#3fb950" : "#d29922" }}>{closed ? "closed" : "open"}</span> · wall HP {hp}
        {gate ? ` · gate HP ${gHp}` : " · no gate on the rim"}.
      </span>
    </p>
  );
}
