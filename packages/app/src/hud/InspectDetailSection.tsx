import React from "react";
import {
  inspectDetailSnapshot,
  type GameState,
  type InspectDetail,
} from "@second-crown/sim";
import "./inspect-detail.css";

/**
 * Defensive pure reader over `@second-crown/sim`'s `inspectDetailSnapshot(state, provinceId)`.
 * Returns `null` for partial state, missing id, or when `living_inspect_detail` is off.
 */
export function resolveInspectDetail(
  state: GameState | null | undefined,
  provinceId: string | null | undefined,
): InspectDetail | null {
  if (
    !provinceId ||
    !state?.board?.provinces ||
    !state.flags ||
    !state.meta
  ) {
    return null;
  }
  try {
    return inspectDetailSnapshot(state, provinceId);
  } catch {
    return null;
  }
}

function ownerTag(state: GameState, ownerRealmId: string | null): string {
  if (!ownerRealmId) return "unclaimed";
  if (ownerRealmId === "player") return "yours";
  return state.realms?.find((r) => r.id === ownerRealmId)?.name ?? ownerRealmId;
}

/**
 * Quiet stock / outpost / march & note section for a seen inspected province,
 * powered by `inspectDetailSnapshot(state, provinceId)`. Hides cleanly when null or empty.
 */
export const InspectDetailSection: React.FC<{
  state: GameState | undefined;
  provinceId: string | null | undefined;
}> = ({ state, provinceId }) => {
  const snap = resolveInspectDetail(state, provinceId);
  if (!snap || !state) return null;

  const hasContent =
    Boolean(snap.stock) ||
    snap.outposts.length > 0 ||
    snap.marches.length > 0 ||
    snap.notes.length > 0;
  if (!hasContent) return null;

  const stockPct =
    snap.stock && snap.stock.max > 0
      ? Math.max(0, Math.min(100, Math.round((snap.stock.have / snap.stock.max) * 100)))
      : 0;

  return (
    <section
      className="sc-inspect-group sc-inspect-detail-section"
      data-inspect-detail-id={snap.id}
    >
      <div className="sc-inspect-group-head sc-inspect-detail-head">
        <span className="sc-inspect-detail-pip" aria-hidden="true" />
        <span>Detail</span>
      </div>

      {snap.stock ? (
        <div
          className="sc-inspect-detail-row"
          data-inspect-stock-res={snap.stock.resource}
        >
          <span className="sc-inspect-detail-label">Stock</span>
          <span>
            {snap.stock.resource} {snap.stock.have}/{snap.stock.max}
          </span>
          <span className="sc-inspect-stock-bar" aria-hidden="true">
            <span
              className="sc-inspect-stock-fill"
              style={{ width: `${stockPct}%` }}
            />
          </span>
        </div>
      ) : null}

      {snap.outposts.length > 0 ? (
        <div
          className="sc-inspect-detail-row"
          data-inspect-outposts={snap.outposts.length}
        >
          <span className="sc-inspect-detail-label">Outposts</span>
          <span className="sc-inspect-detail-chips">
            {snap.outposts.map((o) => (
              <span key={o.id} className="sc-inspect-detail-chip">
                {o.x},{o.y} ({ownerTag(state, o.ownerRealmId)})
              </span>
            ))}
          </span>
        </div>
      ) : null}

      {snap.marches.length > 0 ? (
        <div
          className="sc-inspect-detail-row"
          data-inspect-marches={snap.marches.length}
        >
          <span className="sc-inspect-detail-label">Marches</span>
          <span className="sc-inspect-detail-chips">
            {snap.marches.map((m) => (
              <span
                key={m.id}
                className="sc-inspect-detail-chip"
                data-inspect-march-id={m.id}
              >
                {m.kind} ~{Math.max(0, Math.ceil(m.eta / 10))}s ({m.eta}t)
              </span>
            ))}
          </span>
        </div>
      ) : null}

      {snap.notes.length > 0 ? (
        <ul className="sc-inspect-detail-notes">
          {snap.notes.map((note, idx) => (
            <li key={`${idx}-${note}`}>{note}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
};
