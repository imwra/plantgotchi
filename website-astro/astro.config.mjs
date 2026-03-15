import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://imwra.github.io",
  base: "/plantgotchi",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
