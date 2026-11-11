import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AUTO_HEAL_EVERY, createCitizen, createGameState, tryAssignCitizen } from "@second-crown/sim";
import { InfirmaryHealLine, infirmaryHeal } from "./InfirmaryHealLine";

function hold(opts: { infirmary?: boolean; staffed?: boolean; wounded?: number }) {
  const s = createGameState({ seed: 1 });
  if (opts.infirmary ?? true) {
    s.buildings.push({ id: "inf", typeId: "infirmary", realmId: "player", x: 2, y: 2, level: 1, completesAtTick: null });
    if (opts.staffed ?? true) tryAssignCitizen(s, createCitizen(s, "player").id, "inf");
  }
  s.flags.wounded_player = opts.wounded ?? 0;
  return s;
}

describe("InfirmaryHealLine", () => {
  it("renders nothing without state or without wounded", () => {
    expect(renderToStaticMarkup(<InfirmaryHealLine state={undefined} />)).toBe("");
    expect(renderToStaticMarkup(<InfirmaryHealLine state={hold({ wounded: 0 })} />)).toBe("");
  });

  it("renders nothing when there is no Infirmary at all", () => {
    const s = hold({ infirmary: false, wounded: 3 });
    expect(infirmaryHeal(s)).toBeNull();
    expect(renderToStaticMarkup(<InfirmaryHealLine state={s} />)).toBe("");
  });

  it("shows Healing and the wounded count when the Infirmary is staffed", () => {
    const s = hold({ wounded: 12 });
    const heal = infirmaryHeal(s);
    expect(heal).toMatchObject({ kind: "healing", wounded: 12, next: 2 });
    const html = renderToStaticMarkup(<InfirmaryHealLine state={s} />);
    expect(html).toContain("Healing · 12 wounded");
    expect(html).toContain('data-infirmary-heal="healing"');
    expect(html).toContain(`in ${AUTO_HEAL_EVERY / 10}s`);
  });

  it("says so when the Infirmary has no worker", () => {
    const html = renderToStaticMarkup(<InfirmaryHealLine state={hold({ staffed: false, wounded: 4 })} />);
    expect(html).toContain("Not healing");
    expect(html).toContain('data-infirmary-heal="unstaffed"');
    expect(html).not.toContain("Healing ·");
  });
});
