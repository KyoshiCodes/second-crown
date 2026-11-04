import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ascendThreshold, createGameState, formatLetterSuffix } from "@second-crown/sim";
import { AgeLine } from "./AgeLine";

describe("AgeLine", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<AgeLine state={undefined} />)).toBe("");
  });

  it("shows the current dawn and the sim's next-age threshold", () => {
    const s = createGameState({ seed: 1 });
    const html = renderToStaticMarkup(<AgeLine state={s} />);
    expect(html).toContain('data-dawn="0"');
    expect(html).toContain("Dawn 0");
    expect(html).toContain(`next age at ${formatLetterSuffix(ascendThreshold(s))} total resources`);
    expect(html).toContain('data-ready="false"');
  });

  it("follows prestige_level and marks ready when the sim says so", () => {
    const s = createGameState({ seed: 1 });
    s.flags["prestige_level"] = 2;
    s.resources = { gold: String(ascendThreshold(s)), food: "0", wood: "0", stone: "0" };
    const html = renderToStaticMarkup(<AgeLine state={s} />);
    expect(html).toContain("Dawn 2");
    expect(html).toContain(formatLetterSuffix(ascendThreshold(s)));
    expect(html).toContain('data-ready="true"');
    expect(html).toContain("ascend from the Crown tab");
  });
});
