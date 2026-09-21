import React from "react";
import { listLedger, type GameState } from "@second-crown/sim";

export function LedgerPanel(props: { state: GameState | undefined }) {
  const rows = props.state ? listLedger(props.state) : [];
  return (
    <>
      <h3>Ledger of Crowns</h3>
      {rows.length === 0 ? (
        <p style={{ fontSize: 13 }}>No entries yet. Fight a war or appoint a marshal.</p>
      ) : (
        <ul style={{ fontSize: 13, paddingLeft: 18 }}>
          {rows.map((r, i) => (
            <li key={`${r.tick}-${r.kind}-${i}`}>
              <span style={{ opacity: 0.55 }}>t{r.tick}</span> {r.text}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
