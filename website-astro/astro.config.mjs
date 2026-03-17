import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  integrations: [react()],
  i18n: {
    defaultLocale: "pt-br",
    locales: ["pt-br", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        // Force @libsql/client to use fetch-based HTTP client (no WebSocket/Node deps)
        "@libsql/client": new URL("./node_modules/@libsql/client/lib-esm/http.js", import.meta.url).pathname,
        // Replace node-fetch with global fetch (available in Cloudflare Workers)
        "node-fetch": new URL("./src/lib/fetch-shim.ts", import.meta.url).pathname,
      },
    },
  },
});
