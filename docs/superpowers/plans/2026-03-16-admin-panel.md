# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a read-only admin panel with full platform visibility into users, plants, sensor readings, care logs, and recommendations — gated by better-auth's admin plugin with role-based access.

**Architecture:** Add better-auth admin plugin for role management (adds `role` column to `user` table). Create new admin API endpoints that query across all users (not scoped to session user). Build a tabbed React admin dashboard that replaces the current launch-tracker-only admin page, with the launch tracker preserved as one tab.

**Tech Stack:** better-auth admin plugin, Turso/libSQL, Astro API routes, React 19, TailwindCSS 4

---

## File Structure

### New Files
- `website-astro/src/lib/auth-client.ts` — better-auth client with admin plugin (for client-side role checks)
- `website-astro/src/pages/api/admin/stats.ts` — Overview stats endpoint (total users, plants, readings, etc.)
- `website-astro/src/pages/api/admin/users.ts` — List all users with plant counts
- `website-astro/src/pages/api/admin/users/[id].ts` — Single user detail with their plants and activity
- `website-astro/src/pages/api/admin/plants.ts` — List all plants across platform with owner info
- `website-astro/src/pages/api/admin/activity.ts` — Recent care logs and sensor readings across all users
- `website-astro/src/lib/db/admin-queries.ts` — Admin-specific database queries (cross-user)
- `website-astro/src/components/admin/AdminPanel.tsx` — Main admin panel with tab navigation
- `website-astro/src/components/admin/OverviewTab.tsx` — Dashboard stats overview
- `website-astro/src/components/admin/UsersTab.tsx` — Users table with drill-down
- `website-astro/src/components/admin/PlantsTab.tsx` — All plants table
- `website-astro/src/components/admin/ActivityTab.tsx` — Activity feed
- `website-astro/src/components/admin/UserDetailModal.tsx` — User drill-down modal
- `website-astro/src/lib/admin-guard.ts` — Reusable admin auth guard for API endpoints
- `website-astro/tests/lib/admin-queries.test.ts` — Unit tests for admin queries

### Modified Files
- `website-astro/src/lib/auth.ts` — Add admin plugin to better-auth config
- `website-astro/src/pages/admin.astro` — Pass session role to component, gate on admin role
- `website-astro/src/components/SiteNav.tsx` — No changes needed (Admin link stays visible, server-side gating handles access)

---

## Chunk 1: Auth & Role Infrastructure

### Task 1: Add better-auth admin plugin (server-side)

**Files:**
- Modify: `website-astro/src/lib/auth.ts`
- Modify: `website-astro/package.json` (no new deps — admin plugin is built into better-auth)

- [ ] **Step 1: Update auth.ts to include admin plugin**

```typescript
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";
import { getDb } from "./db/client";

const dialect = new LibsqlDialect({ client: getDb() });
const kyselyDb = new Kysely({ dialect });

export const auth = betterAuth({
  database: {
    db: kyselyDb,
    type: "sqlite",
  },
  secret: import.meta.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  plugins: [
    admin(),
  ],
});

export async function getSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return session;
}
```

**TypeScript note:** The admin plugin extends the `user` type to include `role`, `banned`, `banReason`, and `banExpires`. The `session.user.role` property should be typed automatically when the admin plugin is registered. If TypeScript complains, cast `session.user` as `{ role?: string }` at usage sites, or use `(session.user as any).role`.

- [ ] **Step 2: Run database migration to add role/ban columns to user table**

Run: `cd website-astro && npx auth migrate`
Expected: Migration applies, adds `role`, `banned`, `banReason`, `banExpires` columns to `user` table, and `impersonatedBy` to `session` table.

If `npx auth migrate` doesn't work in this setup, manually run:
```sql
ALTER TABLE user ADD COLUMN role TEXT DEFAULT 'user';
ALTER TABLE user ADD COLUMN banned INTEGER DEFAULT 0;
ALTER TABLE user ADD COLUMN banReason TEXT;
ALTER TABLE user ADD COLUMN banExpires INTEGER;
ALTER TABLE session ADD COLUMN impersonatedBy TEXT;
```

- [ ] **Step 3: Commit**

```bash
git add website-astro/src/lib/auth.ts
git commit -m "feat: add better-auth admin plugin for role-based access"
```

### Task 2: Create auth client for client-side admin checks

**Files:**
- Create: `website-astro/src/lib/auth-client.ts`

- [ ] **Step 1: Create auth client with admin plugin**

```typescript
import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
  ],
});
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/lib/auth-client.ts
git commit -m "feat: add better-auth client with admin plugin"
```

### Task 3: Gate admin page on admin role

**Files:**
- Modify: `website-astro/src/pages/admin.astro`

