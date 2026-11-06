import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { armyMouths, createGameState, upkeepPerTick } from "@second-crown/sim";
import { UpkeepPace, nextUpkeepChange } from "./UpkeepPace";

function bare() {
  const s = createGameState({ seed: 1 });
  delete s.flags.training_json;
  delete s.flags.heal_json;
  return s;
}

function job(doneTick: number, count: number, typeId = "militia") {
  return { id: `j${doneTick}`, realmId: "player", typeId, count, startedTick: 0, doneTick, paid: {} };
}

describe("UpkeepPace", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<UpkeepPace state={undefined} />)).toBe("");
  });

  it("shows the sim rate and no change when nothing is queued", () => {
    const s = bare();
    expect(nextUpkeepChange(s)).toBeNull();
    const html = renderToStaticMarkup(<UpkeepPace state={s} />);
    expect(html).toContain(`${upkeepPerTick(s).toFixed(2)} food/tick`);
    expect(html).toContain(`${armyMouths(s)} mouths`);
    expect(html).toContain("no change queued");
    expect(html).toContain('data-upkeep="steady"');
  });

  it("names the earliest training job as the next change", () => {
    const s = bare();
    const t = s.meta.tick;
    s.flags.training_json = JSON.stringify([job(t + 200, 5, "archer"), job(t + 120, 10)]);
    expect(nextUpkeepChange(s)).toEqual({ ticks: 120, mouths: 10, typeId: "militia", source: "training" });
    const html = renderToStaticMarkup(<UpkeepPace state={s} />);
    expect(html).toContain("next change in <strong>12s</strong>: +10 militia from the barracks");
    expect(html).toContain('data-upkeep="rising"');
  });

  it("picks a healed wounded when it lands first", () => {
    const s = bare();
    const t = s.meta.tick;
    s.flags.training_json = JSON.stringify([job(t + 300, 10)]);
    s.flags.heal_json = JSON.stringify([{ doneTick: t + 50 }]);
    expect(nextUpkeepChange(s)).toEqual({ ticks: 50, mouths: 1, typeId: "militia", source: "healing" });
    expect(renderToStaticMarkup(<UpkeepPace state={s} />)).toContain("+1 militia from the infirmary");
  });

  it("ignores other realms' training", () => {
    const s = bare();
    s.flags.training_json = JSON.stringify([{ ...job(s.meta.tick + 10, 4), realmId: "rival" }]);
    expect(nextUpkeepChange(s)).toBeNull();
  });
});
