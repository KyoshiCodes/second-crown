import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ascendThreshold, canAscend, createGameState, formatLetterSuffix, type GameState } from "@second-crown/sim";
import { PrestigeLine, PrestigeLineView, prestigeStatus, type PrestigeStatus } from "./PrestigeLine";

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
const noop = () => {};

/** A fresh crown holding exactly `gold` gold and nothing else. */
function withGold(gold: number, level = 0): GameState {
  const s = createGameState({ seed: 1 });
  if (level > 0) s.flags["prestige_level"] = level;
  s.resources = { gold: String(gold), food: "0", wood: "0", stone: "0" };
  return s;
}

type ButtonEl = React.ReactElement<{ onClick: () => void; children: React.ReactNode }>;

/** Every <button> in the view, fragments included. */
function buttons(node: React.ReactNode): ButtonEl[] {
  const out: ButtonEl[] = [];
  React.Children.forEach(node, (c) => {
    if (!React.isValidElement(c)) return;
    if (c.type === "button") out.push(c as ButtonEl);
    else out.push(...buttons((c.props as { children?: React.ReactNode }).children));
  });
  return out;
}

function view(status: PrestigeStatus, armed: boolean, handlers: Partial<Record<"onArm" | "onCancel" | "onAscend", () => void>> = {}) {
  return PrestigeLineView({ status, armed, onArm: noop, onCancel: noop, onAscend: noop, ...handlers });
}

describe("prestigeStatus reads the sim", () => {
  it("reports the dawn, the sim threshold and the stores held", () => {
    const s = withGold(15_000);
    const st = prestigeStatus(s);
    expect(st.dawn).toBe(0);
    expect(st.need).toBe(ascendThreshold(s));
    expect(st.have).toBe("15000");
    expect(st.percent).toBe(50);
    expect(st.ready).toBe(false);
    expect(st.shared).toBe(false);
  });

  it("adds every resource together, like the sim does", () => {
    const s = createGameState({ seed: 1 });
    s.resources = { gold: "10000", food: "10000", wood: "5000", stone: "5000" };
    const st = prestigeStatus(s);
    expect(st.have).toBe("30000");
    expect(st.ready).toBe(true);
    expect(canAscend(s)).toBe(true);
  });

  it("ready and 100% only ever agree with canAscend, at every age", () => {
    for (const level of [0, 1, 2, 7]) {
      const need = ascendThreshold(withGold(0, level));
      for (const gold of [0, 1, need / 2, need - 1, need - 0.5, need, need + 1, need * 40]) {
        const s = withGold(gold, level);
        const st = prestigeStatus(s);
        expect(st.need).toBe(need);
        expect(st.ready).toBe(canAscend(s));
        expect(st.percent === 100).toBe(canAscend(s));
        expect(st.percent).toBeGreaterThanOrEqual(0);
        expect(st.percent).toBeLessThanOrEqual(100);
      }
    }
  });

  it("follows prestige_level", () => {
    const s = withGold(0, 3);
    expect(prestigeStatus(s).dawn).toBe(3);
    expect(prestigeStatus(s).need).toBe(ascendThreshold(s));
  });
});

describe("PrestigeLine", () => {
  it("renders nothing without state", () => {
    expect(renderToStaticMarkup(<PrestigeLine state={undefined} act={noAct} />)).toBe("");
  });

  it("shows age, progress and no button while not ready", () => {
    const s = withGold(15_000);
    const html = renderToStaticMarkup(<PrestigeLine state={s} act={noAct} />);
    expect(html).toContain("sc-prestige-line is-waiting");
    expect(html).toContain('data-dawn="0"');
    expect(html).toContain('data-ready="false"');
    expect(html).toContain('data-percent="50"');
    expect(html).toContain("Dawn 0");
    expect(html).toContain(`${formatLetterSuffix("15000")} / ${formatLetterSuffix(ascendThreshold(s))} total resources (50%)`);
    expect(html).toContain("not ready yet");
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="50"');
    expect(html).toContain("width:50%");
    expect(html).not.toContain("<button");
  });

  it("shows one Ascend button when the sim says ready", () => {
    const s = withGold(ascendThreshold(withGold(0, 2)), 2);
    const html = renderToStaticMarkup(<PrestigeLine state={s} act={noAct} />);
    expect(html).toContain("sc-prestige-line is-ready");
    expect(html).toContain('data-ready="true"');
    expect(html).toContain("(100%)");
    expect(html).toContain("ready for Dawn 3");
    expect(html.match(/<button/g)?.length).toBe(1);
    expect(html).toContain(">Ascend</button>");
    expect(html).toContain('data-age-glyph="dawn-2"');
  });
});

describe("PrestigeLineView buttons", () => {
  it("first press only arms; it does not ascend", () => {
    const st = prestigeStatus(withGold(30_000));
    let armed = 0;
    let ascended = 0;
    const found = buttons(view(st, false, { onArm: () => armed++, onAscend: () => ascended++ }));
    expect(found).toHaveLength(1);
    expect(found[0].props.children).toBe("Ascend");
    found[0].props.onClick();
    expect(armed).toBe(1);
    expect(ascended).toBe(0);
  });

  it("armed: warns what resets and offers Confirm and Cancel", () => {
    const st = prestigeStatus(withGold(30_000));
    let ascended = 0;
    let cancelled = 0;
    const el = view(st, true, { onAscend: () => ascended++, onCancel: () => cancelled++ });
    const html = renderToStaticMarkup(el);
    expect(html).toContain("is-armed");
    expect(html).toContain("Buildings, troops and stores start over");
    const found = buttons(el);
    expect(found.map((b) => b.props.children)).toEqual(["Confirm ascend", "Cancel"]);
    found[1].props.onClick();
    expect(cancelled).toBe(1);
    expect(ascended).toBe(0);
    found[0].props.onClick();
    expect(ascended).toBe(1);
  });

  it("armed but no longer ready: no buttons, back to the progress text", () => {
    const st = prestigeStatus(withGold(100));
    const el = view(st, true);
    expect(buttons(el)).toHaveLength(0);
    const html = renderToStaticMarkup(el);
    expect(html).not.toContain("is-armed");
    expect(html).toContain("not ready yet");
  });

  it("a shared hold shows no progress bar and no button", () => {
    const st: PrestigeStatus = { ...prestigeStatus(withGold(30_000)), ready: false, shared: true };
    const el = view(st, false);
    const html = renderToStaticMarkup(el);
    expect(html).toContain("is-shared");
    expect(html).toContain("a shared hold has no Second Dawn.");
    expect(html).not.toContain("progressbar");
    expect(buttons(el)).toHaveLength(0);
    expect(html).toContain('data-age-glyph="shared"');
  });
});

describe("prestige line styles", () => {
  it("lives in its own stylesheet, not theme.css", () => {
    const css = readCssFile("./prestige-line.css");
    expect(css).toContain(".sc-prestige-line");
    expect(css).toContain(".sc-prestige-btn");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    const theme = readCssFile("./theme.css");
    expect(theme).not.toContain("sc-prestige");
  });

  it("the Kingdom tab mounts the prestige line in place of the read-only age line", () => {
    const tab = readCssFile("./tabs/KingdomTab.tsx");
    expect(tab).toContain("<PrestigeLine state={state} act={act} />");
    expect(tab).not.toContain("<AgeLine");
  });
});
