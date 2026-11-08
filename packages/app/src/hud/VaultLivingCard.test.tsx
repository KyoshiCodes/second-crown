import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createGameState, resourceLedger } from "@second-crown/sim";
import { VAULT_RESOURCES, VaultLivingCards, vaultRows } from "./VaultLivingCard";

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

function fresh() {
  return createGameState({ seed: 1 });
}

describe("vaultRows", () => {
  it("stacks name, stock, safety for every store", () => {
    const s = fresh();
    for (const res of VAULT_RESOURCES) {
      expect(vaultRows(s, res).map((r) => r.kind)).toEqual(["name", "stock", "safety"]);
    }
  });

  it("reads safety straight from the ledger", () => {
    const s = fresh();
    s.resources.food = "0";
    const bare = vaultRows(s, "food")[2]!;
    expect(bare).toMatchObject({ value: "All hidden", tone: "safe" });

    const l = resourceLedger(s, "food");
    s.resources.food = String(l.vault + 5);
    const exposed = vaultRows(s, "food")[2]!;
    expect(exposed.tone).toBe("warn");
    expect(exposed.value).toBe("5 exposed");
  });

  it("flags a full store on the stock row", () => {
    const s = fresh();
    const cap = resourceLedger(s, "wood").cap;
    if (!Number.isFinite(cap)) return;
    s.resources.wood = String(cap);
    expect(vaultRows(s, "wood")[1]).toMatchObject({ tone: "danger" });
    expect(vaultRows(s, "wood")[1]!.sub).toContain("full");
  });

  it("does not change state", () => {
    const s = fresh();
    const before = JSON.stringify(s);
    for (const res of VAULT_RESOURCES) vaultRows(s, res);
    renderToStaticMarkup(<VaultLivingCards state={s} />);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("VaultLivingCards", () => {
  it("renders four living vault cards", () => {
    const html = renderToStaticMarkup(<VaultLivingCards state={fresh()} />);
    expect(html.match(/sc-vault-card is-living/g)?.length).toBe(4);
    expect(html).toContain("Gold vault");
  });

  it("styles live in vault-living.css, not theme.css", () => {
    expect(readFile("./vault-living.css")).toContain(".sc-vault-card-row");
    expect(readFile("../theme.css")).not.toContain("sc-vault-card");
  });
});
