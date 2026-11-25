import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { campTierId, createGameState, revealProvince, type GameState } from "@second-crown/sim";
import { provinceStatusRows } from "./ProvinceStatusStack";
import { ProvinceInspect } from "./ProvinceInspect";
import { atlasProvinceRows } from "./hud/AtlasProvinceCard";

function campOf(s: GameState, tier: string) {
  const p = s.board.provinces.find((q) => campTierId(s, q) === tier)!;
  revealProvince(s, p.id);
  return p;
}

describe("camp tier labels", () => {
  it("status stack names the lean-to as Safe and the stockade as Hard", () => {
    const s = createGameState({ seed: 1 });
    const lean = campOf(s, "lean_to");
    const stock = campOf(s, "stockade");
    const leanRow = provinceStatusRows(s, lean.id).find((r) => r.kind === "outpost")!;
    const stockRow = provinceStatusRows(s, stock.id).find((r) => r.kind === "outpost")!;
    expect(leanRow.value).toBe("Bandit lean-to · Safe");
    expect(leanRow.tone).toBe("calm");
    expect(stockRow.value).toBe("Bandit stockade · Hard");
    expect(stockRow.tone).toBe("warn");
  });

  it("atlas card shows the tier name and difficulty", () => {
    const s = createGameState({ seed: 1 });
    const stock = campOf(s, "stockade");
    const name = atlasProvinceRows(s, stock.id).find((r) => r.kind === "name")!;
    expect(name.value).toBe("Bandit stockade");
    expect(name.sub).toContain("Hard");
  });

  it("inspect card shows payoff and who the camp is for", () => {
    const s = createGameState({ seed: 1 });
    const lean = campOf(s, "lean_to");
    const stock = campOf(s, "stockade");
    const a = renderToStaticMarkup(<ProvinceInspect state={s} selectedId={lean.id} onClear={() => {}} act={() => {}} />);
    expect(a).toContain("Bandit lean-to · Safe · +6 wood +3 food");
    expect(a).toContain("Starter.");
    const b = renderToStaticMarkup(<ProvinceInspect state={s} selectedId={stock.id} onClear={() => {}} act={() => {}} />);
    expect(b).toContain("Bandit stockade · Hard · +10 gold +8 stone +6 wood (siege +6 gold)");
    expect(b).toContain("Siege breaks the palisade");
  });
});
