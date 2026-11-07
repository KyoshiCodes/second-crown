import React from "react";
import { WarChip } from "./WarChip";
import { ForceStatus, type ForceStatusRow } from "./ForceStatus";
import { ForceLedger } from "./ForceLedger";
import { WarLivingGlyph, WarLivingUnderlay } from "./WarLivingGlyph";
import "./force-card.css";

export type ForceTone = "hostile" | "scout" | "gather" | "garrison";

export function ForceCard(props: {
  tone: ForceTone;
  name: string;
  dest: string;
  seconds?: number;
  detail?: string;
  captain?: string;
  action?: { label: string; disabled?: boolean; onClick: () => void };
  loaded?: boolean;
  empty?: boolean;
  status?: ForceStatusRow[];
}) {
  const { tone, name, dest, seconds, detail, captain, action, loaded, empty, status } = props;
  const isMoving = seconds !== undefined;
  const riskRow = status?.find((r) => r.kind === "risk");
  const riskTone = riskRow?.tone;
  // The ETA lives in the ledger now; power and risk stay in the status rows below it.
  const etaRow = status?.find((r) => r.kind === "eta");
  const restRows = status?.filter((r) => r.kind !== "eta") ?? [];

  return (
    <div className={`sc-force-card is-${tone}`}>
      <WarLivingUnderlay tone={tone} riskTone={riskTone} moving={isMoving} />
      <ForceLedger
        lead={<WarChip kind={tone} size={22} loaded={loaded} empty={empty} />}
        name={name}
        captain={captain}
        dest={dest}
        detail={detail}
        seconds={seconds}
        etaRow={etaRow}
        action={action}
      />
      {status && status.length > 0 ? (
        <>
          <ForceStatus rows={restRows} />
          <WarLivingGlyph
            tone={tone}
            riskTone={riskTone}
            moving={isMoving}
            loaded={loaded}
            empty={empty}
          />
        </>
      ) : null}
    </div>
  );
}
