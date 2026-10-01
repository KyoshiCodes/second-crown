import React from "react";
import { type HolidayId, getHolidayMeta, detectCurrentHoliday } from "../seasons/holidays";

export interface HolidayPipProps {
  /** The holiday id, or "auto" */
  holiday?: string;
  /** Size in pixels (default: 16) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 16px Holiday Pip:
 * - Displays the established holiday emblem (🎃 All Hallows, 🎄 Midwinter, 🪺 Dawn Feast, 🌕 Harvest Moon, ☀️ Midsummer, ⚔️ Common Days).
 * - Strictly pointer-events: none.
 */
export function HolidayPip({
  holiday,
  size = 16,
  className = "",
  style,
}: HolidayPipProps) {
  const hId: HolidayId =
    !holiday || holiday === "auto"
      ? detectCurrentHoliday()
      : (holiday as HolidayId);
  const meta = getHolidayMeta(hId);

  return (
    <span
      className={`sc-holiday-pip ${className}`}
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.max(11, size - 2),
        lineHeight: 1,
        pointerEvents: "none",
        userSelect: "none",
        flexShrink: 0,
        verticalAlign: "middle",
        ...style,
      }}
      aria-hidden="true"
      data-holiday-pip
      data-holiday={meta.id}
      title={meta.name}
    >
      {meta.propEmoji}
    </span>
  );
}
