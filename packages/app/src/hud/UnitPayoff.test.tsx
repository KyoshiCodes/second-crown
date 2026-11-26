import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UnitCard } from "./UnitCard";

function card(typeId: string, name: string, tier: number, open = true): string {
  return renderToStaticMarkup(
    <UnitCard
      typeId={typeId}
      name={name}
      power={10}
      cost={{ food: "10" }}
      ticks={600}
      open={open}
      lock="Needs Horse lore."
      affordable={open}
      onTrain={() => {}}
      tier={tier}
    />,
  );
}

describe("UnitCard elite payoff note", () => {
  it("shows the sim payoff note on cavalry, knights and siege", () => {
    expect(card("cavalry", "Cavalry", 3)).toContain("Rides down archer screens; a spear line stops it.");
    expect(card("knight", "Knight", 3)).toContain("Six take the bandit stockade; four steady a home guard.");
    expect(card("siege", "Siege Engine", 4)).toContain("Ignores camp palisades: one turns a stockade loss into a win.");
  });

  it("keeps the note on a locked card so the player knows why to study", () => {
    const html = card("knight", "Knight", 3, false);
    expect(html).toContain('data-unit-payoff="knight"');
    expect(html).toContain("Needs Horse lore.");
  });

  it("ordinary units get no note", () => {
    expect(card("militia", "Militia", 1)).not.toContain("sc-unit-payoff");
    expect(card("spearman", "Spearman", 2)).not.toContain("sc-unit-payoff");
  });
});
