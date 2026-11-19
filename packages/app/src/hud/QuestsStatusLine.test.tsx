import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  QUESTS,
  createGameState,
  isProvinceSeen,
  listQuests,
  tryClaimQuest,
  tryHireChampion,
  type GameState,
} from "@second-crown/sim";
import { QUESTS_NONE_TEXT, QuestsStatusLine, questsStatus } from "./QuestsStatusLine";
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

function fresh(): GameState {
  return createGameState({ seed: 8 });
}

function placeChapel(s: GameState): void {
  s.buildings.push({ id: "c1", typeId: "chapel", realmId: "player", x: 3, y: 3, level: 1, completesAtTick: null });
}

/** Meets every quest goal through the same state the sim's `done` checks read. */
function meetAll(s: GameState): void {
  placeChapel(s);
  s.flags["scout_ai1"] = 1;
  s.flags.spoils_iron = 1;
  s.flags.trade_routes = 1;
  s.resources.gold = "80";
  s.resources.food = "40";
  expect(tryHireChampion(s)).toBe(true);
}

describe("questsStatus", () => {
  it("lists every quest as active and in progress on a fresh crown", () => {
    const s = fresh();
    const st = questsStatus(s);
    expect(st.kind).toBe("active");
    expect(st.active).toBe(QUESTS.length);
    expect(st.ready).toBe(0);
    expect(st.headline).toBe(`${QUESTS.length} active`);
    expect(st.rows.map((r) => r.id)).toEqual(QUESTS.map((q) => q.id));
    for (const r of st.rows) {
      expect(r.status).toBe("open");
      expect(r.progress).toBe("0/1 in progress");
    }
  });

  it("takes each reward straight from the sim's QUESTS table", () => {
    const st = questsStatus(fresh());
    for (const q of QUESTS) {
      const row = st.rows.find((r) => r.id === q.id)!;
      expect(row.gold).toBe(q.gold);
      expect(row.reward).toBe(`${q.gold} gold`);
      expect(row.text).toBe(`${q.name}, 0/1 in progress: ${q.gold} gold`);
    }
  });

  it("marks a met goal ready to claim and counts it in the headline", () => {
    const s = fresh();
    placeChapel(s);
    const st = questsStatus(s);
    const row = st.rows.find((r) => r.id === "raise_chapel")!;
    expect(row).toMatchObject({ status: "ready", done: 1, of: 1, progress: "1/1 ready to claim", gold: 20 });
    expect(st.ready).toBe(1);
    expect(st.headline).toBe(`${QUESTS.length} active, 1 ready`);
    expect(st.text).toContain("Raise a chapel, 1/1 ready to claim: 20 gold");
  });

  it("drops a quest once claimed", () => {
    const s = fresh();
    placeChapel(s);
    expect(tryClaimQuest(s, "raise_chapel")).toBe(true);
    const st = questsStatus(s);
    expect(st.active).toBe(QUESTS.length - 1);
    expect(st.ready).toBe(0);
    expect(st.rows.some((r) => r.id === "raise_chapel")).toBe(false);
  });

  it("agrees with listQuests on which quests are left", () => {
    const s = fresh();
    placeChapel(s);
    s.flags.trade_routes = 1;
    tryClaimQuest(s, "open_route");
    const left = listQuests(s).filter((q) => !q.claimed);
    const st = questsStatus(s);
    expect(st.rows.map((r) => r.id)).toEqual(left.map((q) => q.def.id));
    expect(st.rows.map((r) => r.status === "ready")).toEqual(left.map((q) => q.complete));
  });

  it("says none are active once every quest is claimed", () => {
    const s = fresh();
    meetAll(s);
    expect(questsStatus(s).ready).toBe(QUESTS.length);
    for (const q of QUESTS) expect(tryClaimQuest(s, q.id)).toBe(true);
    const st = questsStatus(s);
    expect(st.kind).toBe("none");
    expect(st.active).toBe(0);
    expect(st.rows).toEqual([]);
    expect(st.text).toBe(`Quests · None active · ${QUESTS_NONE_TEXT}`);
  });

  it("does not change the state or pay any gold", () => {
    const s = fresh();
    placeChapel(s);
    const before = JSON.stringify(s);
    questsStatus(s);
    renderToStaticMarkup(<QuestsStatusLine state={s} />);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("QuestsStatusLine", () => {
  it("renders nothing without a state", () => {
    expect(renderToStaticMarkup(<QuestsStatusLine state={undefined} />)).toBe("");
  });

  it("shows each active quest with progress and reward, and no button", () => {
    const s = fresh();
    placeChapel(s);
    const html = renderToStaticMarkup(<QuestsStatusLine state={s} />);
    expect(html).toContain('data-quests-status="active"');
    expect(html).toContain(`data-quests-active="${QUESTS.length}"`);
    expect(html).toContain('data-quests-ready="1"');
    expect(html).toContain("has-ready");
    expect(html).toContain("<strong>Raise a chapel</strong>");
    expect(html).toContain("1/1 ready to claim");
    expect(html).toContain("0/1 in progress");
    expect(html).toContain("20 gold");
    expect(html).toContain(`aria-label="${questsStatus(s).text}"`);
    expect(html).toContain("is-lit");
    expect(html).not.toContain("<button");
  });

  it("shows the quiet text when every quest is claimed", () => {
    const s = fresh();
    meetAll(s);
    for (const q of QUESTS) tryClaimQuest(s, q.id);
    const html = renderToStaticMarkup(<QuestsStatusLine state={s} />);
    expect(html).toContain('data-quests-status="none"');
    expect(html).toContain(QUESTS_NONE_TEXT);
  });
});

describe("QuestsStatusLine mounts", () => {
  it("shows once on the Kingdom tab, right after the events line", () => {
    const s = fresh();
    const html = renderToStaticMarkup(
      <KingdomTab state={s} act={() => {}} selectedBuild={null} setSelectedBuild={() => {}} />,
    );
    const events = html.indexOf('class="sc-events-status-line');
    const line = html.indexOf('class="sc-quests-status-line');
    expect(events).toBeGreaterThan(-1);
    expect(line).toBeGreaterThan(events);
    expect(html.match(/class="sc-quests-status-line/g)?.length).toBe(1);
  });

  it("shows once on the inspect card", () => {
    const s = fresh();
    placeChapel(s);
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={s.board.homeProvinceId} act={() => {}} onClear={() => {}} />,
    );
    expect(html.match(/class="sc-quests-status-line/g)?.length).toBe(1);
    expect(html).toContain("<strong>Raise a chapel</strong>");
  });

  it("shows on the inspect card for an unseen tile too: quests belong to the crown, not the tile", () => {
    const s = fresh();
    const hidden = s.board.provinces.find((p) => !isProvinceSeen(s, p.id));
    expect(hidden).toBeDefined();
    const html = renderToStaticMarkup(
      <ProvinceInspect state={s} selectedId={hidden!.id} act={() => {}} onClear={() => {}} />,
    );
    expect(html).toContain('data-quests-status="active"');
  });
});

describe("quests-status-line.css", () => {
  const css = readFile("./quests-status-line.css");

  it("styles every class the line renders", () => {
    for (const cls of [
      "sc-quests-status-line",
      "sc-quests-status-icon",
      "sc-quests-status-text",
      "sc-quests-status-label",
      "sc-quests-status-headline",
      "sc-quests-status-quest",
      "sc-quests-status-progress",
      "sc-quests-status-reward",
      "sc-quests-status-note",
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
    for (const sel of selectors) expect(sel.startsWith(".sc-quests-status-")).toBe(true);
    expect(css).toContain("pointer-events: none");
    expect(css).not.toContain("@keyframes");
  });

  it("is not in theme.css", () => {
    expect(readFile("../theme.css")).not.toContain("sc-quests-status");
  });
});
