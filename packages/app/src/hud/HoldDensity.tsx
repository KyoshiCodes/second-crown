import "./hold-density.css";

type Band = "hold" | "board";

/**
 * Hold density pass. Two small pieces, styled in hold-density.css:
 *
 * - BandToggle: the Hold / Board switch as a two-segment pill. Both modes are
 *   always named; the live one is lit (green for Hold, gold for Board). It is
 *   still one button that calls the same toggle, so camera code is untouched.
 * - HoldFocusTag: a small "Hold" pill over the canvas on the Hold band, the
 *   twin of Board's "Board focus" tag. Decoration only, pointer-events none.
 */
export function BandToggle({ band, onToggle }: { band: Band; onToggle: () => void }) {
  const next = band === "hold" ? "Board" : "Hold";
  return (
    <button
      type="button"
      className="sc-band-toggle"
      data-band={band}
      onClick={onToggle}
      title={`Camera on ${band === "hold" ? "Hold" : "Board"}. Switch to ${next}`}
      aria-label={`Camera on ${band === "hold" ? "Hold" : "Board"}. Switch to ${next}`}
    >
      <span className={`sc-band-seg is-hold ${band === "hold" ? "is-on" : ""}`} aria-hidden="true">
        🏰 Hold
      </span>
      <span className={`sc-band-seg is-board ${band === "board" ? "is-on" : ""}`} aria-hidden="true">
        🗺️ Board
      </span>
    </button>
  );
}

export function HoldFocusTag({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="sc-hold-focus-tag" aria-hidden="true">
      <span className="sc-hold-focus-dot" />
      Hold
    </div>
  );
}