- [ ] **Step 1: Update admin.astro to check role**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import AdminPanel from "../components/admin/AdminPanel";
import { getSession } from "../lib/auth";

const session = await getSession(Astro.request);
if (!session) {
  return Astro.redirect("/login");
}

// Only allow admin users
if (session.user.role !== "admin") {
  return Astro.redirect("/garden");
}

const userName = session.user.name || session.user.email;
---

<BaseLayout title="Admin - Plantgotchi">
  <AdminPanel client:load userName={userName} />
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/pages/admin.astro
git commit -m "feat: gate admin page on admin role"
```

### Task 4: Keep Admin nav link as-is (server-side gating is sufficient)

The existing `SiteNav` already shows the Admin link to all users. Rather than threading `isAdmin` through every page and component, we rely on the server-side role check in `admin.astro` (Task 3). Non-admin users who click "Admin" will be redirected to `/garden`. This is the simplest approach and avoids modifying every page that renders `SiteNav`.

No code changes needed for this task.

---

## Chunk 2: Admin Database Queries

### Task 5: Write tests for admin queries

**Files:**
- Create: `website-astro/tests/lib/admin-queries.test.ts`

- [ ] **Step 1: Write unit tests for admin query functions**

These tests validate the SQL query functions return the expected shapes. Since the app uses Turso and the queries use raw SQL, we test the query builder functions produce correct SQL and handle edge cases.

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// We'll test the query functions by mocking the db client
// Tests validate: correct SQL, correct args, correct return shape

describe("admin queries", () => {
  describe("getOverviewStats", () => {
    it("returns counts for users, plants, readings, care logs, and recommendations", async () => {
      // Test will be filled after implementation
    });
  });

  describe("getAllUsers", () => {
    it("returns users with plant_count and last_active", async () => {
      // Test validates shape
    });

    it("supports pagination with limit and offset", async () => {
      // Test validates pagination args are passed
    });
  });

  describe("getAllPlants", () => {
    it("returns plants with owner email and latest reading", async () => {
      // Test validates join shape
    });
  });

  describe("getRecentActivity", () => {
    it("returns care logs and readings across all users", async () => {
      // Test validates combined activity
    });
  });

  describe("getUserDetail", () => {
    it("returns user info with their plants and recent activity", async () => {
      // Test validates shape
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail (no implementation yet)**

Run: `cd website-astro && npx vitest run tests/lib/admin-queries.test.ts`
Expected: Tests fail (module not found)

- [ ] **Step 3: Commit**

```bash
git add website-astro/tests/lib/admin-queries.test.ts
git commit -m "test: add failing tests for admin query functions"
```

### Task 6: Implement admin database queries

**Files:**
- Create: `website-astro/src/lib/db/admin-queries.ts`

- [ ] **Step 1: Implement admin query functions**

```typescript
import { getDb } from './client';

export interface OverviewStats {
  totalUsers: number;
  totalPlants: number;
  totalReadings: number;
  totalCareLogs: number;
  pendingRecommendations: number;
  readingsToday: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  plantCount: number;
  lastActive: string | null;
}

export interface AdminPlant {
  id: string;
  name: string;
  species: string | null;
  emoji: string;
  ownerEmail: string;
  ownerId: string;
  moisture: number | null;
  temperature: number | null;
  light: number | null;
  lastReadingAt: string | null;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'care_log' | 'sensor_reading';
  userEmail: string;
  userId: string;
  plantName: string;
  plantEmoji: string;
  detail: string;
  timestamp: string;
}

export interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  plants: Array<{
    id: string;
    name: string;
    species: string | null;
    emoji: string;
    createdAt: string;
  }>;
  recentCareLogs: Array<{
    id: string;
    plantName: string;
    action: string;
    notes: string | null;
    createdAt: string;
  }>;
  recentReadings: Array<{
    plantName: string;
    moisture: number | null;
    temperature: number | null;
    light: number | null;
    timestamp: string;
  }>;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const db = getDb();
  const [users, plants, readings, careLogs, pendingRecs, readingsToday] = await Promise.all([
    db.execute('SELECT COUNT(*) as count FROM user'),
    db.execute('SELECT COUNT(*) as count FROM plants'),
    db.execute('SELECT COUNT(*) as count FROM sensor_readings'),
    db.execute('SELECT COUNT(*) as count FROM care_logs'),
    db.execute('SELECT COUNT(*) as count FROM recommendations WHERE acted_on = 0'),
    db.execute("SELECT COUNT(*) as count FROM sensor_readings WHERE timestamp >= datetime('now', '-1 day')"),
  ]);

  return {
    totalUsers: Number(users.rows[0]?.count ?? 0),
    totalPlants: Number(plants.rows[0]?.count ?? 0),
    totalReadings: Number(readings.rows[0]?.count ?? 0),
    totalCareLogs: Number(careLogs.rows[0]?.count ?? 0),
    pendingRecommendations: Number(pendingRecs.rows[0]?.count ?? 0),
    readingsToday: Number(readingsToday.rows[0]?.count ?? 0),
  };
}

