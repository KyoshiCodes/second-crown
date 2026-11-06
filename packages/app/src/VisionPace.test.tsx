import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, visionRange } from "@second-crown/sim";
import { VisionPace, nextVisionChange } from "./VisionPace";

type B = ReturnType<typeof createGameState>["buildings"][number];

function bare() {
  const s = createGameState({ seed: 1 });
  s.buildings = [];
  for (const k of Object.keys(s.flags)) if (k.startsWith("research_")) delete s.flags[k];
  return s;
}

function site(id: string, typeId: string, completesAtTick: number | null, realmId = "player"): B {
  return { id, typeId, realmId, x: 0, y: 0, level: 1, completesAtTick } as B;
}

describe("VisionPace", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<VisionPace state={undefined} />)).toBe("");
  });

  it("shows the sim range and no change when nothing is queued", () => {
    const s = bare();
    expect(nextVisionChange(s)).toBeNull();
    const html = renderToStaticMarkup(<VisionPace state={s} />);
    expect(html).toContain(`range ${visionRange(s)}`);
    expect(html).toContain("no change queued");
    expect(html).toContain('data-vision="steady"');
  });

  it("names the earliest watchtower under construction", () => {
    const s = bare();
    const t = s.meta.tick;
    s.buildings = [site("a", "watchtower", t + 300), site("b", "watchtower", t + 120), site("c", "farm", t + 10)];
    expect(nextVisionChange(s)).toEqual({ ticks: 120, source: "watchtower" });
    const html = renderToStaticMarkup(<VisionPace state={s} />);
    expect(html).toContain("next change in <strong>12s</strong>: a watchtower finishes");
    expect(html).toContain('data-vision="watchtower"');
  });

  it("picks Surveying when it lands first and ignores rival towers", () => {
    const s = bare();
    const t = s.meta.tick;
    s.buildings = [site("a", "watchtower", t + 300), site("r", "watchtower", t + 5, "rival")];
    s.flags.research_surveying_until = t + 50;
    expect(nextVisionChange(s)).toEqual({ ticks: 50, source: "surveying" });
    expect(renderToStaticMarkup(<VisionPace state={s} />)).toContain("Surveying study finishes");
  });

  it("counts a first keep only when the culture grants keep vision", () => {
    const s = bare();
    const t = s.meta.tick;
    s.buildings = [site("k", "keep", t + 80)];
    s.flags.culture = "western";
    expect(nextVisionChange(s)).toBeNull();
    s.flags.culture = "peak";
    expect(nextVisionChange(s)).toEqual({ ticks: 80, source: "keep" });
  });
});
