import React from "react";
import {
  MARSHAL_PROMOTE_GOLD,
  canPromoteMarshal,
  marshalSkillBlurb,
  marshalSkillName,
  playerMarshal,
  tryAppointMarshal,
  tryPromoteMarshal,
  type GameState,
} from "@second-crown/sim";
import type { ActFn } from "./game/useGameEngine";

export function MarshalCard(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  const who = state ? playerMarshal(state) : undefined;
  const court = (state?.characters ?? []).filter((c) => c.realmId === "player");
  const canPromote = state ? canPromoteMarshal(state) : false;
  const rank = Math.max(1, who?.marshalRank ?? 1);

  return (
    <section className="sc-realm-card" style={{ margin: "10px 0", fontSize: 13 }}>
      <strong style={{ display: "block", marginBottom: 6 }}>Marshal</strong>
      {who ? (
        <p style={{ margin: "0 0 6px" }}>
          {who.name} · {marshalSkillName(who.marshalTree)} rank {rank}.{" "}
          {marshalSkillBlurb(who.marshalTree, rank)}
        </p>
      ) : (
        <p style={{ margin: "0 0 6px", opacity: 0.75 }}>
          No marshal. Appoint one so Line Hold, Shock Charge, or Ranged Volley fires in the same battle resolver.
        </p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {court.map((c) => (
          <React.Fragment key={c.id}>
            {(["line", "shock", "ranged"] as const).map((tree) => (
              <button
                key={`${c.id}-${tree}`}
                type="button"
                onClick={() =>
                  act((st) =>
                    tryAppointMarshal(st, c.id, tree)
                      ? `${c.name} takes ${marshalSkillName(tree)}. `
                      : "Cannot appoint that marshal."
                  )
                }
              >
                {c.name}: {marshalSkillName(tree)}
              </button>
            ))}
          </React.Fragment>
        ))}
        <button
          type="button"
          disabled={!canPromote}
          onClick={() =>
            act((st) =>
              tryPromoteMarshal(st)
                ? "Marshal promoted. Line Hold and kin scale."
                : `Need Keep II and ${MARSHAL_PROMOTE_GOLD} gold."`
            )
          }
        >
          Promote ({MARSHAL_PROMOTE_GOLD} gold, Keep II)
        </button>
      </div>
    </section>
  );
}
