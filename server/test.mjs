// Runs every server/*.test.mjs under node:test. Root `npm test` calls this.
// A failing test sets a non-zero exit code, so `npm test` fails too.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const files = fs.readdirSync(here).filter((f) => f.endsWith(".test.mjs")).sort();

if (files.length === 0) {
  console.error("server tests: none found");
  process.exit(1);
}

console.log(`server tests (${files.length} files):`);
for (const f of files) console.log(`  server/${f}`);

const run = spawnSync(
  process.execPath,
  ["--test", "--test-reporter=spec", ...files.map((f) => path.join(here, f))],
  { stdio: "inherit", cwd: path.dirname(here) },
);
if (run.error) throw run.error;
process.exit(run.status ?? 1);
