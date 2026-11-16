import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  DECREES,
  createGameState,
  decreeActive,
  decreeUntil,
  giftBonusOpinion,
  isProvinceSeen,
  tryDecree,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { DECREES_NONE_TEXT, DecreesStatusLine, decreeEffectText, decreesStatus } from "./DecreesStatusLine";
import { KingdomTab } from "../tabs/KingdomTab";
import { ProvinceInspect } from "../ProvinceInspect";

function readFile(relativePath: string): string {
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

/** A fresh crown with stores to cover every decree. */
function rich(): GameState {
  const s = createGameState({ seed: 1 });
  s.resources.gold = "1000";
  s.resources.food = "1000";
  return s;
}

function swear(s: GameState, id: string): void {
  expect(tryDecree(s, id)).toBe(true);
}

describe("decreeEffectText", () => {
  it("drops only the blurb's own length", () => {
    expect(decreeEffectText("Training 10% cheaper for ~40s")).toBe("Training 10% cheaper");
    expect(decreeEffectText("+3 production for ~40s")).toBe("+3 production");
    expect(decreeEffectText("Gifts +6 opinion for ~50s")).toBe("Gifts +6 opinion");
    expect(decreeEffectText("Walls hold")).toBe("Walls hold");
    expect(decreeEffectText("")).toBe("—");
  });

  it("leaves every decree in the sim's table with a real effect text", () => {
    for (const d of DECREES) {
      const text = decreeEffectText(d.blurb);
      expect(text.length).toBeGreaterThan(3);
      expect(text).not.toMatch(/~\d+s/);
      expect(d.blurb.startsWith(text)).toBe(true);
    }
  });
});

describe("decreesStatus", () => {
  it("says none are active on a fresh crown", () => {
    const st = decreesStatus(createGameState({ seed: 1 }));
    expect(st.kind).toBe("none");
    expect(st.active).toBe(0);
    expect(st.rows).toEqual([]);
    expect(st.text).toBe(`Decrees · None active · ${DECREES_NONE_TEXT}`);
  });

  it("lists a sworn decree with its time left and effect", () => {
    const s = rich();
    swear(s, "rite");
    const st = decreesStatus(s);
    expect(st.kind).toBe("active");
    expect(st.active).toBe(1);
    expect(st.rows[0]).toMatchObject({
      id: "rite",
      name: "Harvest Rite",
      ticksLeft: 400,
      secondsLeft: 40,
      effect: "+3 production",
    });
    expect(st.text).toBe("Decrees · 1 active · Harvest Rite, 40s left: +3 production");
  });

  it("lists every active decree in table order, each with its own timer", () => {
    const s = rich();
    swear(s, "envoys");
    s.meta.tick += 100;
    swear(s, "muster");
    const st = decreesStatus(s);
    expect(st.rows.map((r) => r.id)).toEqual(["muster", "envoys"]);
    expect(st.text).toBe(
      "Decrees · 2 active · Muster the Host, 40s left: Training 10% cheaper · Send Envoys, 40s left: Gifts +6 opinion",
    );
    s.meta.tick += 395;
    expect(decreesStatus(s).text).toBe(
      "Decrees · 2 active · Muster the Host, 1s left: Training 10% cheaper · Send Envoys, 1s left: Gifts +6 opinion",
    );
  });

  it("takes the time left from the sim's decreeUntil and rounds up like the decree card", () => {
    const s = rich();
    swear(s, "muster");
    for (const step of [0, 1, 9, 10, 205, 398]) {
      const t = createGameState({ seed: 1 });
      t.flags = { ...s.flags };
      t.meta.tick = s.meta.tick + step;
      const row = decreesStatus(t).rows.find((r) => r.id === "muster");
      expect(row?.ticksLeft).toBe(decreeUntil(t, "muster"));
      expect(row?.secondsLeft).toBe(Math.ceil(decreeUntil(t, "muster") / TICKS_PER_SECOND));
      expect(row?.secondsLeft).toBeGreaterThan(0);
    }
  });

  it("drops a decree on the tick the sim stops counting it as active", () => {
    const s = rich();
    swear(s, "rite");
    s.meta.tick += 399;
    expect(decreeActive(s, "rite")).toBe(true);
    expect(decreesStatus(s).active).toBe(1);
    s.meta.tick += 1;
    expect(decreeActive(s, "rite")).toBe(false);
    expect(decreesStatus(s).kind).toBe("none");
  });

  it("agrees with decreeActive for every decree", () => {
    const s = rich();
    swear(s, "muster");
    swear(s, "envoys");
    const listed = decreesStatus(s).rows.map((r) => r.id);
    for (const d of DECREES) expect(listed.includes(d.id)).toBe(decreeActive(s, d.id));
  });

  it("changes nothing in the state it reads", () => {
    const s = rich();
    swear(s, "rite");
    const before = JSON.stringify(s);
    decreesStatus(s);
    renderToStaticMarkup(<DecreesStatusLine state={s} />);
    expect(JSON.stringify(s)).toBe(before);
  });

  it("shows an effect the sim really grants (envoys: +6 opinion on a gift)", () => {
    const s = rich();
    const before = giftBonusOpinion(s);
    swear(s, "envoys");
    expect(giftBonusOpinion(s) - before).toBe(6);
    expect(decreesStatus(s).rows[0].effect).toBe("Gifts +6 opinion");
  });
});

describe("DecreesStatusLine", () => {
  it("renders nothing without a state", () => {
    expect(renderToStaticMarkup(<DecreesStatusLine state={undefined} />)).toBe("");
  });

  it("renders the quiet line with a dormant seal when nothing is sworn", () => {
    const html = renderToStaticMarkup(<DecreesStatusLine state={createGameState({ seed: 1 })} />);
    expect(html).toContain('data-decrees-status="none"');
    expect(html).toContain('data-decrees-active="0"');
    expect(html).toContain("None active");
    expect(html).toContain("Swear one on the Crown tab.");
    expect(html).toContain("is-dormant");
    expect(html).not.toContain("<button");
  });

  it("renders each active decree with name, time and effect, and lights the seal", () => {
    const s = rich();
    swear(s, "muster");
    swear(s, "rite");
    const html = renderToStaticMarkup(<DecreesStatusLine state={s} />);
    expect(html).toContain('data-decrees-status="active"');
    expect(html).toContain('data-decrees-active="2"');
    expect(html).toContain("2 active");
    expect(html).toContain('data-decree="muster"');
    expect(html).toContain("<strong>Muster the Host</strong>");
    expect(html).toContain("40s left");
    expect(html).toContain("Training 10% cheaper");
    expect(html).toContain("<strong>Harvest Rite</strong>");
    expect(html).toContain("+3 production");
    expect(html).not.toContain('data-decree="envoys"');
    expect(html).toContain("is-lit");
    expect(html).toContain(`aria-label="${decreesStatus(s).text}"`);
    expect(html).not.toContain("<button");
  });
});

describe("DecreesStatusLine mounts", () => {
  it("shows once on the Kingdom tab, above the next-decree hint", () => {
    const s = rich();
    swear(s, "rite");
    const html = renderToStaticMarkup(
      <KingdomTab state={s} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    const line = html.indexOf('class="sc-decrees-status-line');
    const hint = html.indexOf('class="sc-decree-hint');
    expect(line).toBeGreaterThan(-1);
    expect(hint).toBeGreaterThan(line);
    expect(html.match(/sc-decrees-status-line/g)?.length).toBe(1);
    expect(html).toContain("<strong>Harvest Rite</strong>");
  });

  it("shows once on the inspect card", () => {
    const s = rich();
    swear(s, "envoys");
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={s.board.homeProvinceId} act={() => {}} onClear={() => {}} />,
    );
    expect(html.match(/sc-decrees-status-line/g)?.length).toBe(1);
    expect(html).toContain("<strong>Send Envoys</strong>");
    expect(html).toContain("Gifts +6 opinion");
  });

  it("shows on the inspect card for an unseen tile too: decrees belong to the crown, not the tile", () => {
    const s = rich();
    const hidden = s.board.provinces.find((p) => !isProvinceSeen(s, p.id));
    expect(hidden).toBeDefined();
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={hidden!.id} act={() => {}} onClear={() => {}} />,
    );
    expect(html).toContain('data-decrees-status="none"');
  });
});

describe("decrees-status-line.css", () => {
  const css = readFile("./decrees-status-line.css");

  it("styles every class the line renders", () => {
    for (const cls of [
      "sc-decrees-status-line",
      "sc-decrees-status-icon",
      "sc-decrees-status-text",
      "sc-decrees-status-label",
      "sc-decrees-status-headline",
      "sc-decrees-status-time",
      "sc-decrees-status-effect",
      "sc-decrees-status-note",
    ]) {
      expect(css).toContain(`.${cls}`);
    }
  });

  it("keeps every selector under its own prefix and never blocks clicks", () => {
    const selectors = css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("}")
      .map((block) => block.split("{")[0].trim())
      .filter(Boolean)
      .flatMap((sel) => sel.split(",").map((x) => x.trim()));
    expect(selectors.length).toBeGreaterThan(0);
    for (const sel of selectors) expect(sel.startsWith(".sc-decrees-status-")).toBe(true);
    expect(css).toContain("pointer-events: none");
    expect(css).not.toContain("@keyframes");
  });

  it("is not in theme.css", () => {
    expect(readFile("../theme.css")).not.toContain("sc-decrees-status");
  });
});
