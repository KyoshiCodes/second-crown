import React from "react";
import { listLedger, type GameState } from "@second-crown/sim";
import "./hud/ledger-card.css";

export function LedgerPanel(props: { state: GameState | undefined }) {
  const rows = props.state ? listLedger(props.state) : [];
  return (
    <>
      <h3>Ledger of Crowns</h3>
      {rows.length === 0 ? (
        <p className="sc-ledger-card-empty">No entries yet. Fight a war or appoint a marshal.</p>
      ) : (
        <ul className="sc-ledger-card-list">
          {rows.map((r, i) => (
            <li key={`${r.tick}-${r.kind}-${i}`} className="sc-ledger-card">
              <span className="sc-ledger-card-time">t{r.tick}</span>
              <span className="sc-ledger-card-text">{r.text}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
