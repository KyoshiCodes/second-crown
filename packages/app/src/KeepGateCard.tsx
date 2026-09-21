import React from "react";
import { KEEP_GATES, type KeepGateRow } from "@second-crown/sim";

export function KeepGateCard(props: {
  gate: KeepGateRow;
  keepLv: number;
  beds: number;
  pop: number;
  plots: number;
  plotCap: number;
}) {
  const { gate, keepLv, beds, pop, plots, plotCap } = props;
  return (
    <div
      className="sc-keep-charter"
      style={{
        fontSize: 12,
        margin: "8px 0 12px",
        padding: "10px 12px",
        background: "linear-gradient(180deg, #241810 0%, #16110d 100%)",
        border: "1px solid #6b4e24",
        borderRadius: 8,
        boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <strong style={{ color: "#fcd34d", fontSize: 14 }}>
          Keep Charter · {keepLv ? `Keep ${keepLv}` : "No Keep"}
        </strong>
        <span style={{ opacity: 0.8 }}>
          People {pop}/{beds} · Plots {plots}/{plotCap}
        </span>
      </div>
      <p style={{ margin: "6px 0 8px", opacity: 0.85 }}>{gate.note} {gate.marshal}</p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 520 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#c9a227" }}>
              <th style={th}>Keep</th>
              <th style={th}>Works</th>
              <th style={th}>Beds</th>
              <th style={th}>Plots</th>
              <th style={th}>Queue</th>
              <th style={th}>Stores</th>
              <th style={th}>Columns</th>
              <th style={th}>Marshal</th>
            </tr>
          </thead>
          <tbody>
            {KEEP_GATES.map((row) => {
              const on = row.keep === gate.keep;
              return (
                <tr
                  key={row.keep}
                  style={{
                    background: on ? "rgba(201,162,39,0.14)" : "transparent",
                    color: on ? "#fef3c7" : "#c4b8a4",
                  }}
                >
                  <td style={td}>{row.keep || "—"}</td>
                  <td style={td}>lv {row.otherCap}</td>
                  <td style={td}>{row.bedBase}+</td>
                  <td style={td}>{row.plotBase}+</td>
                  <td style={td}>{row.trainCap} · ×{row.trainSpeed}</td>
                  <td style={td}>×{row.storeMult}</td>
                  <td style={td}>{row.marchCap}</td>
                  <td style={td}>{row.keep >= 2 ? "Rank 2" : "Rank 1"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 11, opacity: 0.65 }}>
        + on beds/plots is cottage levels. Raising the Keep is the only way the rest of the table moves.
      </p>
    </div>
  );
}

const th: React.CSSProperties = { padding: "4px 6px", fontWeight: 600, borderBottom: "1px solid #3a3228" };
const td: React.CSSProperties = { padding: "4px 6px", borderBottom: "1px solid #2a221c", whiteSpace: "nowrap" };
