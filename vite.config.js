import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist", // Output directory for bundled files
  },
  esbuild: {
    supported: {
      "top-level-await": true, //browsers can handle top-level-await features
    },
  },
});
