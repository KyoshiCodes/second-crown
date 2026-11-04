import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, CULTURES, playerCultureId, setPlayerCulture } from "@second-crown/sim";
import { CultureLine, nextCultureId } from "./CultureLine";

const noAct = () => {};

describe("nextCultureId", () => {
  it("steps to the next culture in table order and wraps", () => {
    const s = createGameState({ seed: 1 });
    setPlayerCulture(s, CULTURES[0].id);
    expect(nextCultureId(s)).toBe(CULTURES[1].id);
    setPlayerCulture(s, CULTURES[CULTURES.length - 1].id);
    expect(nextCultureId(s)).toBe(CULTURES[0].id);
  });
});

describe("CultureLine", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<CultureLine state={undefined} act={noAct} />)).toBe("");
  });

  it("shows the current culture and the next switch", () => {
    const s = createGameState({ seed: 1 });
    const cur = CULTURES.find((c) => c.id === playerCultureId(s))!;
    const next = CULTURES.find((c) => c.id === nextCultureId(s))!;
    const html = renderToStaticMarkup(<CultureLine state={s} act={noAct} />);
    expect(html).toContain(`data-culture="${cur.id}"`);
    expect(html).toContain(cur.name);
    expect(html).toContain(`data-next-culture="${next.id}"`);
    expect(html).toContain(`Switch to ${next.name}`);
  });

  it("switches through the existing culture action", () => {
    const s = createGameState({ seed: 1 });
    const target = nextCultureId(s);
    let msg = "";
    const act = (fn: (st: typeof s) => string | void) => {
      msg = String(fn(s) ?? "");
    };
    const el = CultureLine({ state: s, act: act as never }) as React.ReactElement<{ children: React.ReactNode[] }>;
    const btn = (el.props.children as React.ReactElement<{ onClick: () => void }>[])[2];
    btn.props.onClick();
    expect(playerCultureId(s)).toBe(target);
    expect(msg).toContain("Your host walks as");
  });
});
