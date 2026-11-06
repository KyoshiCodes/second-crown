import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GATHER_NODES, createGameState, revealProvince } from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { BoardStatus, boardStatusAnchor, boardStatusChips } from "./BoardStatus";

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

function fresh() {
  return createGameState({ seed: 1 });
}

describe("boardStatusChips", () => {
  it("home hold reads You, a garrison chip and a quiet next event", () => {
    const s = fresh();
    const chips = boardStatusChips(s, s.board.homeProvinceId);
    expect(chips[0]).toMatchObject({ kind: "owner", value: "You", tone: "you" });
    expect(chips.map((c) => c.kind)).toContain("garrison");
    expect(chips.at(-1)).toMatchObject({ kind: "event", value: "Quiet" });
    expect(chips.length).toBeGreaterThanOrEqual(3);
    expect(chips.length).toBeLessThanOrEqual(4);
  });

  it("returns no chips for an unknown id", () => {
    expect(boardStatusChips(fresh(), "nope")).toEqual([]);
  });

  it("shows stock for a seen gather tile", () => {
    const s = fresh();
    const p = s.board.provinces.find((x) => x.node in GATHER_NODES)!;
    revealProvince(s, p.id);
    const stock = boardStatusChips(s, p.id).find((c) => c.kind === "stock");
    expect(stock?.value).toMatch(/^\d+\/\d+ \w+$/);
  });

  it("reads garrison size from the posted force", () => {
    const s = fresh();
    const id = s.board.homeProvinceId;
    s.flags["garrisons_json"] = JSON.stringify([{ provinceId: id, force: { militia: 4, archer: 2 } }]);
    const g = boardStatusChips(s, id).find((c) => c.kind === "garrison")!;
    expect(g.value.startsWith("6 · pow ")).toBe(true);
  });

  it("next event names the soonest inbound column with its seconds", () => {
    const s = fresh();
    const id = s.board.homeProvinceId;
    const t = s.meta.tick;
    s.flags["marches_json"] = JSON.stringify([
      { id: "a", realmId: "player", fromId: "x", toId: id, arrivesTick: t + TICKS_PER_SECOND * 9, kind: "hold", levy: 1 },
      { id: "b", realmId: s.realms.find((r) => r.id !== "player")!.id, fromId: "x", toId: id, arrivesTick: t + TICKS_PER_SECOND * 3, kind: "hold", levy: 1 },
    ]);
    const ev = boardStatusChips(s, id).find((c) => c.kind === "event")!;
    expect(ev.value).toMatch(/ in 3s$/);
    expect(ev.tone).toBe("warn");
  });
});

describe("boardStatusAnchor", () => {
  it("keeps the stack inside a safe vertical band", () => {
    const s = fresh();
    for (const p of s.board.provinces) {
      const a = boardStatusAnchor(s, p.id);
      expect(a.topPct).toBeGreaterThanOrEqual(6);
      expect(a.topPct).toBeLessThanOrEqual(78);
      expect(["left", "right"]).toContain(a.side);
    }
  });
});

describe("BoardStatus", () => {
  it("renders nothing off the board band or without a selection", () => {
    const s = fresh();
    expect(renderToStaticMarkup(<BoardStatus state={s} selectedId={s.board.homeProvinceId} visible={false} />)).toBe("");
    expect(renderToStaticMarkup(<BoardStatus state={s} selectedId={null} visible />)).toBe("");
  });

  it("renders a stacked chip list for the selected tile", () => {
    const s = fresh();
    const html = renderToStaticMarkup(<BoardStatus state={s} selectedId={s.board.homeProvinceId} visible />);
    expect(html).toContain("sc-board-status");
    expect(html).toContain("is-owner");
    expect(html).toContain("is-event");
  });

  it("css is non-blocking and lives outside theme.css", () => {
    const css = readCssFile("./board-status.css");
    expect(css).toContain("pointer-events: none");
    expect(css).toContain("prefers-reduced-motion");
    expect(readCssFile("./theme.css")).not.toContain("sc-board-status");
  });
});
