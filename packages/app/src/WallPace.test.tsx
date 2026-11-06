import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, wallHp } from "@second-crown/sim";
import { WallPace, nextWallChange } from "./WallPace";

type B = ReturnType<typeof createGameState>["buildings"][number];

function bare() {
  const s = createGameState({ seed: 1 });
  s.buildings = [];
  return s;
}

function site(id: string, typeId: string, completesAtTick: number | null, realmId = "player"): B {
  return { id, typeId, realmId, x: 0, y: 0, level: 1, completesAtTick } as B;
}

describe("WallPace", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<WallPace state={undefined} />)).toBe("");
  });

  it("shows the sim wall HP and no change when nothing is queued", () => {
    const s = bare();
    s.buildings = [site("w", "walls", null)];
    expect(nextWallChange(s)).toBeNull();
    const html = renderToStaticMarkup(<WallPace state={s} />);
    expect(html).toContain(`wall HP ${wallHp(s, "player")}`);
    expect(html).toContain("no change queued");
    expect(html).toContain('data-wall="steady"');
  });

  it("names the earliest wall section under construction", () => {
    const s = bare();
    const t = s.meta.tick;
    s.buildings = [site("a", "walls", t + 300), site("b", "walls", t + 120), site("c", "farm", t + 10)];
    expect(nextWallChange(s)).toEqual({ ticks: 120, source: "walls" });
    const html = renderToStaticMarkup(<WallPace state={s} />);
    expect(html).toContain("next change in <strong>12s</strong>: a wall section finishes");
    expect(html).toContain('data-wall="walls"');
  });

  it("picks the gate when it lands first and ignores rival works", () => {
    const s = bare();
    const t = s.meta.tick;
    s.buildings = [site("a", "walls", t + 300), site("g", "gate", t + 50), site("r", "walls", t + 5, "rival")];
    expect(nextWallChange(s)).toEqual({ ticks: 50, source: "gate" });
    expect(renderToStaticMarkup(<WallPace state={s} />)).toContain("the gate finishes");
  });
});