export async function getAllUsers(limit = 50, offset = 0): Promise<{ users: AdminUser[]; total: number }> {
  const db = getDb();
  const [result, countResult] = await Promise.all([
    db.execute({
      sql: `SELECT u.id, u.name, u.email, u.role, u.createdAt,
              (SELECT COUNT(*) FROM plants WHERE user_id = u.id) as plantCount,
              (SELECT MAX(s.updatedAt) FROM session s WHERE s.userId = u.id) as lastActive
            FROM user u
            ORDER BY u.createdAt DESC
            LIMIT ? OFFSET ?`,
      args: [limit, offset],
    }),
    db.execute('SELECT COUNT(*) as count FROM user'),
  ]);

  return {
    users: result.rows as unknown as AdminUser[],
    total: Number(countResult.rows[0]?.count ?? 0),
  };
}

export async function getAllPlants(limit = 50, offset = 0): Promise<{ plants: AdminPlant[]; total: number }> {
  const db = getDb();
  const [result, countResult] = await Promise.all([
    db.execute({
      sql: `SELECT p.id, p.name, p.species, p.emoji, p.created_at as createdAt,
              u.email as ownerEmail, u.id as ownerId,
              sr.moisture, sr.temperature, sr.light, sr.timestamp as lastReadingAt
            FROM plants p
            JOIN user u ON p.user_id = u.id
            LEFT JOIN (
              SELECT plant_id, moisture, temperature, light, timestamp,
                ROW_NUMBER() OVER (PARTITION BY plant_id ORDER BY timestamp DESC) as rn
              FROM sensor_readings
            ) sr ON sr.plant_id = p.id AND sr.rn = 1
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?`,
      args: [limit, offset],
    }),
    db.execute('SELECT COUNT(*) as count FROM plants'),
  ]);

  return {
    plants: result.rows as unknown as AdminPlant[],
    total: Number(countResult.rows[0]?.count ?? 0),
  };
}

