import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState } from "@second-crown/sim";
import { DiploLedger, pactLedgerRows, realmLedgerRows } from "./DiploLedger";
import { RealmCard } from "./RealmCard";
import { WorldPanel } from "../WorldPanel";

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function inOrder(html: string, keys: string[]): boolean {
  const idx = keys.map((k) => html.indexOf(k));
  return idx.every((i) => i >= 0) && idx.every((v, i) => i === 0 || v > idx[i - 1]);
}

const noop = () => undefined;

describe("realm ledger rows", () => {
  it("stacks name, stance, power in order", () => {
    const rows = realmLedgerRows({ name: "Vale", stance: "wary", peaceLeft: 0, opinion: 3, matchup: { mine: 30, theirs: 10 } });
    expect(rows.map((r) => r.kind)).toEqual(["name", "stance", "power"]);
    expect(rows[1].value).toBe("Wary");
    expect(rows[1].sub).toBe("opinion 3");
    expect(rows[2].value).toBe("30 vs 10");
    expect(rows[2].sub).toBe("75% yours");
    expect(rows[2].fill).toBeCloseTo(0.75);
    expect(rows[2].tone).toBe("ready");
  });

  it("truce rounds seconds like the old header; unfavored power reads red", () => {
    const rows = realmLedgerRows({ name: "V", stance: "truce", peaceLeft: 101, opinion: 0, myOpinion: -4, matchup: { mine: 1, theirs: 9 } });
    expect(rows[1].value).toBe("Truce 11s");
    expect(rows[1].sub).toBe("opinion 0 · yours -4");
    expect(rows[2].tone).toBe("off");
  });

  it("world variant hides power until scouted", () => {
    expect(realmLedgerRows({ name: "V", stance: "wary", peaceLeft: 0, opinion: 0, scouted: false })[2].value).toBe("?");
    expect(realmLedgerRows({ name: "V", stance: "wary", peaceLeft: 0, opinion: 0, power: 42, scouted: true })[2].value).toBe("42");
  });
});

describe("pact ledger rows", () => {
  it("uses the same cold rule as the Join button", () => {
    expect(pactLedgerRows({ name: "P", stance: -11, member: false, sworn: 2 })[1].sub).toBe("too cold to join");
    expect(pactLedgerRows({ name: "P", stance: -10, member: false, sworn: 2 })[1].sub).toBe("open to you");
    expect(pactLedgerRows({ name: "P", stance: -50, member: true, sworn: 2 })[1].sub).toBe("member");
  });

  it("power row reads sworn count", () => {
    const rows = pactLedgerRows({ name: "P", kind: "pact", stance: 0, member: true, sworn: 3, leadsIt: true });
    expect(rows[2].value).toBe("3 sworn");
    expect(rows[2].sub).toBe("you lead");
    const html = renderToStaticMarkup(<DiploLedger rows={rows} />);
    expect(inOrder(html, ["Pact", "Stance", "Power", "3 sworn"])).toBe(true);
  });
});

describe("cards keep their buttons after the rows", () => {
  it("RealmCard: rows then Declare war and Gift", () => {
    const s = createGameState({ seed: 1 });
    const realm = s.realms.find((r) => r.id !== "player")!;
    const html = renderToStaticMarkup(
      <RealmCard realm={realm} stance="friendly" peaceLeft={0} opinion={30} mine={20} theirs={20} declareLocked={false} onDeclare={noop} onGift={noop} />,
    );
    expect(inOrder(html, ["sc-diplo-ledger", realm.name, "Friendly", "20 vs 20", "Declare war", "Gift 15 gold"])).toBe(true);
  });

  it("WorldPanel: realm and pact cards render rows and keep Join/Leave", () => {
    const s = createGameState({ seed: 1 });
    const html = renderToStaticMarkup(<WorldPanel state={s} onFoundGuild={noop} onJoin={noop} onLeave={noop} />);
    expect(html).toContain("sc-diplo-ledger");
    if ((s.factions ?? []).length > 0) {
      const f = s.factions![0];
      expect(inOrder(html, [f.name, `${f.memberRealmIds.length} sworn`])).toBe(true);
      expect(html).toMatch(/>(Join|Leave)</);
    }
  });

  it("styles live in a dedicated file with reduced-motion guard", () => {
    const css = readCssFile("./diplo-living.css");
    expect(css).toContain(".sc-diplo-ledger-row");
    expect(css).toContain("prefers-reduced-motion");
  });
});
