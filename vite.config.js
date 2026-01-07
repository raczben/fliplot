import { defineConfig } from "vite";
import inject from "@rollup/plugin-inject";

export default defineConfig({
  plugins: [
    inject({
      // Based on https://dev.to/chmich/setup-jquery-on-vite-598k
      $: "jquery",
      jQuery: "jquery"
    })
  ],
  root: ".", // project root
  base: "./", // relative paths for assets
  build: {
    outDir: "dist",
    sourcemap: true,
    emptyOutDir: true,
    rollupOptions: {
      input: "index.html"
    },
    // https://stackoverflow.com/a/75538477/2506522
    commonjsOptions: { transformMixedEsModules: true } // Change
  },
  server: {
    port: 5173
  }
});
