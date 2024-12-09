import { defineConfig } from "vite";
import viteCompression from "vite-plugin-compression";

export default defineConfig({
  build: {
    outDir: "dist", // Output directory for bundled files
  },
  esbuild: {
    supported: {
      "top-level-await": true, //browsers can handle top-level-await features
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler", // or "modern"
      },
    },
  },
  plugins: [viteCompression()],
});
