import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: './' so the build works on GitHub Pages project sites
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
