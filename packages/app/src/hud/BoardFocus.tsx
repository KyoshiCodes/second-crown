import "./board-focus.css";

/**
 * Board presence: a soft edge frame and a small "Board focus" tag laid over the
 * board viewport while the camera is on Board. Pure decoration: pointer-events
 * none, no camera or hit-test involvement. Sizing lives in board-focus.css.
 */
export function BoardFocusFrame({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <>
      <div className="sc-board-focus-edge" aria-hidden="true" />
      <div className="sc-board-focus-tag" aria-hidden="true">
        <span className="sc-board-focus-dot" />
        Board focus
      </div>
    </>
  );
}
