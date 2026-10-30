import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const p = id.replace(/\\/g, "/");
          if (p.includes("node_modules/pixi.js") || p.includes("/pixi.js/")) return "pixi";
          if (/node_modules\/(react|react-dom|scheduler)\//.test(p)) return "react";
          if (p.includes("/packages/sim/") || p.includes("node_modules/break_infinity")) return "sim";
        },
      },
    },
  },
});
