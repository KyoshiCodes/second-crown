import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, listUnitTypes, trainDurationTicks } from "@second-crown/sim";
import { TrainingPace, nextUnitUnlock, trainingPace, PACE_COUNT } from "./TrainingPace";

function bare() {
  const s = createGameState({ seed: 1 });
  s.buildings = [];
  for (const k of Object.keys(s.flags)) if (k.startsWith("research_")) delete s.flags[k];
  return s;
}

function withBarracks(n: number) {
  const s = bare();
  s.buildings = Array.from({ length: n }, () => ({ typeId: "barracks", completesAtTick: null }) as (typeof s.buildings)[number]);
  return s;
}

const militiaBase = listUnitTypes().find((u) => u.id === "militia")!.trainTicks * PACE_COUNT;

describe("TrainingPace", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<TrainingPace state={undefined} />)).toBe("");
  });

  it("shows base rate and the first locked unit with no barracks or studies", () => {
    const s = bare();
    expect(trainingPace(s)).toEqual({ now: militiaBase, base: militiaBase });
    expect(nextUnitUnlock(s)?.id).toBe("banner");
    const html = renderToStaticMarkup(<TrainingPace state={s} />);
    expect(html).toContain(`${PACE_COUNT} militia in ${Math.ceil(militiaBase / 10)}s`);
    expect(html).toContain("(base rate)");
    expect(html).toContain("Banner");
    expect(html).toContain("Study Drill on Crown");
    expect(html).toContain('data-training="base"');
  });

  it("shows the faster sim time when barracks speed drilling", () => {
    const s = withBarracks(2);
    const now = trainDurationTicks(s, "militia", PACE_COUNT);
    expect(now).toBeLessThan(militiaBase);
    const html = renderToStaticMarkup(<TrainingPace state={s} />);
    expect(html).toContain(`${PACE_COUNT} militia in ${Math.ceil(now / 10)}s`);
    expect(html).toContain(`(base ${Math.ceil(militiaBase / 10)}s)`);
    expect(html).toContain('data-training="fast"');
  });

  it("skips units already opened by a study", () => {
    const s = bare();
    s.flags.research_drill = 1;
    expect(nextUnitUnlock(s)?.id).toBe("warden");
  });

  it("says every unit is unlocked when all studies are done", () => {
    const s = bare();
    for (const id of ["horse", "siege", "fieldcraft", "drill", "screening"]) s.flags[`research_${id}`] = 1;
    expect(nextUnitUnlock(s)).toBeNull();
    expect(renderToStaticMarkup(<TrainingPace state={s} />)).toContain("every unit unlocked");
  });
});
