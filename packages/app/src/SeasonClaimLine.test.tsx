import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  createGameState,
  currentSeason,
  seasonBoonPreview,
  seasonClaimed,
  sunMoonPositionAt,
  tryClaimSeason,
} from "@second-crown/sim";
import {
  DAY_TICKS,
  SEASON_TICKS,
  SeasonClaimLine,
  seasonClaimStatus,
  seasonTicksLeft,
} from "./SeasonClaimLine";

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: {
      getBuiltinModule?: (id: string) => {
        readFileSync: (path: URL, encoding: string) => string;
      };
    };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const noAct = () => {};

function at(tick: number) {
  const s = createGameState({ seed: 1 });
  s.meta.tick = tick;
  return s;
}

describe("season clock constants match the sim", () => {
  it("the season turns exactly when the countdown runs out", () => {
    for (const tick of [0, 1, 1999, 2000, 3500, 7999, 8000, 12345]) {
      const left = seasonTicksLeft(tick);
      expect(left).toBeGreaterThanOrEqual(1);
      expect(left).toBeLessThanOrEqual(SEASON_TICKS);
      expect(currentSeason(at(tick + left - 1))).toBe(currentSeason(at(tick)));
      expect(currentSeason(at(tick + left))).not.toBe(currentSeason(at(tick)));
    }
  });

  it("a claim reopens exactly when the countdown runs out", () => {
    const s = at(700);
    expect(tryClaimSeason(s)).toBe(true);
    const left = seasonTicksLeft(s.meta.tick);
    s.meta.tick += left - 1;
    expect(seasonClaimed(s)).toBe(true);
    s.meta.tick += 1;
    expect(seasonClaimed(s)).toBe(false);
  });

  it("the day length matches the sim's sun and moon cycle", () => {
    expect(sunMoonPositionAt(0)).toEqual(sunMoonPositionAt(DAY_TICKS));
    expect(sunMoonPositionAt(900)).toEqual(sunMoonPositionAt(900 + DAY_TICKS));
    expect(sunMoonPositionAt(0).kind).toBe("sun");
    expect(sunMoonPositionAt(DAY_TICKS - 1).kind).toBe("moon");
  });
});

describe("seasonClaimStatus", () => {
  it("reports the season, the countdown, and the sim's boon", () => {
    const s = at(0);
    const st = seasonClaimStatus(s);
    const boon = seasonBoonPreview(s);
    expect(st.season).toBe("Spring");
    expect(st.nextSeason).toBe("Summer");
    expect(st.ticksLeft).toBe(2000);
    expect(st.secondsLeft).toBe(200);
    expect(st.daysLeft).toBe(0.6);
    expect(st.res).toBe(boon.res);
    expect(st.amount).toBe(boon.amount);
    expect(st.ready).toBe(true);
  });

  it("never shows zero days and wraps winter to spring", () => {
    const st = seasonClaimStatus(at(7999));
    expect(st.season).toBe("Winter");
    expect(st.nextSeason).toBe("Spring");
    expect(st.ticksLeft).toBe(1);
    expect(st.daysLeft).toBe(0.1);
    expect(st.secondsLeft).toBe(1);
  });

  it("is not ready after a claim and ready again next season", () => {
    const s = at(100);
    tryClaimSeason(s);
    expect(seasonClaimStatus(s).ready).toBe(false);
    s.meta.tick = 2000;
    expect(seasonClaimStatus(s).ready).toBe(true);
  });
});

describe("SeasonClaimLine", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<SeasonClaimLine state={undefined} act={noAct} />)).toBe("");
  });

  it("shows the season, days left, and a Claim button when the boon is ready", () => {
    const html = renderToStaticMarkup(<SeasonClaimLine state={at(2000)} act={noAct} />);
    expect(html).toContain('data-season="summer"');
    expect(html).toContain('data-ready="true"');
    expect(html).toContain("is-ready");
    expect(html).toContain("<strong>Summer</strong>");
    expect(html).toContain("0.6 days left (200s)");
    expect(html).toContain("season court ready: +30 wood");
    expect(html).toContain("<button");
    expect(html).toContain(">Claim</button>");
  });

  it("hides the button once claimed and names the next season", () => {
    const s = at(2000);
    tryClaimSeason(s);
    const html = renderToStaticMarkup(<SeasonClaimLine state={s} act={noAct} />);
    expect(html).toContain('data-ready="false"');
    expect(html).toContain("is-claimed");
    expect(html).toContain("season court claimed, next in Autumn");
    expect(html).not.toContain("<button");
  });

  it("the Claim button runs the sim claim through act", () => {
    const s = at(4000);
    let message = "";
    const act = (fn: (st: typeof s, eng: never) => string) => {
      message = fn(s, undefined as never);
    };
    const el = SeasonClaimLine({ state: s, act: act as never }) as React.ReactElement<{ children: React.ReactNode }>;
    const button = React.Children.toArray(el.props.children).find(
      (c): c is React.ReactElement<{ onClick: () => void }> => React.isValidElement(c) && c.type === "button",
    );
    expect(button).toBeDefined();
    button!.props.onClick();
    expect(message).toBe("Season court collected.");
    expect(seasonClaimed(s)).toBe(true);
    button!.props.onClick();
    expect(message).toBe("Already claimed this season.");
  });
});

describe("season claim line styles", () => {
  it("lives in its own stylesheet, not theme.css", () => {
    const css = readCssFile("./season-claim-line.css");
    expect(css).toContain(".sc-season-claim");
    expect(css).toContain(".sc-season-claim-btn");
    const theme = readCssFile("./theme.css");
    expect(theme).not.toContain("sc-season-claim");
  });
});