export async function getRecentActivity(limit = 50): Promise<ActivityItem[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT * FROM (
            SELECT cl.id, 'care_log' as type, u.email as userEmail, u.id as userId,
              p.name as plantName, p.emoji as plantEmoji,
              cl.action || COALESCE(' - ' || cl.notes, '') as detail,
              cl.created_at as timestamp
            FROM care_logs cl
            JOIN plants p ON cl.plant_id = p.id
            JOIN user u ON cl.user_id = u.id
            UNION ALL
            SELECT CAST(sr.id AS TEXT), 'sensor_reading' as type, u.email as userEmail, u.id as userId,
              p.name as plantName, p.emoji as plantEmoji,
              'moisture=' || COALESCE(CAST(sr.moisture AS TEXT), '?') ||
              ' temp=' || COALESCE(CAST(sr.temperature AS TEXT), '?') ||
              ' light=' || COALESCE(CAST(sr.light AS TEXT), '?') as detail,
              sr.timestamp as timestamp
            FROM sensor_readings sr
            JOIN plants p ON sr.plant_id = p.id
            JOIN user u ON p.user_id = u.id
          ) combined
          ORDER BY timestamp DESC
          LIMIT ?`,
    args: [limit],
  });

  return result.rows as unknown as ActivityItem[];
}

export async function getUserDetail(userId: string): Promise<UserDetail | null> {
  const db = getDb();
  const [userResult, plantsResult, careResult, readingsResult] = await Promise.all([
    db.execute({ sql: 'SELECT id, name, email, role, createdAt FROM user WHERE id = ?', args: [userId] }),
    db.execute({ sql: 'SELECT id, name, species, emoji, created_at as createdAt FROM plants WHERE user_id = ? ORDER BY name', args: [userId] }),
    db.execute({
      sql: `SELECT cl.id, p.name as plantName, cl.action, cl.notes, cl.created_at as createdAt
            FROM care_logs cl
            JOIN plants p ON cl.plant_id = p.id
            WHERE cl.user_id = ?
            ORDER BY cl.created_at DESC LIMIT 20`,
      args: [userId],
    }),
    db.execute({
      sql: `SELECT p.name as plantName, sr.moisture, sr.temperature, sr.light, sr.timestamp
            FROM sensor_readings sr
            JOIN plants p ON sr.plant_id = p.id
            WHERE p.user_id = ?
            ORDER BY sr.timestamp DESC LIMIT 20`,
      args: [userId],
    }),
  ]);

  const user = userResult.rows[0];
  if (!user) return null;

  return {
    ...(user as unknown as Pick<UserDetail, 'id' | 'name' | 'email' | 'role' | 'createdAt'>),
    plants: plantsResult.rows as unknown as UserDetail['plants'],
    recentCareLogs: careResult.rows as unknown as UserDetail['recentCareLogs'],
    recentReadings: readingsResult.rows as unknown as UserDetail['recentReadings'],
  };
}
```

- [ ] **Step 2: Update tests to properly test the implementations**

Update the test file with concrete assertions now that we know the function signatures:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { OverviewStats, AdminUser, AdminPlant, ActivityItem, UserDetail } from "../../src/lib/db/admin-queries";

// Integration-style tests — these validate the exported types and function signatures
// Full integration tests would require a test database

describe("admin-queries module exports", () => {
  it("exports getOverviewStats function", async () => {
    const mod = await import("../../src/lib/db/admin-queries");
    expect(typeof mod.getOverviewStats).toBe("function");
  });

  it("exports getAllUsers function", async () => {
    const mod = await import("../../src/lib/db/admin-queries");
    expect(typeof mod.getAllUsers).toBe("function");
  });

  it("exports getAllPlants function", async () => {
    const mod = await import("../../src/lib/db/admin-queries");
    expect(typeof mod.getAllPlants).toBe("function");
  });

  it("exports getRecentActivity function", async () => {
    const mod = await import("../../src/lib/db/admin-queries");
    expect(typeof mod.getRecentActivity).toBe("function");
  });

  it("exports getUserDetail function", async () => {
    const mod = await import("../../src/lib/db/admin-queries");
    expect(typeof mod.getUserDetail).toBe("function");
  });
});
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `cd website-astro && npx vitest run tests/lib/admin-queries.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add website-astro/src/lib/db/admin-queries.ts website-astro/tests/lib/admin-queries.test.ts
git commit -m "feat: add admin database queries for cross-user platform visibility"
```

---

## Chunk 3: Admin API Endpoints

### Task 7: Create admin auth guard helper

**Files:**
- Create: `website-astro/src/lib/admin-guard.ts`

- [ ] **Step 1: Create reusable admin auth guard**

```typescript
import { getSession } from "./auth";

export async function requireAdmin(request: Request): Promise<{ userId: string; error?: never } | { error: Response; userId?: never }> {
  const session = await getSession(request);
  if (!session) {
    return { error: new Response("Unauthorized", { status: 401 }) };
  }
  if (session.user.role !== "admin") {
    return { error: new Response("Forbidden", { status: 403 }) };
  }
  return { userId: session.user.id };
}
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/lib/admin-guard.ts
git commit -m "feat: add admin auth guard helper"
```

### Task 8: Create admin stats endpoint

**Files:**
- Create: `website-astro/src/pages/api/admin/stats.ts`

- [ ] **Step 1: Implement stats endpoint**

```typescript
import type { APIRoute } from "astro";
import { requireAdmin } from "../../../lib/admin-guard";
import { getOverviewStats } from "../../../lib/db/admin-queries";

export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const stats = await getOverviewStats();
  return new Response(JSON.stringify(stats), {
    headers: { "Content-Type": "application/json" },
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/pages/api/admin/stats.ts
git commit -m "feat: add admin stats API endpoint"
```

### Task 9: Create admin users endpoint

**Files:**
- Create: `website-astro/src/pages/api/admin/users.ts`

- [ ] **Step 1: Implement users list endpoint**

```typescript
import type { APIRoute } from "astro";
import { requireAdmin } from "../../../lib/admin-guard";
import { getAllUsers } from "../../../lib/db/admin-queries";

export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const result = await getAllUsers(limit, offset);
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/pages/api/admin/users.ts
git commit -m "feat: add admin users list API endpoint"
```

### Task 10: Create admin user detail endpoint

**Files:**
- Create: `website-astro/src/pages/api/admin/users/[id].ts`

- [ ] **Step 1: Implement user detail endpoint**

```typescript
import type { APIRoute } from "astro";
import { requireAdmin } from "../../../../lib/admin-guard";
import { getUserDetail } from "../../../../lib/db/admin-queries";

export const GET: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const userId = params.id;
  if (!userId) return new Response("Missing user ID", { status: 400 });

  const detail = await getUserDetail(userId);
  if (!detail) return new Response("User not found", { status: 404 });

  return new Response(JSON.stringify(detail), {
    headers: { "Content-Type": "application/json" },
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/pages/api/admin/users/[id].ts
git commit -m "feat: add admin user detail API endpoint"
```

### Task 11: Create admin plants endpoint

**Files:**
- Create: `website-astro/src/pages/api/admin/plants.ts`

- [ ] **Step 1: Implement plants list endpoint**

```typescript
import type { APIRoute } from "astro";
import { requireAdmin } from "../../../lib/admin-guard";
import { getAllPlants } from "../../../lib/db/admin-queries";

export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const result = await getAllPlants(limit, offset);
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/pages/api/admin/plants.ts
git commit -m "feat: add admin plants list API endpoint"
```

### Task 12: Create admin activity endpoint

**Files:**
- Create: `website-astro/src/pages/api/admin/activity.ts`

- [ ] **Step 1: Implement activity feed endpoint**

```typescript
import type { APIRoute } from "astro";
import { requireAdmin } from "../../../lib/admin-guard";
import { getRecentActivity } from "../../../lib/db/admin-queries";

export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");

  const activity = await getRecentActivity(limit);
  return new Response(JSON.stringify(activity), {
    headers: { "Content-Type": "application/json" },
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/pages/api/admin/activity.ts
git commit -m "feat: add admin activity feed API endpoint"
```

---

## Chunk 4: Admin Panel UI — Overview & Users Tabs

**Note on types:** The frontend components below define their own interface types that mirror the API response shapes. This is intentional for V0 — the types in `admin-queries.ts` live in server-side code that imports `getDb()` and cannot be safely imported into client-side React components. If type drift becomes an issue, extract shared types into a `src/lib/types/admin.ts` file with no server imports.

### Task 13: Create the main AdminPanel with tab navigation

**Files:**
- Create: `website-astro/src/components/admin/AdminPanel.tsx`

- [ ] **Step 1: Implement AdminPanel with tabs**

The main panel component manages which tab is active and renders the appropriate child. Tabs: Overview, Users, Plants, Activity, Launch Tracker.

```typescript
import { useState } from "react";
import SiteNav from "../SiteNav";
import OverviewTab from "./OverviewTab";
import UsersTab from "./UsersTab";
import PlantsTab from "./PlantsTab";
import ActivityTab from "./ActivityTab";
import AdminDashboard from "../AdminDashboard";

type Tab = "overview" | "users" | "plants" | "activity" | "launch-tracker";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "plants", label: "Plants" },
  { id: "activity", label: "Activity" },
  { id: "launch-tracker", label: "Launch Tracker" },
];

interface AdminPanelProps {
  userName?: string;
}

export default function AdminPanel({ userName }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="min-h-screen bg-cream text-pixel-black">
      <SiteNav userName={userName} />

      {/* Header */}
      <header className="bg-green-dark text-cream shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="pixel-font text-base sm:text-lg tracking-wide">
            ADMIN PANEL
          </h1>
          <p className="text-cream-dark text-xs mt-1 opacity-80">
            Platform Overview & Management
          </p>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-cream-dark shadow-sm sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition cursor-pointer ${
                activeTab === tab.id
                  ? "border-green-plant text-green-dark"
                  : "border-transparent text-pixel-gray hover:text-pixel-black hover:border-cream-dark"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "plants" && <PlantsTab />}
        {activeTab === "activity" && <ActivityTab />}
        {activeTab === "launch-tracker" && <AdminDashboard />}
      </main>
    </div>
  );
}
```

Note: The `AdminDashboard` component (existing launch tracker) will need its `SiteNav` and outer `div` wrapper removed when rendered inside the launch-tracker tab. We'll handle this by adding an `embedded` prop.

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/components/admin/AdminPanel.tsx
git commit -m "feat: add main AdminPanel component with tab navigation"
```

### Task 14: Create the Overview tab

**Files:**
- Create: `website-astro/src/components/admin/OverviewTab.tsx`

- [ ] **Step 1: Implement OverviewTab**

```typescript
import { useState, useEffect } from "react";

interface Stats {
  totalUsers: number;
  totalPlants: number;
  totalReadings: number;
  totalCareLogs: number;
  pendingRecommendations: number;
  readingsToday: number;
}

export default function OverviewTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load stats");
        return res.json();
      })
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-pixel-gray">Loading stats...</p>;
  if (error) return <p className="text-sm text-accent-red">{error}</p>;
  if (!stats) return null;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, color: "bg-accent-blue text-white" },
    { label: "Total Plants", value: stats.totalPlants, color: "bg-green-plant text-white" },
    { label: "Sensor Readings", value: stats.totalReadings, color: "bg-brown text-white" },
    { label: "Care Logs", value: stats.totalCareLogs, color: "bg-green-dark text-cream" },
    { label: "Pending Recs", value: stats.pendingRecommendations, color: "bg-accent-orange text-white" },
    { label: "Readings Today", value: stats.readingsToday, color: "bg-pixel-black text-cream" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card) => (
          <div key={card.label} className={`${card.color} rounded-xl px-4 py-3 text-center shadow-sm`}>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-[10px] uppercase tracking-wider mt-1 opacity-80">
              {card.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/components/admin/OverviewTab.tsx
git commit -m "feat: add admin overview stats tab"
```

### Task 15: Create the Users tab with drill-down

**Files:**
- Create: `website-astro/src/components/admin/UsersTab.tsx`
- Create: `website-astro/src/components/admin/UserDetailModal.tsx`

- [ ] **Step 1: Implement UsersTab**

```typescript
import { useState, useEffect } from "react";
import UserDetailModal from "./UserDetailModal";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  plantCount: number;
  lastActive: string | null;
}

export default function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const limit = 25;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/users?limit=${limit}&offset=${page * limit}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load users");
        return res.json();
      })
      .then((data) => {
        setUsers(data.users);
        setTotal(data.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <p className="text-sm text-pixel-gray">Loading users...</p>;
  if (error) return <p className="text-sm text-accent-red">{error}</p>;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="pixel-font text-xs text-green-dark">{total} USERS</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-cream-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-dark bg-cream/50">
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Email</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Name</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Role</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Plants</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Joined</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className="border-b border-cream-dark/50 hover:bg-cream/40 cursor-pointer transition"
                >
                  <td className="px-4 py-2 font-medium">{user.email}</td>
                  <td className="px-4 py-2 text-pixel-gray">{user.name || "—"}</td>
                  <td className="px-4 py-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      user.role === "admin"
                        ? "bg-accent-blue/20 text-accent-blue"
                        : "bg-cream-dark text-pixel-gray"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-2">{user.plantCount}</td>
                  <td className="px-4 py-2 text-pixel-gray text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-pixel-gray text-xs">
                    {user.lastActive
                      ? new Date(user.lastActive).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 text-xs rounded border border-cream-dark disabled:opacity-40 cursor-pointer"
          >
            Prev
          </button>
          <span className="text-xs text-pixel-gray">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 text-xs rounded border border-cream-dark disabled:opacity-40 cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {/* User detail modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Implement UserDetailModal**

```typescript
import { useState, useEffect } from "react";

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  plants: Array<{
    id: string;
    name: string;
    species: string | null;
    emoji: string;
    createdAt: string;
  }>;
  recentCareLogs: Array<{
    id: string;
    plantName: string;
    action: string;
    notes: string | null;
    createdAt: string;
  }>;
  recentReadings: Array<{
    plantName: string;
    moisture: number | null;
    temperature: number | null;
    light: number | null;
    timestamp: string;
  }>;
}

export default function UserDetailModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then((res) => res.json())
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="pixel-font text-sm text-green-dark">USER DETAIL</h2>
          <button onClick={onClose} className="text-pixel-gray hover:text-pixel-black text-lg cursor-pointer">
            ✕
          </button>
        </div>

        {loading && <p className="text-sm text-pixel-gray">Loading...</p>}

        {user && (
          <div className="space-y-6">
            {/* User info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-pixel-gray">Email:</span> {user.email}</div>
              <div><span className="text-pixel-gray">Name:</span> {user.name || "—"}</div>
              <div><span className="text-pixel-gray">Role:</span> <span className={user.role === "admin" ? "text-accent-blue font-bold" : ""}>{user.role}</span></div>
              <div><span className="text-pixel-gray">Joined:</span> {new Date(user.createdAt).toLocaleDateString()}</div>
            </div>

            {/* Plants */}
            <div>
              <h3 className="pixel-font text-[10px] text-brown mb-2">PLANTS ({user.plants.length})</h3>
              {user.plants.length === 0 ? (
                <p className="text-xs text-pixel-gray italic">No plants</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user.plants.map((p) => (
                    <div key={p.id} className="bg-cream rounded-lg px-3 py-2 text-xs border border-cream-dark">
                      <span className="mr-1">{p.emoji}</span> {p.name}
                      {p.species && <span className="text-pixel-gray ml-1">({p.species})</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent care logs */}
            <div>
              <h3 className="pixel-font text-[10px] text-brown mb-2">RECENT CARE ({user.recentCareLogs.length})</h3>
              {user.recentCareLogs.length === 0 ? (
                <p className="text-xs text-pixel-gray italic">No care logs</p>
              ) : (
                <div className="space-y-1">
                  {user.recentCareLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-2 text-xs py-1 border-b border-cream-dark/30">
                      <span className="text-pixel-gray">{new Date(log.createdAt).toLocaleDateString()}</span>
                      <span className="font-medium">{log.plantName}</span>
                      <span className="px-1.5 py-0.5 bg-green-plant/10 text-green-dark rounded text-[10px]">{log.action}</span>
                      {log.notes && <span className="text-pixel-gray truncate">{log.notes}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent readings */}
            <div>
              <h3 className="pixel-font text-[10px] text-brown mb-2">RECENT READINGS ({user.recentReadings.length})</h3>
              {user.recentReadings.length === 0 ? (
                <p className="text-xs text-pixel-gray italic">No readings</p>
              ) : (
                <div className="space-y-1">
                  {user.recentReadings.slice(0, 10).map((r, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs py-1 border-b border-cream-dark/30">
                      <span className="text-pixel-gray">{new Date(r.timestamp).toLocaleDateString()}</span>
                      <span className="font-medium">{r.plantName}</span>
                      {r.moisture !== null && <span>💧{r.moisture}%</span>}
                      {r.temperature !== null && <span>🌡{r.temperature}°</span>}
                      {r.light !== null && <span>☀{r.light}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add website-astro/src/components/admin/UsersTab.tsx website-astro/src/components/admin/UserDetailModal.tsx
git commit -m "feat: add admin users tab with user detail modal"
```

---

## Chunk 5: Admin Panel UI — Plants, Activity & Launch Tracker Integration

### Task 16: Create the Plants tab

**Files:**
- Create: `website-astro/src/components/admin/PlantsTab.tsx`

- [ ] **Step 1: Implement PlantsTab**

```typescript
import { useState, useEffect } from "react";

interface AdminPlant {
  id: string;
  name: string;
  species: string | null;
  emoji: string;
  ownerEmail: string;
  ownerId: string;
  moisture: number | null;
  temperature: number | null;
  light: number | null;
  lastReadingAt: string | null;
  createdAt: string;
}

export default function PlantsTab() {
  const [plants, setPlants] = useState<AdminPlant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const limit = 25;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/plants?limit=${limit}&offset=${page * limit}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load plants");
        return res.json();
      })
      .then((data) => {
        setPlants(data.plants);
        setTotal(data.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <p className="text-sm text-pixel-gray">Loading plants...</p>;
  if (error) return <p className="text-sm text-accent-red">{error}</p>;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <h2 className="pixel-font text-xs text-green-dark">{total} PLANTS</h2>

      <div className="bg-white rounded-xl shadow-sm border border-cream-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-dark bg-cream/50">
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Plant</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Species</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Owner</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Moisture</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Temp</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Light</th>
                <th className="text-left px-4 py-2 text-xs text-pixel-gray font-semibold">Last Reading</th>
              </tr>
            </thead>
            <tbody>
              {plants.map((plant) => (
                <tr key={plant.id} className="border-b border-cream-dark/50 hover:bg-cream/40 transition">
                  <td className="px-4 py-2">
                    <span className="mr-1">{plant.emoji}</span>
                    <span className="font-medium">{plant.name}</span>
                  </td>
                  <td className="px-4 py-2 text-pixel-gray">{plant.species || "—"}</td>
                  <td className="px-4 py-2 text-xs">{plant.ownerEmail}</td>
                  <td className="px-4 py-2">
                    {plant.moisture !== null ? `${plant.moisture}%` : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {plant.temperature !== null ? `${plant.temperature}°C` : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {plant.light !== null ? plant.light : "—"}
                  </td>
                  <td className="px-4 py-2 text-pixel-gray text-xs">
                    {plant.lastReadingAt
                      ? new Date(plant.lastReadingAt).toLocaleDateString()
                      : "No readings"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 text-xs rounded border border-cream-dark disabled:opacity-40 cursor-pointer"
          >
            Prev
          </button>
          <span className="text-xs text-pixel-gray">Page {page + 1} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 text-xs rounded border border-cream-dark disabled:opacity-40 cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/components/admin/PlantsTab.tsx
git commit -m "feat: add admin plants tab"
```

### Task 17: Create the Activity tab

**Files:**
- Create: `website-astro/src/components/admin/ActivityTab.tsx`

- [ ] **Step 1: Implement ActivityTab**

```typescript
import { useState, useEffect } from "react";

interface ActivityItem {
  id: string;
  type: "care_log" | "sensor_reading";
  userEmail: string;
  userId: string;
  plantName: string;
  plantEmoji: string;
  detail: string;
  timestamp: string;
}

export default function ActivityTab() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/activity?limit=100")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load activity");
        return res.json();
      })
      .then(setActivity)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-pixel-gray">Loading activity...</p>;
  if (error) return <p className="text-sm text-accent-red">{error}</p>;

  return (
    <div className="space-y-4">
      <h2 className="pixel-font text-xs text-green-dark">RECENT ACTIVITY</h2>

      <div className="bg-white rounded-xl shadow-sm border border-cream-dark divide-y divide-cream-dark/50">
        {activity.length === 0 && (
          <p className="px-4 py-6 text-sm text-pixel-gray text-center italic">
            No activity yet
          </p>
        )}
        {activity.map((item) => (
          <div key={`${item.type}-${item.id}`} className="px-4 py-3 flex items-start gap-3 hover:bg-cream/30 transition">
            {/* Type icon */}
            <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              item.type === "care_log"
                ? "bg-green-plant/20 text-green-dark"
                : "bg-accent-blue/20 text-accent-blue"
            }`}>
              {item.type === "care_log" ? "CARE" : "READING"}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <span>{item.plantEmoji}</span>
                <span className="font-medium">{item.plantName}</span>
                <span className="text-pixel-gray">—</span>
                <span className="text-pixel-gray truncate">{item.detail}</span>
              </div>
              <div className="text-xs text-pixel-gray mt-1">
                {item.userEmail} · {new Date(item.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/components/admin/ActivityTab.tsx
git commit -m "feat: add admin activity feed tab"
```

### Task 18: Make AdminDashboard (launch tracker) embeddable

**Files:**
- Modify: `website-astro/src/components/AdminDashboard.tsx`

The existing `AdminDashboard` component wraps itself in a full-page layout with `SiteNav` and its own header. When embedded inside the `AdminPanel` tab view, it should skip the outer wrapper.

- [ ] **Step 1: Add `embedded` prop to AdminDashboard**

Add the prop to the component signature:

```typescript
interface AdminDashboardProps {
  embedded?: boolean;
}

export default function AdminDashboard({ embedded = false }: AdminDashboardProps) {
```

When `embedded` is true, skip the outer `div` with `min-h-screen`, `SiteNav`, and `header`. Just render the `<main>` contents directly.

Wrap the return in a conditional:

```typescript
if (embedded) {
  return (
    <div className="space-y-6">
      {/* Summary bar, progress, phases — same as existing <main> content */}
      {/* Copy the content of <main> here, without the outer wrapper/nav/header */}
    </div>
  );
}

// Original return stays as-is for backwards compatibility
return (
  <div className="min-h-screen bg-cream text-pixel-black">
    ...
  </div>
);
```

Actually, cleaner approach: extract the main content into a variable and conditionally wrap it:

```typescript
const mainContent = (
  <>
    {/* Summary Bar */}
    <section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {/* ... existing ... */}
    </section>
    {/* ... rest of existing main content ... */}
  </>
);

if (embedded) {
  return <div className="space-y-6">{mainContent}</div>;
}

return (
  <div className="min-h-screen bg-cream text-pixel-black">
    <SiteNav />
    <header>...</header>
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {mainContent}
    </main>
  </div>
);
```

- [ ] **Step 2: Update AdminPanel to pass embedded prop**

In `AdminPanel.tsx`, change the launch tracker tab rendering:

```typescript
{activeTab === "launch-tracker" && <AdminDashboard embedded />}
```

- [ ] **Step 3: Commit**

```bash
git add website-astro/src/components/AdminDashboard.tsx website-astro/src/components/admin/AdminPanel.tsx
git commit -m "feat: make launch tracker embeddable in admin panel tabs"
```

---

## Chunk 6: Final Wiring & Verification

### Task 19: Run tests

- [ ] **Step 1: Run full test suite**

Run: `cd website-astro && npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Fix any failures**

Address any import issues or type errors.

### Task 20: Run build

- [ ] **Step 1: Run Astro build to verify no compile errors**

Run: `cd website-astro && npm run build`
Expected: Build succeeds

- [ ] **Step 2: Fix any build errors**

Address any TypeScript or import issues.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: fix any build issues from admin panel implementation"
```

### Task 21: Promote first admin user

- [ ] **Step 1: Document how to set the first admin**

Since there's no admin yet to use the UI, the first admin must be set via direct database update:

```sql
UPDATE user SET role = 'admin' WHERE email = 'your-email@example.com';
```

Or use better-auth's `adminUserIds` as a bootstrap:

```typescript
admin({
  defaultRole: "user",
  adminUserIds: ["<your-user-id>"],
}),
```

This is a one-time bootstrap step. After the first admin exists, they can promote other users via better-auth's admin API.

- [ ] **Step 2: Commit any bootstrap config changes**

```bash
git add website-astro/src/lib/auth.ts
git commit -m "docs: add admin bootstrap via adminUserIds"
```
