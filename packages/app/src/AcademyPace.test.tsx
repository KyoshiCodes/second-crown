import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, RESEARCH } from "@second-crown/sim";
import { AcademyPace, academyRateOn, nextAcademyUnlock } from "./AcademyPace";

function bare() {
  const s = createGameState({ seed: 1 });
  s.buildings = [];
  for (const k of Object.keys(s.flags)) if (k.startsWith("research_")) delete s.flags[k];
  return s;
}

function withAcademy() {
  const s = bare();
  s.buildings = [{ typeId: "academy", completesAtTick: null } as (typeof s.buildings)[number]];
  return s;
}

describe("AcademyPace", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<AcademyPace state={undefined} />)).toBe("");
  });

  it("shows base rate and the first academy study at base length without an Academy", () => {
    const s = bare();
    expect(academyRateOn(s)).toBe(false);
    expect(nextAcademyUnlock(s)?.id).toBe("husbandry");
    const html = renderToStaticMarkup(<AcademyPace state={s} />);
    expect(html).toContain("no Academy, base rate");
    expect(html).toContain("Husbandry");
    expect(html).toContain(`(${Math.ceil(RESEARCH.husbandry.ticks / 10)}s)`);
    expect(html).toContain('data-academy="off"');
  });

  it("shows the Academy rate from the sim when an Academy is finished", () => {
    const s = withAcademy();
    expect(academyRateOn(s)).toBe(true);
    const html = renderToStaticMarkup(<AcademyPace state={s} />);
    expect(html).toContain("new studies 20% shorter");
    expect(html).toContain(`(${Math.ceil(Math.ceil(RESEARCH.husbandry.ticks * 0.8) / 10)}s)`);
    expect(html).toContain('data-academy="on"');
  });

  it("skips known studies and studies the Academy cannot open, and shows the keep gate", () => {
    const s = withAcademy();
    for (const id of ["husbandry", "forestry", "masonry"]) s.flags[`research_${id}`] = 1;
    const next = nextAcademyUnlock(s);
    expect(next?.id).toBe("logistics");
    expect(next?.keepReady).toBe(false);
    const html = renderToStaticMarkup(<AcademyPace state={s} />);
    expect(html).toContain("Logistics");
    expect(html).toContain("needs Keep II");
  });

  it("says every academy study is known when only non-academy studies remain", () => {
    const s = withAcademy();
    for (const id of Object.keys(RESEARCH)) if (id !== "siege") s.flags[`research_${id}`] = 1;
    expect(nextAcademyUnlock(s)).toBeNull();
    expect(renderToStaticMarkup(<AcademyPace state={s} />)).toContain("every academy study known");
  });
});
