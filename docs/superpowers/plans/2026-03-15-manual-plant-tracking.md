# Manual Plant Tracking Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing Plantgotchi UI, Turso data layer, and rules engine together into a functional plant tracking app with auth, manual logging, and rules-based recommendations.

**Architecture:** Astro server mode with `@astrojs/node` adapter serves API routes that mediate between React components and Turso DB. Better Auth handles email/password authentication via session cookies. The existing rules engine runs server-side on each manual reading submission.

**Tech Stack:** Astro 6 (server mode), React 19, Better Auth, Turso/libsql, Vitest

**Spec:** `docs/superpowers/specs/2026-03-15-manual-plant-tracking-design.md`

---

## File Structure

### New Files
```
website-astro/
├── src/
│   ├── lib/
│   │   ├── auth.ts                         # Better Auth server config + getSession helper
│   │   └── plant-view.ts                   # PlantView type + transform functions
│   ├── components/
│   │   ├── AddPlantModal.tsx               # Modal form for creating plants
│   │   ├── CareLogForm.tsx                 # Care action buttons + notes
│   │   ├── ReadingForm.tsx                 # Manual sensor reading inputs
│   │   ├── RecommendationsList.tsx         # Severity-colored recommendation cards
│   │   └── CareHistory.tsx                 # Scrollable care log timeline
│   └── pages/
│       ├── login.astro                     # Login page
│       ├── signup.astro                    # Signup page
│       └── api/
│           ├── auth/[...all].ts            # Better Auth catch-all
│           ├── plants/
│           │   ├── index.ts                # GET (list) + POST (create)
│           │   └── [id].ts                 # GET (single plant + details)
│           ├── readings.ts                 # GET + POST
│           ├── care-logs.ts                # GET + POST
│           └── recommendations.ts          # GET + POST
├── tests/
│   ├── lib/
│   │   └── plant-view.test.ts             # PlantView transform tests
│   └── api/
│       ├── plants.test.ts                 # Plants API route tests
│       ├── readings.test.ts               # Readings API route tests
│       ├── care-logs.test.ts              # Care logs API route tests
│       └── recommendations.test.ts        # Recommendations API route tests
├── vitest.config.ts                        # Test configuration
└── .env.example                            # Environment variable template
```

### Modified Files
```
website-astro/
├── package.json                            # Add dependencies
├── astro.config.mjs                        # Server mode + node adapter
├── src/
│   ├── lib/db/
│   │   ├── client.ts                       # Fix env vars + import path
│   │   └── queries.ts                      # Add getPlantForUser
│   ├── components/
│   │   ├── GardenDashboard.tsx             # Full refactor to real data
│   │   └── SiteNav.tsx                     # Add auth state + logout
│   └── pages/
│       ├── garden.astro                    # Add auth guard + pass props
│       └── admin.astro                     # Add auth guard
```

---

## Chunk 1: Foundation (Config, Dependencies, DB Client, Auth)

### Task 1: Install Dependencies and Update Config

**Files:**
- Modify: `website-astro/package.json`
- Modify: `website-astro/astro.config.mjs`
- Create: `website-astro/.env.example`

- [ ] **Step 1: Install new dependencies**

Run:
```bash
cd /home/user/plantgotchi/website-astro
npm install better-auth @libsql/client @astrojs/node
```

Expected: 3 packages added to package.json dependencies.

- [ ] **Step 2: Update astro.config.mjs**

Replace entire file with:

```javascript
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

Key changes: removed `site` and `base` (no more GitHub Pages subpath), added `output: "server"` and `adapter: node()`.

- [ ] **Step 3: Create .env.example**

```env
TURSO_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
BETTER_AUTH_SECRET=your-secret-at-least-32-chars
```

- [ ] **Step 4: Verify build still works**

Run:
```bash
cd /home/user/plantgotchi/website-astro && npm run build
```

Expected: Build succeeds with server output mode.

- [ ] **Step 5: Commit**

```bash
cd /home/user/plantgotchi/website-astro
git add package.json package-lock.json astro.config.mjs .env.example
git commit -m "feat: add server mode, node adapter, auth + db dependencies"
```

---

### Task 2: Update DB Client

**Files:**
- Modify: `website-astro/src/lib/db/client.ts`

- [ ] **Step 1: Update client.ts imports and env vars**

Replace entire file content:

```typescript
import { createClient, type Client } from "@libsql/client";

let db: Client | null = null;

export function getDb(): Client {
  if (db) return db;

  const url = import.meta.env.TURSO_URL;
  const authToken = import.meta.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.warn("TURSO_URL not set, using in-memory SQLite");
    db = createClient({ url: ":memory:" });
  } else {
    db = createClient({ url, authToken });
  }

  return db;
}
```

Changes: `@libsql/client/web` → `@libsql/client`, `PUBLIC_TURSO_URL` → `TURSO_URL`, `PUBLIC_TURSO_AUTH_TOKEN` → `TURSO_AUTH_TOKEN`.

- [ ] **Step 2: Commit**

```bash
git add src/lib/db/client.ts
git commit -m "fix: use server-only env vars and native libsql client"
```

---

### Task 3: Add getPlantForUser Query

**Files:**
- Modify: `website-astro/src/lib/db/queries.ts`
- Create: `website-astro/tests/lib/plant-view.test.ts` (placeholder)
- Create: `website-astro/vitest.config.ts`

- [ ] **Step 1: Set up Vitest**

Run:
```bash
cd /home/user/plantgotchi/website-astro && npm install -D vitest
```

- [ ] **Step 2: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Add getPlantForUser to queries.ts**

Append after the existing `getPlant` function (~line 68):

```typescript
export async function getPlantForUser(
  id: string,
  userId: string
): Promise<Plant | null> {
  const plant = await getPlant(id);
  if (!plant || plant.user_id !== userId) return null;
  return plant;
}

export async function getRecommendationById(
  id: string
): Promise<Recommendation | null> {
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT * FROM recommendations WHERE id = ?",
    args: [id],
  });
  return (result.rows[0] as unknown as Recommendation) ?? null;
}
```

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json src/lib/db/queries.ts
git commit -m "feat: add vitest setup and getPlantForUser query helper"
```

---

### Task 4: Set Up Better Auth

**Files:**
- Create: `website-astro/src/lib/auth.ts`
- Create: `website-astro/src/pages/api/auth/[...all].ts`

- [ ] **Step 1: Create auth configuration**

Create `src/lib/auth.ts`.

**Important:** Better Auth's built-in `type: "sqlite"` adapter expects a `better-sqlite3` instance, not a libsql `Client`. For Turso/libsql, use the Kysley adapter or pass the libsql client directly. The implementer MUST check the [Better Auth database docs](https://www.better-auth.com/docs/concepts/database) for the current libsql/Turso integration pattern and adapt accordingly.

The structure should be:

