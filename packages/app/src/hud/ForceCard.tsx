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
  // ForceLedger stacks the former sc-force-head (sc-force-title-group, sc-force-name, sc-force-eta),
  // sc-force-dest, and sc-force-btn rows; power and risk stay in ForceStatus below it.
  const etaRow = status?.find((r) => r.kind === "eta");
  const restRows = status?.filter((r) => r.kind !== "eta") ?? [];

  return (
    <div className={`sc-force-card is-${tone}`}>
      <WarLivingUnderlay tone={tone} riskTone={riskTone} moving={isMoving} loaded={loaded} empty={empty} />
      <ForceLedger
        lead={<WarChip kind={tone} size={24} loaded={loaded} empty={empty} />}
        name={name}
        captain={captain}
        dest={dest}
        detail={detail}
        seconds={seconds}
        etaRow={etaRow}
        action={action}
      />
      {status && status.length > 0 ? <ForceStatus rows={restRows} /> : null}
      <WarLivingGlyph
        tone={tone}
        riskTone={riskTone}
        moving={isMoving}
        loaded={loaded}
        empty={empty}
      />
    </div>
  );
}
