// Writes the bot run into docs/PLAYTEST.md. Not part of `npm test`:
// run it with `npm run playtest` from the repo root.
import { it, expect } from "vitest";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { runPlaytest, playtestMarkdown } from "./playtestHarness.js";

const START = "<!-- sim-playtest:start -->";
const END = "<!-- sim-playtest:end -->";

it("writes docs/PLAYTEST.md", () => {
  const report = runPlaytest();
  const block = `${START}\n${playtestMarkdown(report)}\n${END}`;
  const file = resolve(process.cwd(), "../../docs/PLAYTEST.md");
  const old = existsSync(file) ? readFileSync(file, "utf8") : "# Playtest\n";
  // Replace our marked block; otherwise insert it right after the title line.
  let next: string;
  if (old.includes(START) && old.includes(END)) {
    next = old.slice(0, old.indexOf(START)) + block + old.slice(old.indexOf(END) + END.length);
  } else {
    const cut = old.indexOf("\n") + 1;
    next = `${old.slice(0, cut)}\n${block}\n\n${old.slice(cut).replace(/^\r?\n/, "")}`;
  }
  writeFileSync(file, next.endsWith("\n") ? next : `${next}\n`);
  console.log(`playtest: ${report.ticksRun} ticks, ${report.errors.length} errors, ${report.failedAsserts.length} failed asserts -> ${file}`);
  expect(report.ticksRun).toBeGreaterThan(0);
});
