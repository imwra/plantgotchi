import { existsSync } from "node:fs";

const requiredPaths = [
  "README.md",
  "android-app/app/src/main/AndroidManifest.xml",
  "website/package.json",
  "website-astro/package.json",
  "ingestion/package.json",
];

const missing = requiredPaths.filter((path) => !existsSync(path));

if (missing.length > 0) {
  console.error("Missing required repo paths:");
  for (const path of missing) {
    console.error(`- ${path}`);
  }
  process.exit(1);
}

console.log("Repo consistency verified.");
