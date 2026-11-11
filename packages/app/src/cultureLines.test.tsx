import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CULTURES, createGameState, setPlayerCulture } from "@second-crown/sim";
import { cultureLine } from "./cultureLines";
import { CulturePicker } from "./CulturePicker";

describe("cultureLine", () => {
  it("names each paired unit and its one difference", () => {
    expect(cultureLine("mist")).toEqual({ unit: "Ranger", difference: "Farm +1 food" });
    expect(cultureLine("glen")).toEqual({ unit: "Banner", difference: "Quarry +1 stone" });
    expect(cultureLine("salt")).toEqual({ unit: "Outrider", difference: "Lumber camp +1 wood" });
    expect(cultureLine("fen")).toEqual({ unit: "Warden", difference: "Cottage +1 citizen" });
    expect(cultureLine("peak")).toEqual({ unit: "Lancer", difference: "Keep +1 vision" });
  });

  it("base cultures name their kit unit and have no difference of their own", () => {
    expect(cultureLine("western")).toEqual({ unit: "Halberdier", difference: null });
    expect(cultureLine("woodland")).toEqual({ unit: "Cedar Stalker", difference: null });
    expect(cultureLine("desert")).toEqual({ unit: "Dune Lancer", difference: null });
    expect(cultureLine("steppe")).toEqual({ unit: "Horse Archer", difference: null });
    expect(cultureLine("tide")).toEqual({ unit: "Reef Raider", difference: null });
  });

  it("an unknown culture has neither", () => {
    expect(cultureLine("nonsense")).toEqual({ unit: null, difference: null });
  });
});

describe("CulturePicker", () => {
  it("renders a unit and edge line on every culture card and keeps the pick mark", () => {
    const s = createGameState({ seed: 1 });
    setPlayerCulture(s, "glen");
    const html = renderToStaticMarkup(<CulturePicker state={s} act={() => undefined} />);
    expect(html.match(/sc-culture-lines/g)?.length).toBe(CULTURES.length);
    expect(html).toContain("Quarry +1 stone");
    expect(html).toContain("Lancer");
    expect(html).toContain("Horse Archer");
    expect(html).toContain("looks only");
    expect(html.match(/is-picked/g)?.length).toBe(1);
    expect(html).toContain("Your style");
  });
});
