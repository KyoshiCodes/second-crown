import React from "react";
import {
  D,
  ascendThreshold,
  canAscend,
  formatLetterSuffix,
  toDecimalString,
  tryAscend,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";
import { AgeGlyphPip } from "./AgeLine";
import { sharedRealmId } from "./game/settleOnLoad";
import "./prestige-line.css";

export interface PrestigeStatus {
  /** Current age: `flags.prestige_level` in the save. */
  dawn: number;
  /** Total resources held now, as a decimal string (display only). */
  have: string;
  /** The sim's `ascendThreshold`: total resources needed for the next age. */
  need: number;
  /** Whole percent of the way there, 0..100. Reads 100 only when the sim says ready. */
  percent: number;
  /** The sim's `canAscend`. The only thing that shows the button. */
  ready: boolean;
  /** A shared hold has no Second Dawn. */
  shared: boolean;
}

/**
 * Reads the sim's prestige helpers and adds a progress figure. No rules here: `ready` is the sim's
 * `canAscend` and `need` is the sim's `ascendThreshold`. The total is the same sum `canAscend`
 * makes (every stored resource added together); the sim does not export it, so it is summed here
 * for display only. PrestigeLine.test.tsx checks the percent against `canAscend`.
 */
export function prestigeStatus(state: GameState): PrestigeStatus {
  const need = ascendThreshold(state);
  let total = D(0);
  for (const v of Object.values(state.resources)) {
    total = total.add(D(v ?? "0"));
  }
  const shared = sharedRealmId(state) !== null;
  const ready = !shared && canAscend(state);
  const raw = Math.floor(total.div(need).toNumber() * 100);
  const safe = Number.isFinite(raw) ? Math.max(0, raw) : 0;
  return {
    dawn: Number(state.flags["prestige_level"] ?? 0),
    have: toDecimalString(total),
    need,
    percent: ready ? 100 : Math.min(99, safe),
    ready,
    shared,
  };
}

export interface PrestigeLineViewProps {
  status: PrestigeStatus;
  /** True after the first press of Ascend: the line asks for a second press. */
  armed: boolean;
  onArm: () => void;
  onCancel: () => void;
  onAscend: () => void;
}

/** The line itself. No hooks, so tests can call it directly. */
export function PrestigeLineView(props: PrestigeLineViewProps) {
  const { status: s, armed, onArm, onCancel, onAscend } = props;
  const stateClass = s.shared ? " is-shared" : s.ready ? " is-ready" : " is-waiting";
  const asking = s.ready && armed;
  return (
    <div
      className={`sc-prestige-line${stateClass}${asking ? " is-armed" : ""}`}
      data-dawn={s.dawn}
      data-ready={s.ready ? "true" : "false"}
      data-percent={s.percent}
    >
      <AgeGlyphPip dawn={s.dawn} ready={s.ready} shared={s.shared} />
      <span className="sc-prestige-text">
        Age · <strong>Dawn {s.dawn}</strong> ·{" "}
        {s.shared
          ? "a shared hold has no Second Dawn."
          : asking
            ? "ascend now? Buildings, troops and stores start over. Your dawn bonus is kept."
            : `${formatLetterSuffix(s.have)} / ${formatLetterSuffix(s.need)} total resources (${s.percent}%) · ${
                s.ready ? `ready for Dawn ${s.dawn + 1}` : "not ready yet"
              }`}
      </span>
      {s.shared ? null : (
        <span
          className="sc-prestige-bar"
          role="progressbar"
          aria-label="Progress to the next age"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={s.percent}
        >
          <span className="sc-prestige-bar-fill" style={{ width: `${s.percent}%` }} />
        </span>
      )}
      {s.ready && !armed ? (
        <button type="button" className="sc-work-btn sc-prestige-btn" onClick={onArm}>
          Ascend
        </button>
      ) : null}
      {asking ? (
        <>
          <button type="button" className="sc-work-btn sc-prestige-btn sc-prestige-confirm" onClick={onAscend}>
            Confirm ascend
          </button>
          <button type="button" className="sc-work-btn sc-prestige-btn sc-prestige-cancel" onClick={onCancel}>
            Cancel
          </button>
        </>
      ) : null}
    </div>
  );
}

/**
 * Kingdom-tab age line: current age, progress to the next one, and an Ascend button when the sim
 * says the crown is ready. Ascending wipes the run, so the button asks for a second press. The
 * confirm runs the same sim call as the Crown tab's Second Dawn card (`tryAscend`).
 */
export function PrestigeLine(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  const [armed, setArmed] = React.useState(false);
  if (!state) return null;
  const status = prestigeStatus(state);
  return (
    <PrestigeLineView
      status={status}
      armed={armed}
      onArm={() => setArmed(true)}
      onCancel={() => setArmed(false)}
      onAscend={() => {
        setArmed(false);
        act((st) => (tryAscend(st) ? "Ascended. Pick a doctrine." : "Not ready."));
      }}
    />
  );
}
