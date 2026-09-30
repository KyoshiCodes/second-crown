import { defineConfig } from "vitest/config";

// Only the playtest writer. `npm test` uses vitest.config.ts and never touches docs/.
export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["src/harness/playtest.report.ts"],
  },
});
