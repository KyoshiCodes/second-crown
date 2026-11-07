import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { ForceStatus, forceStatusRows, tripProgress } from "./ForceStatus";
import { ForceCard } from "./ForceCard";
import { WarRoom } from "../WarRoom";

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

describe("forceStatusRows", () => {
  it("always stacks power, ETA, risk in that order", () => {
    const rows = forceStatusRows({ power: 6, powerMax: 12, seconds: 4, risk: { value: "Low", tone: "calm" } });
    expect(rows.map((r) => r.kind)).toEqual(["power", "eta", "risk"]);
    expect(rows[0]).toMatchObject({ value: "6", fill: 0.5 });
    expect(rows[1]).toMatchObject({ value: "4s" });
    expect(rows[1].fill).toBeUndefined();
  });

  it("hides power behind fog and shows Posted without seconds", () => {
    const rows = forceStatusRows({ risk: { value: "Unknown", tone: "fog" } });
    expect(rows[0]).toMatchObject({ value: "?", tone: "fog" });
    expect(rows[0].fill).toBeUndefined();
    expect(rows[1].value).toBe("Posted");
  });

  it("adds a progress bar and a note only when given", () => {
    const rows = forceStatusRows({ power: 3, seconds: 2, progress: 0.75, etaNote: "returning", risk: { value: "x", tone: "warn" } });
    expect(rows[1]).toMatchObject({ value: "returning · 2s", fill: 0.75 });
  });
});

describe("tripProgress", () => {
  it("reads progress from stored trip length and clamps", () => {
    expect(tripProgress(50, 100, 100)).toBe(0.5);
    expect(tripProgress(0, 100, 50)).toBe(0);
    expect(tripProgress(200, 100, 50)).toBe(1);
    expect(tripProgress(10, 20, 0)).toBeUndefined();
  });
});

describe("ForceStatus and ForceCard", () => {
  it("renders rows with tone classes and keeps the action button", () => {
    const rows = forceStatusRows({ power: 4, powerMax: 4, seconds: 3, risk: { value: "High", tone: "danger" } });
    expect(renderToStaticMarkup(<ForceStatus rows={rows} />)).toContain("tone-danger");
    const html = renderToStaticMarkup(
      <ForceCard tone="hostile" name="Host" dest="1,1" seconds={3} status={rows} action={{ label: "Sally", onClick: () => {} }} />,
    );
    expect(html).toContain("sc-force-status");
    expect(html).toContain("is-power");
    expect(html).toContain("is-eta");
    expect(html).toContain("is-risk");
    expect(html).toContain("Sally");
  });

  it("ForceCard without status renders as before", () => {
    const html = renderToStaticMarkup(<ForceCard tone="scout" name="Scout" dest="1,1" seconds={2} />);
    expect(html).not.toContain("sc-force-status");
  });
});

describe("WarRoom force cards", () => {
  it("garrison card shows power, posted ETA and a quiet risk", () => {
    const s = createGameState({ seed: 1 });
    const id = s.board.provinces.find((p) => p.id !== s.board.homeProvinceId)!.id;
    s.flags["garrisons_json"] = JSON.stringify([{ provinceId: id, force: { militia: 3 } }]);
    const html = renderToStaticMarkup(
      <WarRoom state={s} act={() => {}} rivalOp={0} playerOp={0} battleSnap={null} setBattleSnap={() => {}} />,
    );
    expect(html).toContain("sc-force-status");
    expect(html).toContain("Posted");
    expect(html).toContain("Quiet");
  });

  it("a host marching on home lights danger on the home garrison", () => {
    const s = createGameState({ seed: 1 });
    const id = s.board.homeProvinceId;
    const rival = s.realms.find((r) => r.id !== "player")!.id;
    s.flags["garrisons_json"] = JSON.stringify([{ provinceId: id, force: { militia: 3 } }]);
    s.flags["marches_json"] = JSON.stringify([
      { id: "h", realmId: rival, fromId: "x", toId: id, arrivesTick: s.meta.tick + TICKS_PER_SECOND * 5, kind: "hold", levy: 5 },
    ]);
    const html = renderToStaticMarkup(
      <WarRoom state={s} act={() => {}} rivalOp={0} playerOp={0} battleSnap={null} setBattleSnap={() => {}} />,
    );
    expect(html).toContain("Column inbound");
    expect(html).toContain("tone-danger");
  });
});

describe("force-status.css", () => {
  it("lives outside theme.css and respects reduced motion", () => {
    const css = readCssFile("./force-status.css");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toContain(".sc-force-status");
    expect(readCssFile("../theme.css")).not.toContain("sc-force-status");
    expect(readCssFile("../theme.css")).not.toContain("sc-force-row");
  });
});
