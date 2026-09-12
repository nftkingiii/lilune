import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/api/kuru": {
        target: "https://exchange.kuru.io",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kuru/, "/api/v3"),
      },
    },
  },
});
