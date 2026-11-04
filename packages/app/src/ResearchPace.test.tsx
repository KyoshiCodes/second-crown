import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, RESEARCH } from "@second-crown/sim";
import { ResearchPace, activeStudy, fastPace, nextUnlock } from "./ResearchPace";

function bare() {
  const s = createGameState({ seed: 1 });
  s.buildings = [];
  for (const k of Object.keys(s.flags)) if (k.startsWith("research_")) delete s.flags[k];
  return s;
}

describe("ResearchPace", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<ResearchPace state={undefined} />)).toBe("");
  });

  it("shows base pace, idle lectern, and the first unit unlock in table order", () => {
    const s = bare();
    expect(fastPace(s)).toBe(false);
    expect(activeStudy(s)).toBeNull();
    expect(nextUnlock(s)).toEqual({ id: "fieldcraft", units: ["Ranger"] });
    const html = renderToStaticMarkup(<ResearchPace state={s} />);
    expect(html).toContain("base pace");
    expect(html).toContain("lectern idle");
    expect(html).toContain("Fieldcraft");
    expect(html).toContain(`(${Math.ceil(RESEARCH.fieldcraft.ticks / 10)}s)`);
    expect(html).toContain('data-pace="base"');
  });

  it("reads Academy pace from the sim researchDuration", () => {
    const s = bare();
    s.buildings = [{ typeId: "academy", completesAtTick: null } as (typeof s.buildings)[number]];
    expect(fastPace(s)).toBe(true);
    const html = renderToStaticMarkup(<ResearchPace state={s} />);
    expect(html).toContain("Academy pace");
    expect(html).toContain(`(${Math.ceil(Math.ceil(RESEARCH.fieldcraft.ticks * 0.8) / 10)}s)`);
  });

  it("shows the running study and skips known unlocks", () => {
    const s = bare();
    s.flags.research_fieldcraft = 1;
    s.flags.research_drill_until = s.meta.tick + 95;
    expect(activeStudy(s)).toEqual({ id: "drill", left: 95 });
    expect(nextUnlock(s)?.id).toBe("drill");
    const html = renderToStaticMarkup(<ResearchPace state={s} />);
    expect(html).toContain("Drill 10s left");
    expect(html).toContain("Banner");
    expect(html).not.toContain("Fieldcraft");
  });

  it("says every unit is unlocked when all unlock studies are known", () => {
    const s = bare();
    for (const id of Object.keys(RESEARCH)) s.flags[`research_${id}`] = 1;
    expect(nextUnlock(s)).toBeNull();
    expect(renderToStaticMarkup(<ResearchPace state={s} />)).toContain("every unit unlocked");
  });
});
