import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, tryDeclareWar, tryWhitePeace } from "@second-crown/sim";
import { WarPhaseLine } from "./WarPhaseLine";

function atWar(tick = 1000) {
  const s = createGameState({ seed: 1 });
  s.meta.tick = tick;
  tryDeclareWar(s, { attackerRealmId: "player", defenderRealmId: "rival" });
  return s;
}

describe("WarPhaseLine", () => {
  it("renders nothing with no war", () => {
    expect(renderToStaticMarkup(<WarPhaseLine state={createGameState({ seed: 1 })} />)).toBe("");
  });

  it("shows the phase id, the four steps and a countdown while columns form", () => {
    const html = renderToStaticMarkup(<WarPhaseLine state={atWar()} />);
    expect(html).toContain('data-phase="columns"');
    expect(html).toContain("Columns forming");
    expect(html).toContain("Skirmish");
    expect(html).toContain("Main clash");
    expect(html).toContain("Aftermath");
    expect(html).toContain("Next in 10s.");
  });

  it("walks to skirmish and clash by ticks", () => {
    const s = atWar();
    s.meta.tick = 1150;
    expect(renderToStaticMarkup(<WarPhaseLine state={s} />)).toContain('data-phase="skirmish"');
    s.meta.tick = 1300;
    const html = renderToStaticMarkup(<WarPhaseLine state={s} />);
    expect(html).toContain('data-phase="clash"');
    expect(html).toContain("Fight to commit");
    expect(html).not.toContain("Next in");
  });

  it("shows the aftermath after white peace", () => {
    const s = atWar();
    s.meta.tick = 1050;
    tryWhitePeace(s);
    expect(renderToStaticMarkup(<WarPhaseLine state={s} />)).toContain('data-phase="aftermath"');
  });

  it("ignores a war between two other realms", () => {
    const s = createGameState({ seed: 1 });
    s.wars.push({ id: "war_npc_x", attackerRealmId: "k_ash", defenderRealmId: "k_silk", startedTick: 0, status: "active" });
    expect(renderToStaticMarkup(<WarPhaseLine state={s} />)).toBe("");
  });
});
