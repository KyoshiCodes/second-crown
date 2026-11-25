import React from "react";
import type { GameState } from "@second-crown/sim";
import { LedgerCard } from "./hud/LedgerCard";
import { Fold } from "./hud/Fold";
import {
  getSaveAuditSnapshot,
  listLedgerWithSaveAudit,
  subscribeSaveAudit,
} from "./save";
import "./hud/ledger-card.css";

export function LedgerPanel(props: { state: GameState | undefined }) {
  const audit = React.useSyncExternalStore(
    subscribeSaveAudit,
    getSaveAuditSnapshot,
    getSaveAuditSnapshot
  );
  const rows = listLedgerWithSaveAudit(props.state, audit);
  return (
    <Fold id="crown-ledger" noisy title="Ledger of Crowns" summary={ledgerSummary(rows)}>
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
    </Fold>
  );
}

/** Title-bar line for the folded ledger: count plus the newest entry. Exported for tests. */
export function ledgerSummary(rows: ReadonlyArray<{ text: string }>): string {
  if (rows.length === 0) return "No entries yet";
  const count = `${rows.length} ${rows.length === 1 ? "entry" : "entries"}`;
  const newest = rows[0].text.trim();
  const preview = newest.length > 48 ? `${newest.slice(0, 47)}…` : newest;
  return preview ? `${count} · ${preview}` : count;
}

export { LedgerCard };
