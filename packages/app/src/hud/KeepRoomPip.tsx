import React from "react";
import { BedPip, type BedPipProps } from "./BedPip";
import { WallPip, type WallPipProps } from "./WallPip";
import { AnvilPip, type AnvilPipProps } from "./AnvilPip";
import "./keep-room-pips.css";

export type KeepRoomKind = "hall" | "wall" | "yard" | "bed" | "anvil";

export interface KeepRoomPipProps {
  /** Room kind ("hall", "wall", "yard") or pip symbol ("bed", "wall", "anvil") */
  room?: "hall" | "wall" | "yard";
  kind?: "bed" | "wall" | "anvil";
  /** Size in pixels (default: 16) */
  size?: number;
  /** Whether the pip is active (e.g. occupied bed, closed wall ring, forging anvil) */
  active?: boolean;
  /** Bed-specific: housing full */
  full?: boolean;
  /** Bed-specific: wounded in infirmary */
  wounded?: boolean;
  pop?: number;
  cap?: number;
  /** Wall-specific: whether ring is closed */
  closed?: boolean;
  rim?: number;
  hp?: number;
  gate?: boolean;
  /** Anvil-specific: works count */
  count?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

export { BedPip, WallPip, AnvilPip };

/**
 * Small Living Pips for the Keep Interior Rooms & Cards:
 * - Hall room / cards: Bed living pip (cot with carved posts, linen bolster, blanket, candlelight).
 * - Wall room / cards: Wall living pip (ashlar curtain wall, battlements, gate arch, ring jewel).
 * - Yard room / cards: Anvil living pip (forged steel anvil on oak stump, hot billet, sparks).
 *
 * GUARANTEE: strictly pointer-events: none so all cards and buttons remain 100% unobstructed!
 */
export function KeepRoomPip({
  room,
  kind,
  size = 16,
  active = false,
  full,
  wounded,
  pop,
  cap,
  closed,
  rim,
  hp,
  gate,
  count,
  className = "",
  style,
  title,
}: KeepRoomPipProps) {
  const resolved: "bed" | "wall" | "anvil" =
    kind ?? (room === "wall" ? "wall" : room === "yard" ? "anvil" : "bed");

  if (resolved === "wall") {
    return (
      <WallPip
        size={size}
        closed={closed ?? active}
        rim={rim}
        hp={hp}
        gate={gate}
        className={`sc-room-pip is-wall ${className}`}
        style={style}
      />
    );
  }

  if (resolved === "anvil") {
    return (
      <AnvilPip
        size={size}
        active={active}
        count={count}
        className={`sc-room-pip is-yard ${className}`}
        style={style}
        title={title}
      />
    );
  }

  return (
    <BedPip
      size={size}
      active={active}
      full={full}
      wounded={wounded}
      pop={pop}
      cap={cap}
      className={`sc-room-pip is-hall ${className}`}
      style={style}
      title={title}
    />
  );
}
