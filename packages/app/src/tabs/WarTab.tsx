import React from "react";
import type { GameState } from "@second-crown/sim";
import { WarRoom } from "../WarRoom";
import type { BattleSnap } from "../BattleVisual";
import type { ActFn } from "../game/useGameEngine";

export function WarTab(props: {
  state: GameState | undefined;
  act: ActFn;
  rivalOp: number;
  playerOp: number;
  battleSnap: BattleSnap | null;
  setBattleSnap: (snap: BattleSnap | null) => void;
}) {
  return <WarRoom {...props} />;
}
