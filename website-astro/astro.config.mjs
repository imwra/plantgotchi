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
        // Force all @libsql/client imports (including from @libsql/kysely-libsql)
        // to use the web/fetch-based implementation instead of Node.js https
        "@libsql/client": new URL("./node_modules/@libsql/client/lib-esm/http.js", import.meta.url).pathname,
      },
    },
  },
});
