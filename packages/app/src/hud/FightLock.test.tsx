import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, tryDeclareWar, FIGHT_LOCKED_LINE, WAR_PHASE_START } from "@second-crown/sim";
import { WarRoom } from "../WarRoom";

function render(s: ReturnType<typeof createGameState>) {
  return renderToStaticMarkup(
    <WarRoom state={s} act={() => {}} rivalOp={0} playerOp={0} battleSnap={null} setBattleSnap={() => {}} />,
  );
}

function fightButton(html: string): string {
  const m = html.match(/<button[^>]*>Fight<\/button>/);
  if (!m) throw new Error("no Fight button");
  return m[0];
}

function peaceButton(html: string): string {
  const m = html.match(/<button[^>]*>White Peace<\/button>/);
  if (!m) throw new Error("no White Peace button");
  return m[0];
}

function atWar() {
  const s = createGameState({ seed: 1 });
  s.wars = [];
  s.meta.tick = 1000;
  tryDeclareWar(s, { attackerRealmId: "player", defenderRealmId: "rival" });
  return s;
}

describe("War tab clash lock", () => {
  it("locks Fight with one line before the clash; white peace stays open", () => {
    const s = atWar();
    s.meta.tick = 1000 + WAR_PHASE_START.skirmish;
    const html = render(s);
    expect(FIGHT_LOCKED_LINE).toBe("The lines have not closed");
    expect(fightButton(html)).toContain("disabled");
    expect(fightButton(html)).toContain('data-fight-locked="true"');
    expect(html.split(`${FIGHT_LOCKED_LINE}.`).length - 1).toBe(1);
    expect(peaceButton(html)).not.toContain("disabled");
  });

  it("opens Fight at the main clash and drops the line", () => {
    const s = atWar();
    s.meta.tick = 1000 + WAR_PHASE_START.clash;
    const html = render(s);
    expect(fightButton(html)).not.toContain("disabled");
    expect(html).not.toContain(FIGHT_LOCKED_LINE);
  });

  it("shows no lock line with no war", () => {
    const s = createGameState({ seed: 1 });
    s.wars = [];
    expect(render(s)).not.toContain(FIGHT_LOCKED_LINE);
  });
});
