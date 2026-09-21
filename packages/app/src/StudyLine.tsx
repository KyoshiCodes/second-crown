import React from "react";
import {
  RESEARCH,
  researchDone,
  researchTicksLeft,
  type GameState,
} from "@second-crown/sim";

const YIELD: Partial<Record<keyof typeof RESEARCH, string>> = {
  husbandry: "+12% food",
  forestry: "+12% wood",
  masonry: "+12% stone",
  logistics: "+8% gold, +50 store, +1 column",
};

export function StudyLine(props: { state: GameState | undefined }) {
  const { state } = props;
  if (!state) return null;
  const ids = Object.keys(RESEARCH) as (keyof typeof RESEARCH)[];
  const open = ids.find((id) => researchTicksLeft(state, id) > 0);
  const known = ids.filter((id) => researchDone(state, id));
  const boosts = known.map((id) => YIELD[id]).filter(Boolean);
  return (
    <p style={{ fontSize: 12, opacity: 0.8 }}>
      Studies {open ? `· ${RESEARCH[open].name} ${Math.ceil(researchTicksLeft(state, open) / 10)}s left on Crown` : "· lectern idle on Crown"}.
      {known.length > 0 ? ` Known: ${known.map((id) => RESEARCH[id].name).join(", ")}.` : ""}
      {boosts.length > 0 ? ` ${boosts.join("; ")}.` : ""}
    </p>
  );
}
