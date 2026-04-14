import { existsSync, readFileSync } from "node:fs";

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

const readme = readFileSync("README.md", "utf8");
const readmeChecks = [
  [/website-astro/i, "README must mention website-astro as the primary web app"],
  [
    /manual logging/i,
    "README must describe manual logging as the current supported operating model",
  ],
  [/android/i, "README must mention the Android app status"],
  [
    /incomplete|in progress|work in progress/i,
    "README must describe Android as incomplete or in progress",
  ],
];

for (const [pattern, message] of readmeChecks) {
  if (!pattern.test(readme)) {
    console.error(message);
    process.exit(1);
  }
}

if (/Framework:\s*\*\*Next\.js 15/i.test(readme)) {
  console.error("README still claims the web stack is Next.js 15.");
  process.exit(1);
}

console.log("Repo consistency verified.");
