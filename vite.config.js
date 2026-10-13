import { defineConfig } from "vite";
import { handleEnvioRequest } from "./envio.mjs";

// Serves /api/envio the same way server.mjs does, so the launch feed works in dev.
const envioApi = {
  name: "lilune-envio-api",
  configureServer(server) {
    server.middlewares.use("/api/envio", (request, response) => {
      handleEnvioRequest(request.originalUrl || request.url, response);
    });
  },
};

export default defineConfig({
  plugins: [envioApi],
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
