import { describe, expect, it } from "vitest";

function readTextFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: { getBuiltinModule?: (id: string) => { readFileSync: (path: URL, encoding: string) => string } };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("living-readability.css", () => {
  const css = readTextFile("./living-readability.css");

  it("covers every stacked ledger row family", () => {
    for (const fam of ["decree", "diplo", "events", "study", "force"]) {
      expect(css).toContain(`.sc-${fam}-ledger-row`);
    }
  });

  it("never restyles action buttons", () => {
    const selectors = css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("{")
      .slice(0, -1)
      .map((chunk) => chunk.split(/[;}]/).pop() ?? "")
      .join("\n");
    expect(selectors).not.toMatch(/button|-btn\b/i);
  });

  it("keeps label and caption opacity at a readable floor", () => {
    const opacities = [...css.matchAll(/opacity:\s*([\d.]+)/g)].map((m) => Number(m[1]));
    expect(opacities.length).toBeGreaterThan(0);
    for (const o of opacities) expect(o).toBeGreaterThanOrEqual(0.6);
  });

  it("is loaded from main.tsx after theme.css", () => {
    const main = readTextFile("../main.tsx");
    const theme = main.indexOf('import "./theme.css"');
    const polish = main.indexOf('import "./hud/living-readability.css"');
    expect(theme).toBeGreaterThanOrEqual(0);
    expect(polish).toBeGreaterThan(theme);
  });
});