```typescript
import { betterAuth } from "better-auth";
import { getDb } from "./db/client";

// ADAPTER NOTE: The exact database config depends on Better Auth's current
// libsql support. Check docs. Common patterns:
//
// Option A (if Better Auth supports libsql directly):
//   database: { db: getDb(), type: "sqlite" }
//
// Option B (using Better Auth's Kysley adapter):
//   import { kyselyAdapter } from "better-auth/adapters/kysely";
//   database: kyselyAdapter(db, { type: "sqlite" })
//
// Option C (raw libsql — newest Better Auth versions):
//   database: getDb()
//
// Pick whichever compiles and passes the build step below.

export const auth = betterAuth({
  database: getDb(),  // Adjust per docs — see note above
  secret: import.meta.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
});

export async function getSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return session;
}
```

- [ ] **Step 2: Create auth API catch-all route**

Create `src/pages/api/auth/[...all].ts`:

```typescript
import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";

export const ALL: APIRoute = async ({ request }) => {
  return auth.handler(request);
};
```

- [ ] **Step 3: Verify auth endpoints respond**

Run:
```bash
cd /home/user/plantgotchi/website-astro && npm run build
```

Expected: Build succeeds. (Full auth testing requires a running server + database, which we'll verify in integration.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.ts src/pages/api/auth/
git commit -m "feat: set up Better Auth with libsql adapter and catch-all route"
```

---

## Chunk 2: API Routes

### Task 5: Plants API Routes

**Files:**
- Create: `website-astro/src/pages/api/plants/index.ts`
- Create: `website-astro/src/pages/api/plants/[id].ts`

- [ ] **Step 1: Create plants list + create route**

Create `src/pages/api/plants/index.ts`:

```typescript
import type { APIRoute } from "astro";
import { getSession } from "../../../lib/auth";
import {
  getPlants,
  getLatestReading,
  getCareLogs,
  createPlant,
} from "../../../lib/db/queries";
import { randomUUID } from "node:crypto";

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const plants = await getPlants(session.user.id);

  const augmented = await Promise.all(
    plants.map(async (plant) => {
      const [latestReading, recentCareLogs] = await Promise.all([
        getLatestReading(plant.id),
        getCareLogs(plant.id, 5),
      ]);
      return { plant, latestReading, recentCareLogs };
    })
  );

  return new Response(JSON.stringify(augmented), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await request.json();
  const { name, species, emoji, light_preference, moisture_min, moisture_max, temp_min, temp_max } = body;

  if (!name || !emoji) {
    return new Response(JSON.stringify({ error: "Name and emoji are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const plant = {
    id: randomUUID(),
    user_id: session.user.id,
    name,
    species: species || null,
    emoji,
    photo_url: null,
    light_preference: light_preference || "medium",
    moisture_min: moisture_min ?? 30,
    moisture_max: moisture_max ?? 80,
    temp_min: temp_min ?? 15,
    temp_max: temp_max ?? 30,
  };

  await createPlant(plant);

  return new Response(JSON.stringify(plant), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
```

- [ ] **Step 2: Create single plant route**

Create `src/pages/api/plants/[id].ts`:

```typescript
import type { APIRoute } from "astro";
import { getSession } from "../../../lib/auth";
import {
  getPlantForUser,
  getLatestReading,
  getRecommendations,
  getCareLogs,
} from "../../../lib/db/queries";

export const GET: APIRoute = async ({ params, request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = params;
  if (!id) return new Response("Not found", { status: 404 });

  const plant = await getPlantForUser(id, session.user.id);
  if (!plant) return new Response("Not found", { status: 404 });

  const [latestReading, recommendations, recentCareLogs] = await Promise.all([
    getLatestReading(id),
    getRecommendations(id, 5),
    getCareLogs(id, 10),
  ]);

  return new Response(
    JSON.stringify({ plant, latestReading, recommendations, recentCareLogs }),
    { headers: { "Content-Type": "application/json" } }
  );
};
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/plants/
git commit -m "feat: add plants API routes (list, create, get single)"
```

---

### Task 6: Readings API Route

**Files:**
- Create: `website-astro/src/pages/api/readings.ts`

- [ ] **Step 1: Create readings route**

Create `src/pages/api/readings.ts`:

```typescript
import type { APIRoute } from "astro";
import { getSession } from "../../lib/auth";
import {
  getPlantForUser,
  getRecentReadings,
  addSensorReading,
  addRecommendation,
} from "../../lib/db/queries";
import { evaluatePlant } from "../../lib/agents/rules";
import { randomUUID } from "node:crypto";

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const plantId = url.searchParams.get("plantId");
  const days = parseInt(url.searchParams.get("days") || "7", 10);

  if (!plantId) {
    return new Response(JSON.stringify({ error: "plantId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const plant = await getPlantForUser(plantId, session.user.id);
  if (!plant) return new Response("Not found", { status: 404 });

  const readings = await getRecentReadings(plantId, days);
  return new Response(JSON.stringify(readings), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await request.json();
  const { plant_id, moisture, temperature, light } = body;

  if (!plant_id) {
    return new Response(JSON.stringify({ error: "plant_id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const plant = await getPlantForUser(plant_id, session.user.id);
  if (!plant) return new Response("Not found", { status: 404 });

  const sensorId = `manual-${randomUUID()}`;
  const now = new Date().toISOString();

  const readingData = {
    plant_id,
    sensor_id: sensorId,
    moisture: moisture ?? null,
    temperature: temperature ?? null,
    light: light ?? null,
    battery: null,
  };

  await addSensorReading(readingData);

  // Evaluate rules engine with synthetic SensorReading (id: 0 is unused by evaluatePlant)
  const syntheticReading = {
    id: 0,
    ...readingData,
    timestamp: now,
  };

  const recommendations = evaluatePlant(plant, syntheticReading);

  // Persist each recommendation
  for (const rec of recommendations) {
    await addRecommendation(rec);
  }

  return new Response(
    JSON.stringify({ reading: syntheticReading, recommendations }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/readings.ts
git commit -m "feat: add readings API route with rules engine integration"
```

---

### Task 7: Care Logs API Route

**Files:**
- Create: `website-astro/src/pages/api/care-logs.ts`

- [ ] **Step 1: Create care-logs route**

Create `src/pages/api/care-logs.ts`:

```typescript
import type { APIRoute } from "astro";
import { getSession } from "../../lib/auth";
import { getPlantForUser, addCareLog, getCareLogs } from "../../lib/db/queries";
import { randomUUID } from "node:crypto";

const VALID_ACTIONS = [
  "water",
  "fertilize",
  "repot",
  "prune",
  "mist",
  "pest_treatment",
  "other",
] as const;

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const plantId = url.searchParams.get("plantId");
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);

  if (!plantId) {
    return new Response(JSON.stringify({ error: "plantId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const plant = await getPlantForUser(plantId, session.user.id);
  if (!plant) return new Response("Not found", { status: 404 });

  const logs = await getCareLogs(plantId, limit);
  return new Response(JSON.stringify(logs), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await request.json();
  const { plant_id, action, notes } = body;

  if (!plant_id || !action) {
    return new Response(JSON.stringify({ error: "plant_id and action required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!(VALID_ACTIONS as readonly string[]).includes(action)) {
    return new Response(
      JSON.stringify({ error: `Invalid action. Valid: ${VALID_ACTIONS.join(", ")}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const plant = await getPlantForUser(plant_id, session.user.id);
  if (!plant) return new Response("Not found", { status: 404 });

  const careLog = {
    id: randomUUID(),
    plant_id,
    user_id: session.user.id,
    action,
    notes: notes || null,
  };

  await addCareLog(careLog);

  return new Response(JSON.stringify({ ...careLog, created_at: new Date().toISOString() }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/care-logs.ts
git commit -m "feat: add care-logs API route"
```

---

### Task 8: Recommendations API Route

**Files:**
- Create: `website-astro/src/pages/api/recommendations.ts`

- [ ] **Step 1: Create recommendations route**

Create `src/pages/api/recommendations.ts`:

```typescript
import type { APIRoute } from "astro";
import { getSession } from "../../lib/auth";
import {
  getPlantForUser,
  getRecommendations,
  getRecommendationById,
  markRecommendationActedOn,
} from "../../lib/db/queries";

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const plantId = url.searchParams.get("plantId");

  if (!plantId) {
    return new Response(JSON.stringify({ error: "plantId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const plant = await getPlantForUser(plantId, session.user.id);
  if (!plant) return new Response("Not found", { status: 404 });

  const recommendations = await getRecommendations(plantId);
  return new Response(JSON.stringify(recommendations), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: "id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify ownership: fetch the recommendation, then check its plant belongs to user
  const rec = await getRecommendationById(id);
  if (!rec) return new Response("Not found", { status: 404 });

  const plant = await getPlantForUser(rec.plant_id, session.user.id);
  if (!plant) return new Response("Not found", { status: 404 });

  await markRecommendationActedOn(id);

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/recommendations.ts
git commit -m "feat: add recommendations API route"
```

---

## Chunk 3: Auth Pages and Guards

### Task 9: Login and Signup Pages

**Files:**
- Create: `website-astro/src/pages/login.astro`
- Create: `website-astro/src/pages/signup.astro`

- [ ] **Step 1: Create login page**

Create `src/pages/login.astro`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { getSession } from "../lib/auth";

const session = await getSession(Astro.request);
if (session) {
  return Astro.redirect("/garden");
}
---

<BaseLayout title="Login - Plantgotchi">
  <div class="min-h-screen flex items-center justify-center bg-cream p-4">
    <div class="w-full max-w-sm">
      <div
        style="border: 3px solid #2d2d2d; border-radius: 8px; background: #f5f0e1; padding: 2rem; box-shadow: 4px 4px 0 #2d2d2d;"
      >
        <h1
          style="font-family: 'Press Start 2P', monospace; font-size: 1.1rem; color: #4a9e3f; text-align: center; margin-bottom: 1.5rem;"
        >
          LOGIN
        </h1>

        <form id="login-form">
          <div style="margin-bottom: 1rem;">
            <label
              style="font-family: 'Press Start 2P', monospace; font-size: 0.6rem; color: #2d2d2d; display: block; margin-bottom: 0.5rem;"
            >
              EMAIL
            </label>
            <input
              type="email"
              name="email"
              required
              style="width: 100%; padding: 0.5rem; border: 2px solid #2d2d2d; border-radius: 4px; font-family: monospace; font-size: 0.85rem; background: #fff;"
            />
          </div>

          <div style="margin-bottom: 1.5rem;">
            <label
              style="font-family: 'Press Start 2P', monospace; font-size: 0.6rem; color: #2d2d2d; display: block; margin-bottom: 0.5rem;"
            >
              PASSWORD
            </label>
            <input
              type="password"
              name="password"
              required
              minlength="8"
              style="width: 100%; padding: 0.5rem; border: 2px solid #2d2d2d; border-radius: 4px; font-family: monospace; font-size: 0.85rem; background: #fff;"
            />
          </div>

          <div
            id="error-msg"
            style="display: none; font-family: 'Press Start 2P', monospace; font-size: 0.55rem; color: #c0392b; border: 2px solid #c0392b; padding: 0.5rem; margin-bottom: 1rem; border-radius: 4px; background: #fdecea;"
          >
          </div>

          <button
            type="submit"
            style="width: 100%; padding: 0.75rem; background: #4a9e3f; color: #f0ead6; border: 2px solid #2d2d2d; border-radius: 4px; font-family: 'Press Start 2P', monospace; font-size: 0.7rem; cursor: pointer; box-shadow: 2px 2px 0 #2d2d2d;"
          >
            ENTER GARDEN
          </button>
        </form>

        <p
          style="text-align: center; margin-top: 1rem; font-family: 'Press Start 2P', monospace; font-size: 0.5rem; color: #666;"
        >
          No account? <a href="/signup" style="color: #4a9e3f; text-decoration: underline;">SIGN UP</a>
        </p>
      </div>
    </div>
  </div>

  <script>
    const form = document.getElementById("login-form") as HTMLFormElement;
    const errorMsg = document.getElementById("error-msg") as HTMLDivElement;
    const submitBtn = form.querySelector("button[type=submit]") as HTMLButtonElement;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorMsg.style.display = "none";
      submitBtn.disabled = true;
      submitBtn.textContent = "...";

      const formData = new FormData(form);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      try {
        const res = await fetch("/api/auth/sign-in/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          errorMsg.textContent = data.message || "Invalid email or password";
          errorMsg.style.display = "block";
          submitBtn.disabled = false;
          submitBtn.textContent = "ENTER GARDEN";
          return;
        }

        window.location.href = "/garden";
      } catch {
        errorMsg.textContent = "Network error. Try again.";
        errorMsg.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.textContent = "ENTER GARDEN";
      }
    });
  </script>
</BaseLayout>
```

- [ ] **Step 2: Create signup page**

Create `src/pages/signup.astro`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { getSession } from "../lib/auth";

const session = await getSession(Astro.request);
if (session) {
  return Astro.redirect("/garden");
}
---

<BaseLayout title="Sign Up - Plantgotchi">
  <div class="min-h-screen flex items-center justify-center bg-cream p-4">
    <div class="w-full max-w-sm">
      <div
        style="border: 3px solid #2d2d2d; border-radius: 8px; background: #f5f0e1; padding: 2rem; box-shadow: 4px 4px 0 #2d2d2d;"
      >
        <h1
          style="font-family: 'Press Start 2P', monospace; font-size: 1.1rem; color: #4a9e3f; text-align: center; margin-bottom: 1.5rem;"
        >
          SIGN UP
        </h1>

        <form id="signup-form">
          <div style="margin-bottom: 1rem;">
            <label
              style="font-family: 'Press Start 2P', monospace; font-size: 0.6rem; color: #2d2d2d; display: block; margin-bottom: 0.5rem;"
            >
              NAME
            </label>
            <input
              type="text"
              name="name"
              required
              style="width: 100%; padding: 0.5rem; border: 2px solid #2d2d2d; border-radius: 4px; font-family: monospace; font-size: 0.85rem; background: #fff;"
            />
          </div>

          <div style="margin-bottom: 1rem;">
            <label
              style="font-family: 'Press Start 2P', monospace; font-size: 0.6rem; color: #2d2d2d; display: block; margin-bottom: 0.5rem;"
            >
              EMAIL
            </label>
            <input
              type="email"
              name="email"
              required
              style="width: 100%; padding: 0.5rem; border: 2px solid #2d2d2d; border-radius: 4px; font-family: monospace; font-size: 0.85rem; background: #fff;"
            />
          </div>

          <div style="margin-bottom: 1.5rem;">
            <label
              style="font-family: 'Press Start 2P', monospace; font-size: 0.6rem; color: #2d2d2d; display: block; margin-bottom: 0.5rem;"
            >
              PASSWORD
            </label>
            <input
              type="password"
              name="password"
              required
              minlength="8"
              style="width: 100%; padding: 0.5rem; border: 2px solid #2d2d2d; border-radius: 4px; font-family: monospace; font-size: 0.85rem; background: #fff;"
            />
          </div>

          <div
            id="error-msg"
            style="display: none; font-family: 'Press Start 2P', monospace; font-size: 0.55rem; color: #c0392b; border: 2px solid #c0392b; padding: 0.5rem; margin-bottom: 1rem; border-radius: 4px; background: #fdecea;"
          >
          </div>

          <button
            type="submit"
            style="width: 100%; padding: 0.75rem; background: #4a9e3f; color: #f0ead6; border: 2px solid #2d2d2d; border-radius: 4px; font-family: 'Press Start 2P', monospace; font-size: 0.7rem; cursor: pointer; box-shadow: 2px 2px 0 #2d2d2d;"
          >
            CREATE ACCOUNT
          </button>
        </form>

        <p
          style="text-align: center; margin-top: 1rem; font-family: 'Press Start 2P', monospace; font-size: 0.5rem; color: #666;"
        >
          Have an account? <a href="/login" style="color: #4a9e3f; text-decoration: underline;">LOGIN</a>
        </p>
      </div>
    </div>
  </div>

  <script>
    const form = document.getElementById("signup-form") as HTMLFormElement;
    const errorMsg = document.getElementById("error-msg") as HTMLDivElement;
    const submitBtn = form.querySelector("button[type=submit]") as HTMLButtonElement;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorMsg.style.display = "none";
      submitBtn.disabled = true;
      submitBtn.textContent = "...";

      const formData = new FormData(form);
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      try {
        const res = await fetch("/api/auth/sign-up/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          errorMsg.textContent = data.message || "Could not create account";
          errorMsg.style.display = "block";
          submitBtn.disabled = false;
          submitBtn.textContent = "CREATE ACCOUNT";
          return;
        }

        window.location.href = "/garden";
      } catch {
        errorMsg.textContent = "Network error. Try again.";
        errorMsg.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.textContent = "CREATE ACCOUNT";
      }
    });
  </script>
</BaseLayout>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/login.astro src/pages/signup.astro
git commit -m "feat: add login and signup pages with retro pixel-art style"
```

---

### Task 10: Add Auth Guards to Protected Pages

**Files:**
- Modify: `website-astro/src/pages/garden.astro`
- Modify: `website-astro/src/pages/admin.astro`

- [ ] **Step 1: Update garden.astro with auth guard and user props**

Replace `src/pages/garden.astro` with:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import GardenDashboard from "../components/GardenDashboard";
import { getSession } from "../lib/auth";

const session = await getSession(Astro.request);
if (!session) {
  return Astro.redirect("/login");
}

const userName = session.user.name || session.user.email;
---

<BaseLayout title="Garden - Plantgotchi">
  <GardenDashboard client:load userName={userName} />
</BaseLayout>
```

- [ ] **Step 2: Update admin.astro with auth guard**

Replace `src/pages/admin.astro` with:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import AdminDashboard from "../components/AdminDashboard";
import { getSession } from "../lib/auth";

const session = await getSession(Astro.request);
if (!session) {
  return Astro.redirect("/login");
}
---

<BaseLayout title="Admin - Plantgotchi">
  <AdminDashboard client:load />
</BaseLayout>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/garden.astro src/pages/admin.astro
git commit -m "feat: add auth guards to garden and admin pages"
```

---

## Chunk 4: PlantView Model and Component Refactor

### Task 11: Create PlantView Transform Module

**Files:**
- Create: `website-astro/src/lib/plant-view.ts`
- Create: `website-astro/tests/lib/plant-view.test.ts`

- [ ] **Step 1: Write failing tests for PlantView transforms**

Create `tests/lib/plant-view.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  computeHP,
  computeStatus,
  getLightLabel,
  toPlantView,
  type PlantView,
} from "../../src/lib/plant-view";

describe("getLightLabel", () => {
  it("returns 'low' for light < 1000", () => {
    expect(getLightLabel(500)).toBe("low");
    expect(getLightLabel(0)).toBe("low");
    expect(getLightLabel(999)).toBe("low");
  });

  it("returns 'medium' for light 1000-2000", () => {
    expect(getLightLabel(1000)).toBe("medium");
    expect(getLightLabel(1500)).toBe("medium");
    expect(getLightLabel(2000)).toBe("medium");
  });

  it("returns 'high' for light > 2000", () => {
    expect(getLightLabel(2001)).toBe("high");
    expect(getLightLabel(5000)).toBe("high");
  });

  it("returns 'unknown' for null", () => {
    expect(getLightLabel(null)).toBe("unknown");
  });
});

describe("computeHP", () => {
  it("returns 50 when no readings", () => {
    expect(computeHP(null, null, 30, 80, 15, 30)).toBe(50);
  });

  it("returns 100 when readings at midpoint", () => {
    // moisture midpoint = 55, temp midpoint = 22.5
    expect(computeHP(55, 22.5, 30, 80, 15, 30)).toBe(100);
  });

  it("returns 0 when readings at extreme", () => {
    // moisture at 0 with range 30-80: midpoint=55, halfRange=25
    // score = 100 - (|0-55|/25)*100 = 100 - 220 = clamped to 0
    expect(computeHP(0, null, 30, 80, 15, 30)).toBe(0);
  });

  it("averages moisture and temp scores", () => {
    // moisture at midpoint (55): score = 100
    // temp at min (15): midpoint=22.5, halfRange=7.5, score = 100 - (7.5/7.5)*100 = 0
    // average = 50
    expect(computeHP(55, 15, 30, 80, 15, 30)).toBe(50);
  });

  it("uses only available metrics", () => {
    // Only moisture at midpoint → HP = 100
    expect(computeHP(55, null, 30, 80, 15, 30)).toBe(100);
  });
});

describe("computeStatus", () => {
  it("returns 'unknown' when no readings", () => {
    expect(computeStatus(null, null, 30, 80, 15, 30)).toBe("unknown");
  });

  it("returns 'happy' when all in range", () => {
    expect(computeStatus(50, 22, 30, 80, 15, 30)).toBe("happy");
  });

  it("returns 'thirsty' when moisture below min", () => {
    expect(computeStatus(10, 22, 30, 80, 15, 30)).toBe("thirsty");
  });

  it("returns 'thirsty' when moisture above max", () => {
    expect(computeStatus(90, 22, 30, 80, 15, 30)).toBe("thirsty");
  });

  it("returns 'thirsty' when temp out of range", () => {
    expect(computeStatus(50, 35, 30, 80, 15, 30)).toBe("thirsty");
  });

  it("returns 'happy' when only some metrics present and in range", () => {
    expect(computeStatus(50, null, 30, 80, 15, 30)).toBe("happy");
  });
});

describe("toPlantView", () => {
  const basePlant = {
    id: "abc-123",
    user_id: "user-1",
    name: "Fern",
    species: "Nephrolepis",
    emoji: "🌿",
    photo_url: null,
    light_preference: "medium",
    moisture_min: 30,
    moisture_max: 80,
    temp_min: 15,
    temp_max: 30,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };

  it("transforms plant with no reading and no care logs", () => {
    const view = toPlantView(basePlant, null, []);
    expect(view.id).toBe("abc-123");
    expect(view.name).toBe("Fern");
    expect(view.moisture).toBeNull();
    expect(view.temp).toBeNull();
    expect(view.light).toBeNull();
    expect(view.lightLabel).toBe("unknown");
    expect(view.lastWatered).toBeNull();
    expect(view.status).toBe("unknown");
    expect(view.hp).toBe(50);
  });

  it("transforms plant with reading", () => {
    const reading = {
      id: 1,
      plant_id: "abc-123",
      sensor_id: "manual-xxx",
      moisture: 55,
      temperature: 22.5,
      light: 1500,
      battery: null,
      timestamp: "2026-03-15T12:00:00Z",
    };
    const view = toPlantView(basePlant, reading, []);
    expect(view.moisture).toBe(55);
    expect(view.temp).toBe(22.5);
    expect(view.light).toBe(1500);
    expect(view.lightLabel).toBe("medium");
    expect(view.status).toBe("happy");
    expect(view.hp).toBe(100);
  });

  it("derives lastWatered from care logs", () => {
    const logs = [
      { id: "1", plant_id: "abc-123", user_id: "user-1", action: "water", notes: null, created_at: "2026-03-15T10:00:00Z" },
      { id: "2", plant_id: "abc-123", user_id: "user-1", action: "fertilize", notes: null, created_at: "2026-03-14T10:00:00Z" },
    ];
    const view = toPlantView(basePlant, null, logs);
    expect(view.lastWatered).toBe("2026-03-15T10:00:00Z");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
cd /home/user/plantgotchi/website-astro && npx vitest run tests/lib/plant-view.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement plant-view.ts**

Create `src/lib/plant-view.ts`:

```typescript
import type { Plant, SensorReading, CareLog } from "./db/queries";

export interface PlantView {
  id: string;
  name: string;
  species: string;
  emoji: string;
  moisture: number | null;
  temp: number | null;
  light: number | null;
  lightLabel: string;
  lastWatered: string | null;
  status: "happy" | "thirsty" | "unknown";
  hp: number;
  moistureMin: number;
  moistureMax: number;
  tempMin: number;
  tempMax: number;
}

export function getLightLabel(light: number | null): string {
  if (light === null) return "unknown";
  if (light < 1000) return "low";
  if (light <= 2000) return "medium";
  return "high";
}

export function computeHP(
  moisture: number | null,
  temp: number | null,
  moistureMin: number,
  moistureMax: number,
  tempMin: number,
  tempMax: number
): number {
  const scores: number[] = [];

  if (moisture !== null) {
    const mid = (moistureMin + moistureMax) / 2;
    const half = (moistureMax - moistureMin) / 2;
    const score = Math.max(0, Math.min(100, 100 - (Math.abs(moisture - mid) / half) * 100));
    scores.push(score);
  }

  if (temp !== null) {
    const mid = (tempMin + tempMax) / 2;
    const half = (tempMax - tempMin) / 2;
    const score = Math.max(0, Math.min(100, 100 - (Math.abs(temp - mid) / half) * 100));
    scores.push(score);
  }

  if (scores.length === 0) return 50;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function computeStatus(
  moisture: number | null,
  temp: number | null,
  moistureMin: number,
  moistureMax: number,
  tempMin: number,
  tempMax: number
): "happy" | "thirsty" | "unknown" {
  if (moisture === null && temp === null) return "unknown";

  if (moisture !== null && (moisture < moistureMin || moisture > moistureMax)) {
    return "thirsty";
  }
  if (temp !== null && (temp < tempMin || temp > tempMax)) {
    return "thirsty";
  }

  return "happy";
}

export function toPlantView(
  plant: Plant,
  latestReading: SensorReading | null,
  recentCareLogs: CareLog[]
): PlantView {
  const moisture = latestReading?.moisture ?? null;
  const temp = latestReading?.temperature ?? null;
  const light = latestReading?.light ?? null;

  const waterLog = recentCareLogs.find((log) => log.action === "water");

  return {
    id: plant.id,
    name: plant.name,
    species: plant.species ?? "",
    emoji: plant.emoji,
    moisture,
    temp,
    light,
    lightLabel: getLightLabel(light),
    lastWatered: waterLog?.created_at ?? null,
    status: computeStatus(moisture, temp, plant.moisture_min, plant.moisture_max, plant.temp_min, plant.temp_max),
    hp: computeHP(moisture, temp, plant.moisture_min, plant.moisture_max, plant.temp_min, plant.temp_max),
    moistureMin: plant.moisture_min,
    moistureMax: plant.moisture_max,
    tempMin: plant.temp_min,
    tempMax: plant.temp_max,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
cd /home/user/plantgotchi/website-astro && npx vitest run tests/lib/plant-view.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/plant-view.ts tests/lib/plant-view.test.ts
git commit -m "feat: add PlantView model with HP, status, and light label computation"
```

---

### Task 12: Update SiteNav with Auth State

**Files:**
- Modify: `website-astro/src/components/SiteNav.tsx`

- [ ] **Step 1: Add userName prop and logout to SiteNav**

The current SiteNav uses Tailwind and has `NAV_LINKS` with base path `/plantgotchi`. Changes needed:
1. Accept optional `userName` prop
2. Remove `/plantgotchi` base from links (base path removed)
3. Add logout button when logged in
4. Remove "Pre-order" button, replace with auth state

Update the component to accept props:

```typescript
// At the top, change from no-props to:
interface SiteNavProps {
  userName?: string;
}

export default function SiteNav({ userName }: SiteNavProps) {
```

Update NAV_LINKS to remove base path:
```typescript
const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Garden", href: "/garden" },
  { label: "Admin", href: "/admin" },
];
```

Replace the `<div className="flex items-center gap-3">` block (containing the Pre-order button and hamburger) with:

```tsx
<div className="flex items-center gap-3">
  {userName ? (
    <>
      <span className="hidden sm:inline text-xs text-pixel-gray">{userName}</span>
      <button
        onClick={async () => {
          await fetch("/api/auth/sign-out", { method: "POST" });
          window.location.href = "/login";
        }}
        className="pixel-font text-[8px] sm:text-[10px] bg-pixel-gray text-cream px-3 py-2 pixel-border hover:bg-pixel-black transition-colors"
      >
        Logout
      </button>
    </>
  ) : (
    <a
      href="/login"
      className="pixel-font text-[8px] sm:text-[10px] bg-green-plant text-cream px-3 py-2 pixel-border hover:bg-green-dark transition-colors"
    >
      Login
    </a>
  )}

  {/* Mobile hamburger — keep existing hamburger button code unchanged */}
  <button
    onClick={() => setOpen(!open)}
    className="sm:hidden flex flex-col justify-center items-center w-8 h-8 gap-1"
    aria-label="Toggle menu"
  >
    {/* ... existing 3-line hamburger spans unchanged ... */}
  </button>
</div>
```

Also add the same auth display in the mobile dropdown menu (inside the `{open && ...}` block), after the nav links:

```tsx
{userName ? (
  <div className="px-3 py-2.5 flex items-center justify-between">
    <span className="text-xs text-pixel-gray">{userName}</span>
    <button
      onClick={async () => {
        await fetch("/api/auth/sign-out", { method: "POST" });
        window.location.href = "/login";
      }}
      className="pixel-font text-[8px] text-accent-red"
    >
      Logout
    </button>
  </div>
) : (
  <a href="/login" className="pixel-font text-[9px] text-green-dark px-3 py-2.5">
    Login
  </a>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SiteNav.tsx
git commit -m "feat: update SiteNav with auth state and remove base path"
```

---

### Task 13: Create Sub-Components for Detail Panel

**Files:**
- Create: `website-astro/src/components/AddPlantModal.tsx`
- Create: `website-astro/src/components/CareLogForm.tsx`
- Create: `website-astro/src/components/ReadingForm.tsx`
- Create: `website-astro/src/components/RecommendationsList.tsx`
- Create: `website-astro/src/components/CareHistory.tsx`

- [ ] **Step 1: Create AddPlantModal**

Create `src/components/AddPlantModal.tsx`:

```tsx
import { useState } from "react";

const PLANT_EMOJIS = ["🌿", "🌱", "🪴", "🌵", "🌻", "🌺", "🌸", "🍀", "🌾", "🎋", "🎍", "🌴"];

interface AddPlantModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function AddPlantModal({ onClose, onCreated }: AddPlantModalProps) {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [emoji, setEmoji] = useState("🌿");
  const [lightPreference, setLightPreference] = useState("medium");
  const [moistureMin, setMoistureMin] = useState(30);
  const [moistureMax, setMoistureMax] = useState(80);
  const [tempMin, setTempMin] = useState(15);
  const [tempMax, setTempMax] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !emoji) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          species: species.trim(),
          emoji,
          light_preference: lightPreference,
          moisture_min: moistureMin,
          moisture_max: moistureMax,
          temp_min: tempMin,
          temp_max: tempMax,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create plant");
      }

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Uses inline styles matching GardenDashboard's COLORS/PIXEL_FONT pattern
  const PIXEL_FONT = "'Press Start 2P', monospace";
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem",
    border: "2px solid #2d2d2d",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "0.85rem",
    background: "#fff",
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: PIXEL_FONT,
    fontSize: "0.55rem",
    color: "#2d2d2d",
    display: "block",
    marginBottom: "0.4rem",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#faf6e9",
          border: "3px solid #2d2d2d",
          borderRadius: "8px",
          padding: "1.5rem",
          maxWidth: "400px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "4px 4px 0 #2d2d2d",
        }}
      >
        <h2 style={{ fontFamily: PIXEL_FONT, fontSize: "0.9rem", color: "#2d5a27", marginBottom: "1rem", textAlign: "center" }}>
          ADD PLANT
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>NAME *</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>SPECIES</label>
            <input style={inputStyle} value={species} onChange={(e) => setSpecies(e.target.value)} />
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>EMOJI *</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {PLANT_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  style={{
                    fontSize: "1.5rem",
                    padding: "0.25rem",
                    border: emoji === e ? "2px solid #2d5a27" : "2px solid transparent",
                    borderRadius: "4px",
                    background: emoji === e ? "#e8f5e9" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>LIGHT PREFERENCE</label>
            <select
              style={inputStyle}
              value={lightPreference}
              onChange={(e) => setLightPreference(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div style={{ marginBottom: "0.75rem", display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>MOISTURE MIN %</label>
              <input style={inputStyle} type="number" min={0} max={100} value={moistureMin} onChange={(e) => setMoistureMin(+e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>MOISTURE MAX %</label>
              <input style={inputStyle} type="number" min={0} max={100} value={moistureMax} onChange={(e) => setMoistureMax(+e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>TEMP MIN C</label>
              <input style={inputStyle} type="number" min={-10} max={50} value={tempMin} onChange={(e) => setTempMin(+e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>TEMP MAX C</label>
              <input style={inputStyle} type="number" min={-10} max={50} value={tempMax} onChange={(e) => setTempMax(+e.target.value)} />
            </div>
          </div>

          {error && (
            <div style={{
              fontFamily: PIXEL_FONT, fontSize: "0.5rem", color: "#c0392b",
              border: "2px solid #c0392b", padding: "0.5rem", marginBottom: "0.75rem",
              borderRadius: "4px", background: "#fdecea",
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: "0.6rem", background: "#ddd", border: "2px solid #2d2d2d",
                borderRadius: "4px", fontFamily: PIXEL_FONT, fontSize: "0.6rem", cursor: "pointer",
              }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, padding: "0.6rem", background: loading ? "#999" : "#2d5a27",
                color: "#f0ead6", border: "2px solid #2d2d2d", borderRadius: "4px",
                fontFamily: PIXEL_FONT, fontSize: "0.6rem", cursor: loading ? "wait" : "pointer",
                boxShadow: "2px 2px 0 #2d2d2d",
              }}
            >
              {loading ? "..." : "CREATE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create CareLogForm**

Create `src/components/CareLogForm.tsx`:

```tsx
import { useState } from "react";

const CARE_ACTIONS = [
  { action: "water", icon: "💧", label: "Water" },
  { action: "fertilize", icon: "🧪", label: "Fertilize" },
  { action: "prune", icon: "✂️", label: "Prune" },
  { action: "repot", icon: "🪴", label: "Repot" },
  { action: "mist", icon: "🌫️", label: "Mist" },
  { action: "pest_treatment", icon: "🐛", label: "Pest Tx" },
] as const;

interface CareLogFormProps {
  plantId: string;
  onLogged: () => void;
}

export default function CareLogForm({ plantId, onLogged }: CareLogFormProps) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const PIXEL_FONT = "'Press Start 2P', monospace";

  const logAction = async (action: string) => {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch("/api/care-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plant_id: plantId, action, notes: notes.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to log");
      }
      setNotes("");
      onLogged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
        {CARE_ACTIONS.map(({ action, icon, label }) => (
          <button
            key={action}
            onClick={() => logAction(action)}
            disabled={loading !== null}
            title={label}
            style={{
              padding: "0.4rem 0.6rem",
              border: "2px solid #2d2d2d",
              borderRadius: "4px",
              background: loading === action ? "#ccc" : "#faf6e9",
              cursor: loading ? "wait" : "pointer",
              fontSize: "1rem",
              boxShadow: "1px 1px 0 #2d2d2d",
            }}
          >
            {icon}
          </button>
        ))}
      </div>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        style={{
          width: "100%",
          padding: "0.4rem",
          border: "2px solid #2d2d2d",
          borderRadius: "4px",
          fontFamily: "monospace",
          fontSize: "0.75rem",
          background: "#fff",
        }}
      />
      {error && (
        <div style={{ fontFamily: PIXEL_FONT, fontSize: "0.45rem", color: "#c0392b", marginTop: "0.3rem" }}>
          {error}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create ReadingForm**

Create `src/components/ReadingForm.tsx`:

```tsx
import { useState } from "react";

interface ReadingFormProps {
  plantId: string;
  onSubmitted: () => void;
}

export default function ReadingForm({ plantId, onSubmitted }: ReadingFormProps) {
  const [moisture, setMoisture] = useState("");
  const [temperature, setTemperature] = useState("");
  const [light, setLight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PIXEL_FONT = "'Press Start 2P', monospace";
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.4rem",
    border: "2px solid #2d2d2d",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "0.75rem",
    background: "#fff",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moisture && !temperature && !light) return;

    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = { plant_id: plantId };
      if (moisture) body.moisture = parseFloat(moisture);
      if (temperature) body.temperature = parseFloat(temperature);
      if (light) body.light = parseInt(light, 10);

      const res = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit");
      }

      setMoisture("");
      setTemperature("");
      setLight("");
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.4rem" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontFamily: PIXEL_FONT, fontSize: "0.4rem", color: "#666" }}>MOISTURE %</label>
          <input style={inputStyle} type="number" min={0} max={100} value={moisture} onChange={(e) => setMoisture(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontFamily: PIXEL_FONT, fontSize: "0.4rem", color: "#666" }}>TEMP C</label>
          <input style={inputStyle} type="number" min={-10} max={60} value={temperature} onChange={(e) => setTemperature(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontFamily: PIXEL_FONT, fontSize: "0.4rem", color: "#666" }}>LIGHT LUX</label>
          <input style={inputStyle} type="number" min={0} max={100000} value={light} onChange={(e) => setLight(e.target.value)} />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading || (!moisture && !temperature && !light)}
        style={{
          width: "100%",
          padding: "0.5rem",
          background: loading ? "#999" : "#2d5a27",
          color: "#f0ead6",
          border: "2px solid #2d2d2d",
          borderRadius: "4px",
          fontFamily: PIXEL_FONT,
          fontSize: "0.55rem",
          cursor: loading ? "wait" : "pointer",
          boxShadow: "1px 1px 0 #2d2d2d",
        }}
      >
        {loading ? "..." : "LOG READING"}
      </button>
      {error && (
        <div style={{ fontFamily: PIXEL_FONT, fontSize: "0.45rem", color: "#c0392b", marginTop: "0.3rem" }}>
          {error}
        </div>
      )}
    </form>
  );
}
```

- [ ] **Step 4: Create RecommendationsList**

Create `src/components/RecommendationsList.tsx`:

```tsx
import { useState } from "react";

interface Recommendation {
  id: string;
  plant_id: string;
  source: string;
  message: string;
  severity: string;
  acted_on: boolean;
  created_at: string;
}

interface RecommendationsListProps {
  recommendations: Recommendation[];
  onDismissed: () => void;
}

const SEVERITY_COLORS: Record<string, { bg: string; border: string }> = {
  urgent: { bg: "#fdecea", border: "#c0392b" },
  warning: { bg: "#fff8e1", border: "#f39c12" },
  info: { bg: "#e8f5e9", border: "#27ae60" },
};

export default function RecommendationsList({ recommendations, onDismissed }: RecommendationsListProps) {
  const [dismissing, setDismissing] = useState<string | null>(null);
  const PIXEL_FONT = "'Press Start 2P', monospace";

  const active = recommendations.filter((r) => !r.acted_on);
  if (active.length === 0) return null;

  const dismiss = async (id: string) => {
    setDismissing(id);
    try {
      await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      onDismissed();
    } finally {
      setDismissing(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {active.map((rec) => {
        const colors = SEVERITY_COLORS[rec.severity] || SEVERITY_COLORS.info;
        return (
          <div
            key={rec.id}
            style={{
              padding: "0.5rem",
              background: colors.bg,
              border: `2px solid ${colors.border}`,
              borderRadius: "4px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "0.5rem",
            }}
          >
            <div style={{ fontFamily: "monospace", fontSize: "0.75rem", flex: 1 }}>
              <span style={{ fontFamily: PIXEL_FONT, fontSize: "0.45rem", textTransform: "uppercase", color: colors.border }}>
                {rec.severity}
              </span>
              <br />
              {rec.message}
            </div>
            <button
              onClick={() => dismiss(rec.id)}
              disabled={dismissing === rec.id}
              style={{
                padding: "0.2rem 0.4rem",
                border: "1px solid #999",
                borderRadius: "3px",
                background: "#fff",
                fontFamily: PIXEL_FONT,
                fontSize: "0.4rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {dismissing === rec.id ? "..." : "DISMISS"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Create CareHistory**

Create `src/components/CareHistory.tsx`:

```tsx
interface CareLog {
  id: string;
  action: string;
  notes: string | null;
  created_at: string;
}

interface CareHistoryProps {
  logs: CareLog[];
}

const ACTION_ICONS: Record<string, string> = {
  water: "💧",
  fertilize: "🧪",
  prune: "✂️",
  repot: "🪴",
  mist: "🌫️",
  pest_treatment: "🐛",
  other: "📝",
};

export default function CareHistory({ logs }: CareHistoryProps) {
  const PIXEL_FONT = "'Press Start 2P', monospace";

  if (logs.length === 0) {
    return (
      <div style={{ fontFamily: PIXEL_FONT, fontSize: "0.5rem", color: "#999", textAlign: "center", padding: "1rem" }}>
        NO CARE LOGS YET
      </div>
    );
  }

  return (
    <div style={{ maxHeight: "200px", overflowY: "auto" }}>
      {logs.map((log) => (
        <div
          key={log.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.4rem 0",
            borderBottom: "1px solid #e0dcc8",
          }}
        >
          <span style={{ fontSize: "1rem" }}>{ACTION_ICONS[log.action] || "📝"}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: "0.45rem", textTransform: "capitalize" }}>
              {log.action.replace("_", " ")}
            </div>
            {log.notes && (
              <div style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#666" }}>
                {log.notes}
              </div>
            )}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "#999" }}>
            {new Date(log.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/AddPlantModal.tsx src/components/CareLogForm.tsx src/components/ReadingForm.tsx src/components/RecommendationsList.tsx src/components/CareHistory.tsx
git commit -m "feat: add sub-components for plant detail panel"
```

---

### Task 14: Refactor GardenDashboard to Use Real Data

**Files:**
- Modify: `website-astro/src/components/GardenDashboard.tsx`

This is the largest task. The current GardenDashboard has ~600 lines with 6 hardcoded plants and inline sub-components (HPBar, MoistureBar, MiniChart, StatusBadge, PlantCard, DetailPanel). All sub-components are defined inline with the same COLORS/PIXEL_FONT constants.

- [ ] **Step 1: Read the current GardenDashboard.tsx completely**

Before making changes, read the full file to understand every sub-component, animation, and style.

- [ ] **Step 2: Replace hardcoded data with API-driven state**

Key changes to make in GardenDashboard.tsx:

1. **Add props interface:**
```typescript
interface GardenDashboardProps {
  userName?: string;
}
```

2. **Replace the `plants` array** (currently hardcoded ~lines 89-210) with state:
```typescript
const [plants, setPlants] = useState<PlantView[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [showAddModal, setShowAddModal] = useState(false);
```

3. **Change `selectedId` type** from `number | null` to `string | null` and default to `null`:
```typescript
const [selectedId, setSelectedId] = useState<string | null>(null);
```

4. **Add data fetching function:**
```typescript
const fetchPlants = async () => {
  try {
    const res = await fetch("/api/plants");
    if (!res.ok) throw new Error("Failed to load plants");
    const data = await res.json();
    const views = data.map((item: { plant: Plant; latestReading: SensorReading | null; recentCareLogs: CareLog[] }) =>
      toPlantView(item.plant, item.latestReading, item.recentCareLogs)
    );
    setPlants(views);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Error loading plants");
  } finally {
    setLoading(false);
  }
};
```

5. **Add useEffect** for initial fetch:
```typescript
useEffect(() => { fetchPlants(); }, []);
```

6. **Update imports** at top of file:
```typescript
import { toPlantView, type PlantView } from "../lib/plant-view";
import type { Plant, SensorReading, CareLog } from "../lib/db/queries";
import AddPlantModal from "./AddPlantModal";
```

7. **Update PlantCard component** inside the file:
- Change `plant` type from the old inline `Plant` to `PlantView`
- `plant.id` is now `string` (not `number`)
- `plant.light` is now `number | null` → display `plant.lightLabel` instead
- `plant.history` no longer exists → MiniChart will be driven by a separate readings fetch (or hidden for now with `[]` data)
- `plant.hasSensor` no longer exists → remove sensor indicator (all data is manual now)
- `plant.lastWatered` is now `string | null` ISO date → format it for display

8. **Update DetailPanel** to include real action forms:
- Import and render CareLogForm, ReadingForm, RecommendationsList, CareHistory
- Fetch care logs and recommendations when a plant is selected
- Replace the "WATER / LOG / EDIT" buttons with CareLogForm
- Add ReadingForm below the stats
- Add CareHistory timeline
- Add RecommendationsList

9. **Update tags bar** to use real computed data:
```typescript
const happyCount = plants.filter((p) => p.status === "happy").length;
const needWaterCount = plants.filter((p) => p.status === "thirsty").length;
```

10. **Add empty state** when `plants.length === 0 && !loading`:
```tsx
<div style={{ textAlign: "center", padding: "3rem 1rem" }}>
  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌱</div>
  <p style={{ fontFamily: PIXEL_FONT, fontSize: "0.8rem", marginBottom: "1rem" }}>NO PLANTS YET</p>
  <button onClick={() => setShowAddModal(true)} style={/* green button styles */}>
    ADD YOUR FIRST PLANT
  </button>
</div>
```

11. **Add "Add Plant" button** to header area:
```tsx
<button onClick={() => setShowAddModal(true)} style={/* compact green button */}>
  + ADD
</button>
```

12. **Render AddPlantModal** when `showAddModal`:
```tsx
{showAddModal && <AddPlantModal onClose={() => setShowAddModal(false)} onCreated={fetchPlants} />}
```

13. **Pass `userName` to SiteNav:**
```tsx
<SiteNav userName={userName} />
```

**Important: preserve ALL existing styles, animations, and pixel-art aesthetic.** The sub-components (HPBar, MoistureBar, MiniChart, StatusBadge) stay in the same file. Only change what's needed to swap hardcoded data for real data.

- [ ] **Step 3: Verify build succeeds**

Run:
```bash
cd /home/user/plantgotchi/website-astro && npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Smoke test (manual verification checklist)**

Start the dev server and verify each state renders:
```bash
cd /home/user/plantgotchi/website-astro && npm run dev
```

Verify in browser:
1. `/login` — form renders, submitting with bad credentials shows error
2. `/signup` — form renders, can create account, redirects to `/garden`
3. `/garden` (logged in, no plants) — shows "NO PLANTS YET" empty state with "ADD YOUR FIRST PLANT" button
4. Click "ADD YOUR FIRST PLANT" — AddPlantModal opens, fill name + emoji, submit → plant card appears
5. Click plant card → DetailPanel opens showing plant name, emoji, "—" for readings
6. Use CareLogForm to log a water action → CareHistory updates
7. Use ReadingForm to submit moisture=50, temp=22 → stats update, HP bar shows
8. `/garden` (logged out) — redirects to `/login`

- [ ] **Step 5: Commit**

```bash
git add src/components/GardenDashboard.tsx
git commit -m "feat: refactor GardenDashboard to use real API data with PlantView model"
```

---

### Task 15: Final Build Verification and Cleanup

- [ ] **Step 1: Run all tests**

```bash
cd /home/user/plantgotchi/website-astro && npm test
```

Expected: All PlantView tests pass.

- [ ] **Step 2: Run build**

```bash
cd /home/user/plantgotchi/website-astro && npm run build
```

Expected: Clean build with no errors.

- [ ] **Step 3: Review for leftover base path references**

Search the codebase for `/plantgotchi` references that should be removed:

```bash
cd /home/user/plantgotchi/website-astro && grep -r "/plantgotchi" src/ --include="*.tsx" --include="*.ts" --include="*.astro"
```

Expected: No results (all base paths removed).

- [ ] **Step 4: Final commit if cleanup needed**

```bash
git add -A
git commit -m "chore: cleanup leftover base path references"
```
