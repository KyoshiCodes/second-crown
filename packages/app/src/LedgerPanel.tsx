import React from "react";
import { listLedger, type GameState } from "@second-crown/sim";
import { LedgerCard } from "./hud/LedgerCard";
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
            <LedgerCard
              key={`${r.tick}-${r.kind}-${i}`}
              tick={r.tick}
              text={r.text}
              kind={r.kind}
            />
          ))}
        </ul>
      )}
    </>
  );
}

export { LedgerCard };
