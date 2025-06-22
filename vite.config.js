import { defineConfig } from 'vite';
import inject from "@rollup/plugin-inject";

export default defineConfig({
  plugins: [
    inject({  // Based on https://dev.to/chmich/setup-jquery-on-vite-598k
        $: 'jquery',
        jQuery: 'jquery',
    })
  ],
  commonjsOptions: { transformMixedEsModules: true },
  root: '.', // project root
  base: './', // relative paths for assets
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html'
    }
  },
  server: {
    open: true,
    port: 5173
  }
});