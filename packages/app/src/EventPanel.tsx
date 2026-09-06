import React from "react";
import type { GameState, WorldEvent } from "@second-crown/sim";
import { formatLetterSuffix } from "@second-crown/sim";
import { miraRemark } from "./content/mira";

export function EventPanel(props: {
  lastEvent: string;
  lastEventTick: number;
  log: WorldEvent[];
  state?: GameState;
}) {
  const mira = miraRemark(props.state, props.lastEvent);
  return (
    <div
      style={{
        background: "#1c2128",
        border: "1px solid #30363d",
        borderRadius: 8,
        padding: "12px 14px",
        marginBottom: 14,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.55, marginBottom: 4 }}>Latest event</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#e3b341" }}>
        {props.lastEvent || "Nothing yet — events fire every 500 ticks (~50s)."}
      </div>
      {props.lastEventTick > 0 && (
        <div style={{ fontSize: 12, opacity: 0.55, marginTop: 4 }}>
          Tick {formatLetterSuffix(props.lastEventTick)}
        </div>
      )}
      <div style={{ marginTop: 10, fontSize: 13, color: "#c4b5fd", borderLeft: "2px solid #7c3aed", paddingLeft: 10 }}>
        <div style={{ fontSize: 11, opacity: 0.7 }}>Advisor Mira</div>
        <em>{mira}</em>
      </div>
      {props.log.length > 1 && (
        <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 13, opacity: 0.8 }}>
          {props.log
            .slice()
            .reverse()
            .map((e) => (
              <li key={`${e.tick}-${e.id}`}>
                <span style={{ opacity: 0.5 }}>t{e.tick}</span> {e.text}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
