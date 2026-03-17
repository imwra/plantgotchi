# LMS Creator & Courses Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a learning management system where Plantgotchi users become creators, build courses with phases/modules/content blocks, and learners enroll and track progress.

**Architecture:** Extends existing Astro + React islands app. New SQL tables in schema.sql, query functions in lms-queries.ts, API routes under /api/creators and /api/courses, React components following atomic design, Astro pages for routing.

**Tech Stack:** Astro 6, React 19, Turso/SQLite via @libsql/client, BetterAuth, Tailwind CSS, Vitest

**Spec:** `docs/superpowers/specs/2026-03-17-lms-creator-courses-design.md`

---

## Chunk 1: Database Schema & Types

### Task 1: Add LMS tables to schema.sql

**Files:**
- Modify: `website-astro/src/lib/db/schema.sql`

- [ ] **Step 1: Add creator_profiles table**

Append to end of schema.sql:

```sql
-- LMS: Creator Profiles
CREATE TABLE IF NOT EXISTS creator_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_user_id ON creator_profiles(user_id);
```

- [ ] **Step 2: Add courses table**

```sql
-- LMS: Courses
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image_url TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_courses_creator_id ON courses(creator_id);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
```

- [ ] **Step 3: Add course_phases table**

```sql
-- LMS: Course Phases
CREATE TABLE IF NOT EXISTS course_phases (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_course_phases_course_id_sort ON course_phases(course_id, sort_order);
```

- [ ] **Step 4: Add phase_modules table**

```sql
-- LMS: Phase Modules
CREATE TABLE IF NOT EXISTS phase_modules (
  id TEXT PRIMARY KEY,
  phase_id TEXT NOT NULL REFERENCES course_phases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL,
  is_preview INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_phase_modules_phase_id_sort ON phase_modules(phase_id, sort_order);
```

- [ ] **Step 5: Add module_content_blocks table**

```sql
-- LMS: Module Content Blocks
CREATE TABLE IF NOT EXISTS module_content_blocks (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES phase_modules(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK(block_type IN ('video', 'text', 'quiz')),
  sort_order INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_content_blocks_module_id_sort ON module_content_blocks(module_id, sort_order);
```

- [ ] **Step 6: Add course_enrollments table**

```sql
-- LMS: Course Enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  price_paid_cents INTEGER NOT NULL DEFAULT 0,
  enrolled_at TEXT DEFAULT (datetime('now')),
  UNIQUE(course_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
```

- [ ] **Step 7: Add module_completions table**

```sql
-- LMS: Module Completions
CREATE TABLE IF NOT EXISTS module_completions (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES phase_modules(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  completed_at TEXT DEFAULT (datetime('now')),
  quiz_answers TEXT,
  UNIQUE(module_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_module_completions_user_id ON module_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_module_completions_module_id ON module_completions(module_id);
```

- [ ] **Step 8: Commit**

```bash
git add website-astro/src/lib/db/schema.sql
git commit -m "feat(lms): add database tables for creator profiles, courses, phases, modules, blocks, enrollments, completions"
```

### Task 2: Add LMS migration to schema.ts

**Files:**
- Modify: `website-astro/src/lib/db/schema.ts`

- [ ] **Step 1: Add runLmsMigrations function**

Add after existing `runMigrations` function:

```typescript
export async function runLmsMigrations(): Promise<string[]> {
  const db = getDb();

  const tables = [
    'creator_profiles',
    'courses',
    'course_phases',
    'phase_modules',
    'module_content_blocks',
    'course_enrollments',
    'module_completions',
  ];

  await db.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS creator_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        bio TEXT,
        avatar_url TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_creator_profiles_user_id ON creator_profiles(user_id)`, args: [] },
    {
      sql: `CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        creator_id TEXT NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        cover_image_url TEXT,
        price_cents INTEGER NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'USD',
        status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_courses_creator_id ON courses(creator_id)`, args: [] },
    { sql: `CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug)`, args: [] },
    { sql: `CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status)`, args: [] },
    {
      sql: `CREATE TABLE IF NOT EXISTS course_phases (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        sort_order INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_course_phases_course_id_sort ON course_phases(course_id, sort_order)`, args: [] },
    {
      sql: `CREATE TABLE IF NOT EXISTS phase_modules (
        id TEXT PRIMARY KEY,
        phase_id TEXT NOT NULL REFERENCES course_phases(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        sort_order INTEGER NOT NULL,
        is_preview INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_phase_modules_phase_id_sort ON phase_modules(phase_id, sort_order)`, args: [] },
    {
      sql: `CREATE TABLE IF NOT EXISTS module_content_blocks (
        id TEXT PRIMARY KEY,
        module_id TEXT NOT NULL REFERENCES phase_modules(id) ON DELETE CASCADE,
        block_type TEXT NOT NULL CHECK(block_type IN ('video', 'text', 'quiz')),
        sort_order INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_content_blocks_module_id_sort ON module_content_blocks(module_id, sort_order)`, args: [] },
    {
      sql: `CREATE TABLE IF NOT EXISTS course_enrollments (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        price_paid_cents INTEGER NOT NULL DEFAULT 0,
        enrolled_at TEXT DEFAULT (datetime('now')),
        UNIQUE(course_id, user_id)
      )`,
      args: [],
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments(user_id)`, args: [] },
    { sql: `CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id)`, args: [] },
    {
      sql: `CREATE TABLE IF NOT EXISTS module_completions (
        id TEXT PRIMARY KEY,
        module_id TEXT NOT NULL REFERENCES phase_modules(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        completed_at TEXT DEFAULT (datetime('now')),
        quiz_answers TEXT,
        UNIQUE(module_id, user_id)
      )`,
      args: [],
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_module_completions_user_id ON module_completions(user_id)`, args: [] },
    { sql: `CREATE INDEX IF NOT EXISTS idx_module_completions_module_id ON module_completions(module_id)`, args: [] },
  ]);

  return tables;
}
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/lib/db/schema.ts
git commit -m "feat(lms): add LMS migration function"
```

### Task 3: Create LMS TypeScript types and query functions

**Files:**
- Create: `website-astro/src/lib/db/lms-queries.ts`

- [ ] **Step 1: Create lms-queries.ts with types**

```typescript
import { getDb } from './client';

// ── Types ──

export interface CreatorProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  creator_id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  price_cents: number;
  currency: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface CoursePhase {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PhaseModule {
  id: string;
  phase_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_preview: number;
  created_at: string;
  updated_at: string;
}

export interface ModuleContentBlock {
  id: string;
  module_id: string;
  block_type: 'video' | 'text' | 'quiz';
  sort_order: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  user_id: string;
  price_paid_cents: number;
  enrolled_at: string;
}

export interface ModuleCompletion {
  id: string;
  module_id: string;
  user_id: string;
  completed_at: string;
  quiz_answers: string | null;
}

// ── Helpers ──

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function uniqueSlug(baseSlug: string): Promise<string> {
  const db = getDb();
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await db.execute({ sql: 'SELECT id FROM courses WHERE slug = ?', args: [slug] });
    if (existing.rows.length === 0) return slug;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

// ── Creator Profile Queries ──

export async function getCreatorByUserId(userId: string): Promise<CreatorProfile | null> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM creator_profiles WHERE user_id = ?', args: [userId] });
  return (result.rows[0] as unknown as CreatorProfile) || null;
}

export async function getCreatorById(id: string): Promise<CreatorProfile | null> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM creator_profiles WHERE id = ?', args: [id] });
  return (result.rows[0] as unknown as CreatorProfile) || null;
}

export async function createCreatorProfile(userId: string, displayName: string, bio?: string): Promise<CreatorProfile> {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO creator_profiles (id, user_id, display_name, bio, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, userId, displayName, bio || null, now, now],
  });
  return { id, user_id: userId, display_name: displayName, bio: bio || null, avatar_url: null, created_at: now, updated_at: now };
}

export async function updateCreatorProfile(id: string, updates: { display_name?: string; bio?: string; avatar_url?: string }): Promise<void> {
  const db = getDb();
  const sets: string[] = [];
  const args: unknown[] = [];
  if (updates.display_name !== undefined) { sets.push('display_name = ?'); args.push(updates.display_name); }
  if (updates.bio !== undefined) { sets.push('bio = ?'); args.push(updates.bio); }
  if (updates.avatar_url !== undefined) { sets.push('avatar_url = ?'); args.push(updates.avatar_url); }
  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now')");
  args.push(id);
  await db.execute({ sql: `UPDATE creator_profiles SET ${sets.join(', ')} WHERE id = ?`, args });
}

// ── Course Queries ──

export async function listPublishedCourses(limit = 50, offset = 0): Promise<(Course & { creator_name: string; enrollment_count: number })[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT c.*, cp.display_name as creator_name,
            (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) as enrollment_count
          FROM courses c
          JOIN creator_profiles cp ON cp.id = c.creator_id
          WHERE c.status = 'published'
          ORDER BY c.created_at DESC
          LIMIT ? OFFSET ?`,
    args: [limit, offset],
  });
  return result.rows as unknown as (Course & { creator_name: string; enrollment_count: number })[];
}

export async function listCreatorCourses(creatorId: string): Promise<(Course & { enrollment_count: number })[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT c.*,
            (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) as enrollment_count
          FROM courses c
          WHERE c.creator_id = ?
          ORDER BY c.created_at DESC`,
    args: [creatorId],
  });
  return result.rows as unknown as (Course & { enrollment_count: number })[];
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM courses WHERE slug = ?', args: [slug] });
  return (result.rows[0] as unknown as Course) || null;
}

export async function createCourse(creatorId: string, title: string, description?: string, priceCents = 0, currency = 'USD'): Promise<Course> {
  const db = getDb();
  const id = crypto.randomUUID();
  const slug = await uniqueSlug(generateSlug(title));
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO courses (id, creator_id, title, slug, description, price_cents, currency, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
    args: [id, creatorId, title, slug, description || null, priceCents, currency, now, now],
  });
  return { id, creator_id: creatorId, title, slug, description: description || null, cover_image_url: null, price_cents: priceCents, currency, status: 'draft', created_at: now, updated_at: now };
}

export async function updateCourse(id: string, updates: { title?: string; description?: string; cover_image_url?: string; price_cents?: number; currency?: string; status?: string; slug?: string }): Promise<void> {
  const db = getDb();
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) { sets.push(`${key} = ?`); args.push(value); }
  }
  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now')");
  args.push(id);
  await db.execute({ sql: `UPDATE courses SET ${sets.join(', ')} WHERE id = ?`, args });
}

export async function deleteCourse(id: string): Promise<void> {
  const db = getDb();
  await db.execute({ sql: `UPDATE courses SET status = 'archived', updated_at = datetime('now') WHERE id = ?`, args: [id] });
}

// ── Phase Queries ──

export async function listPhases(courseId: string): Promise<CoursePhase[]> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM course_phases WHERE course_id = ? ORDER BY sort_order', args: [courseId] });
  return result.rows as unknown as CoursePhase[];
}

export async function createPhase(courseId: string, title: string, description?: string): Promise<CoursePhase> {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const maxOrder = await db.execute({ sql: 'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM course_phases WHERE course_id = ?', args: [courseId] });
  const sortOrder = ((maxOrder.rows[0] as unknown as { max_order: number }).max_order) + 1;
  await db.execute({
    sql: `INSERT INTO course_phases (id, course_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, courseId, title, description || null, sortOrder, now, now],
  });
  return { id, course_id: courseId, title, description: description || null, sort_order: sortOrder, created_at: now, updated_at: now };
}

export async function updatePhase(id: string, updates: { title?: string; description?: string; sort_order?: number }): Promise<void> {
  const db = getDb();
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) { sets.push(`${key} = ?`); args.push(value); }
  }
  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now')");
  args.push(id);
  await db.execute({ sql: `UPDATE course_phases SET ${sets.join(', ')} WHERE id = ?`, args });
}

export async function deletePhase(id: string): Promise<void> {
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM course_phases WHERE id = ?', args: [id] });
}

// ── Module Queries ──

export async function listModules(phaseId: string): Promise<PhaseModule[]> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM phase_modules WHERE phase_id = ? ORDER BY sort_order', args: [phaseId] });
  return result.rows as unknown as PhaseModule[];
}

export async function getModule(id: string): Promise<PhaseModule | null> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM phase_modules WHERE id = ?', args: [id] });
  return (result.rows[0] as unknown as PhaseModule) || null;
}

export async function createModule(phaseId: string, title: string, description?: string, isPreview = false): Promise<PhaseModule> {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const maxOrder = await db.execute({ sql: 'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM phase_modules WHERE phase_id = ?', args: [phaseId] });
  const sortOrder = ((maxOrder.rows[0] as unknown as { max_order: number }).max_order) + 1;
  await db.execute({
    sql: `INSERT INTO phase_modules (id, phase_id, title, description, sort_order, is_preview, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, phaseId, title, description || null, sortOrder, isPreview ? 1 : 0, now, now],
  });
  return { id, phase_id: phaseId, title, description: description || null, sort_order: sortOrder, is_preview: isPreview ? 1 : 0, created_at: now, updated_at: now };
}

export async function updateModule(id: string, updates: { title?: string; description?: string; sort_order?: number; is_preview?: number }): Promise<void> {
  const db = getDb();
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) { sets.push(`${key} = ?`); args.push(value); }
  }
  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now')");
  args.push(id);
  await db.execute({ sql: `UPDATE phase_modules SET ${sets.join(', ')} WHERE id = ?`, args });
}

export async function deleteModule(id: string): Promise<void> {
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM phase_modules WHERE id = ?', args: [id] });
}

// ── Content Block Queries ──

export async function listContentBlocks(moduleId: string): Promise<ModuleContentBlock[]> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM module_content_blocks WHERE module_id = ? ORDER BY sort_order', args: [moduleId] });
  return result.rows as unknown as ModuleContentBlock[];
}

export async function createContentBlock(moduleId: string, blockType: 'video' | 'text' | 'quiz', content: string): Promise<ModuleContentBlock> {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const maxOrder = await db.execute({ sql: 'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM module_content_blocks WHERE module_id = ?', args: [moduleId] });
  const sortOrder = ((maxOrder.rows[0] as unknown as { max_order: number }).max_order) + 1;
  await db.execute({
    sql: `INSERT INTO module_content_blocks (id, module_id, block_type, sort_order, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, moduleId, blockType, sortOrder, content, now, now],
  });
  return { id, module_id: moduleId, block_type: blockType, sort_order: sortOrder, content, created_at: now, updated_at: now };
}

export async function updateContentBlock(id: string, updates: { block_type?: string; sort_order?: number; content?: string }): Promise<void> {
  const db = getDb();
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) { sets.push(`${key} = ?`); args.push(value); }
  }
  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now')");
  args.push(id);
  await db.execute({ sql: `UPDATE module_content_blocks SET ${sets.join(', ')} WHERE id = ?`, args });
}

export async function deleteContentBlock(id: string): Promise<void> {
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM module_content_blocks WHERE id = ?', args: [id] });
}

// ── Enrollment Queries ──

export async function enrollUser(courseId: string, userId: string, pricePaidCents = 0): Promise<CourseEnrollment> {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO course_enrollments (id, course_id, user_id, price_paid_cents, enrolled_at) VALUES (?, ?, ?, ?, ?)`,
    args: [id, courseId, userId, pricePaidCents, now],
  });
  return { id, course_id: courseId, user_id: userId, price_paid_cents: pricePaidCents, enrolled_at: now };
}

export async function getEnrollment(courseId: string, userId: string): Promise<CourseEnrollment | null> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM course_enrollments WHERE course_id = ? AND user_id = ?', args: [courseId, userId] });
  return (result.rows[0] as unknown as CourseEnrollment) || null;
}

export async function listUserEnrollments(userId: string): Promise<(CourseEnrollment & { title: string; slug: string; cover_image_url: string | null; creator_name: string })[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT ce.*, c.title, c.slug, c.cover_image_url, cp.display_name as creator_name
          FROM course_enrollments ce
          JOIN courses c ON c.id = ce.course_id
          JOIN creator_profiles cp ON cp.id = c.creator_id
          WHERE ce.user_id = ?
          ORDER BY ce.enrolled_at DESC`,
    args: [userId],
  });
  return result.rows as unknown as (CourseEnrollment & { title: string; slug: string; cover_image_url: string | null; creator_name: string })[];
}

// ── Completion / Progress Queries ──

export async function completeModule(moduleId: string, userId: string, quizAnswers?: string): Promise<ModuleCompletion> {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT OR IGNORE INTO module_completions (id, module_id, user_id, completed_at, quiz_answers) VALUES (?, ?, ?, ?, ?)`,
    args: [id, moduleId, userId, now, quizAnswers || null],
  });
  const result = await db.execute({ sql: 'SELECT * FROM module_completions WHERE module_id = ? AND user_id = ?', args: [moduleId, userId] });
  return result.rows[0] as unknown as ModuleCompletion;
}

export interface CourseProgress {
  total_modules: number;
  completed_modules: number;
  phases: { phase_id: string; title: string; total: number; completed: number }[];
}

export async function getCourseProgress(courseId: string, userId: string): Promise<CourseProgress> {
  const db = getDb();
  const phases = await db.execute({ sql: 'SELECT * FROM course_phases WHERE course_id = ? ORDER BY sort_order', args: [courseId] });
  const phaseRows = phases.rows as unknown as CoursePhase[];

  let totalModules = 0;
  let completedModules = 0;
  const phaseProgress: CourseProgress['phases'] = [];

  for (const phase of phaseRows) {
    const modules = await db.execute({ sql: 'SELECT id FROM phase_modules WHERE phase_id = ?', args: [phase.id] });
    const moduleIds = (modules.rows as unknown as { id: string }[]).map(m => m.id);
    const total = moduleIds.length;
    let completed = 0;

    if (moduleIds.length > 0) {
      const placeholders = moduleIds.map(() => '?').join(',');
      const completions = await db.execute({
        sql: `SELECT COUNT(*) as cnt FROM module_completions WHERE user_id = ? AND module_id IN (${placeholders})`,
        args: [userId, ...moduleIds],
      });
      completed = (completions.rows[0] as unknown as { cnt: number }).cnt;
    }

    totalModules += total;
    completedModules += completed;
    phaseProgress.push({ phase_id: phase.id, title: phase.title, total, completed });
  }

  return { total_modules: totalModules, completed_modules: completedModules, phases: phaseProgress };
}

// ── Course detail with full tree ──

export async function getCourseWithContent(slug: string): Promise<(Course & { creator_name: string; phases: (CoursePhase & { modules: (PhaseModule & { blocks: ModuleContentBlock[] })[] })[] }) | null> {
  const course = await getCourseBySlug(slug);
  if (!course) return null;

  const db = getDb();
  const creatorResult = await db.execute({ sql: 'SELECT display_name FROM creator_profiles WHERE id = ?', args: [course.creator_id] });
  const creatorName = (creatorResult.rows[0] as unknown as { display_name: string })?.display_name || 'Unknown';

  const phaseRows = await listPhases(course.id);
  const phases = await Promise.all(phaseRows.map(async (phase) => {
    const moduleRows = await listModules(phase.id);
    const modules = await Promise.all(moduleRows.map(async (mod) => {
      const blocks = await listContentBlocks(mod.id);
      return { ...mod, blocks };
    }));
    return { ...phase, modules };
  }));

  return { ...course, creator_name: creatorName, phases };
}
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/lib/db/lms-queries.ts
git commit -m "feat(lms): add TypeScript types and query functions for LMS"
```

---

## Chunk 2: API Routes

### Task 4: Creator API routes

**Files:**
- Create: `website-astro/src/pages/api/creators/index.ts`
- Create: `website-astro/src/pages/api/creators/me.ts`
- Create: `website-astro/src/pages/api/creators/[id].ts`

- [ ] **Step 1: Create POST /api/creators and GET /api/creators**

Create `website-astro/src/pages/api/creators/index.ts`:

```typescript
import type { APIRoute } from "astro";
import { getSession } from "../../../lib/auth";
import { createCreatorProfile, getCreatorByUserId } from "../../../lib/db/lms-queries";

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const existing = await getCreatorByUserId(session.user.id);
  if (existing) {
    return new Response(JSON.stringify({ error: "Already a creator" }), { status: 409, headers: { "Content-Type": "application/json" } });
  }

  const body = await request.json();
  const { display_name, bio } = body;
  if (!display_name) {
    return new Response(JSON.stringify({ error: "display_name is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const profile = await createCreatorProfile(session.user.id, display_name, bio);
  return new Response(JSON.stringify(profile), { status: 201, headers: { "Content-Type": "application/json" } });
};
```

- [ ] **Step 2: Create GET /api/creators/[id]**

Create `website-astro/src/pages/api/creators/[id].ts`:

```typescript
import type { APIRoute } from "astro";
import { getCreatorById } from "../../../lib/db/lms-queries";

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  if (!id) return new Response("Not found", { status: 404 });

  const creator = await getCreatorById(id);
  if (!creator) return new Response("Not found", { status: 404 });

  return new Response(JSON.stringify(creator), { headers: { "Content-Type": "application/json" } });
};
```

- [ ] **Step 3: Create PATCH /api/creators/me**

Create `website-astro/src/pages/api/creators/me.ts`:

```typescript
import type { APIRoute } from "astro";
import { getSession } from "../../../lib/auth";
import { getCreatorByUserId, updateCreatorProfile } from "../../../lib/db/lms-queries";

export const PATCH: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator) return new Response(JSON.stringify({ error: "Not a creator" }), { status: 403, headers: { "Content-Type": "application/json" } });

  const body = await request.json();
  await updateCreatorProfile(creator.id, body);
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
};

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator) return new Response(JSON.stringify(null), { headers: { "Content-Type": "application/json" } });

  return new Response(JSON.stringify(creator), { headers: { "Content-Type": "application/json" } });
};
```

- [ ] **Step 4: Commit**

```bash
git add website-astro/src/pages/api/creators/
git commit -m "feat(lms): add creator profile API routes"
```

### Task 5: Course CRUD API routes

**Files:**
- Create: `website-astro/src/pages/api/courses/index.ts`
- Create: `website-astro/src/pages/api/courses/[slug]/index.ts`

- [ ] **Step 1: Create GET/POST /api/courses**

Create `website-astro/src/pages/api/courses/index.ts`:

```typescript
import type { APIRoute } from "astro";
import { getSession } from "../../../lib/auth";
import { getCreatorByUserId, listPublishedCourses, listCreatorCourses, createCourse } from "../../../lib/db/lms-queries";

export const GET: APIRoute = async ({ request, url }) => {
  const session = await getSession(request);
  const mine = url.searchParams.get("mine") === "true";
  const limit = Number(url.searchParams.get("limit") || 50);
  const offset = Number(url.searchParams.get("offset") || 0);

  if (mine) {
    if (!session) return new Response("Unauthorized", { status: 401 });
    const creator = await getCreatorByUserId(session.user.id);
    if (!creator) return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
    const courses = await listCreatorCourses(creator.id);
    return new Response(JSON.stringify(courses), { headers: { "Content-Type": "application/json" } });
  }

  const courses = await listPublishedCourses(limit, offset);
  return new Response(JSON.stringify(courses), { headers: { "Content-Type": "application/json" } });
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator) return new Response(JSON.stringify({ error: "Must be a creator" }), { status: 403, headers: { "Content-Type": "application/json" } });

  const body = await request.json();
  const { title, description, price_cents, currency } = body;
  if (!title) {
    return new Response(JSON.stringify({ error: "title is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const course = await createCourse(creator.id, title, description, price_cents, currency);
  return new Response(JSON.stringify(course), { status: 201, headers: { "Content-Type": "application/json" } });
};
```

- [ ] **Step 2: Create GET/PATCH/DELETE /api/courses/[slug]**

Create `website-astro/src/pages/api/courses/[slug]/index.ts`:

```typescript
import type { APIRoute } from "astro";
import { getSession } from "../../../../lib/auth";
import { getCourseBySlug, getCourseWithContent, updateCourse, deleteCourse, getCreatorByUserId } from "../../../../lib/db/lms-queries";

export const GET: APIRoute = async ({ params }) => {
  const { slug } = params;
  if (!slug) return new Response("Not found", { status: 404 });

  const course = await getCourseWithContent(slug);
  if (!course) return new Response("Not found", { status: 404 });

  return new Response(JSON.stringify(course), { headers: { "Content-Type": "application/json" } });
};

export const PATCH: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug } = params;
  if (!slug) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator || creator.id !== course.creator_id) {
    return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const body = await request.json();
  await updateCourse(course.id, body);
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug } = params;
  if (!slug) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator || creator.id !== course.creator_id) {
    return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  await deleteCourse(course.id);
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
};
```

- [ ] **Step 3: Commit**

```bash
git add website-astro/src/pages/api/courses/
git commit -m "feat(lms): add course CRUD API routes"
```

### Task 6: Phase API routes

**Files:**
- Create: `website-astro/src/pages/api/courses/[slug]/phases/index.ts`
- Create: `website-astro/src/pages/api/courses/[slug]/phases/[phaseId]/index.ts`

- [ ] **Step 1: Create GET/POST /api/courses/[slug]/phases**

Create `website-astro/src/pages/api/courses/[slug]/phases/index.ts`:

```typescript
import type { APIRoute } from "astro";
import { getSession } from "../../../../../lib/auth";
import { getCourseBySlug, getCreatorByUserId, listPhases, createPhase } from "../../../../../lib/db/lms-queries";

export const GET: APIRoute = async ({ params }) => {
  const { slug } = params;
  if (!slug) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  const phases = await listPhases(course.id);
  return new Response(JSON.stringify(phases), { headers: { "Content-Type": "application/json" } });
};

export const POST: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug } = params;
  if (!slug) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator || creator.id !== course.creator_id) {
    return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const body = await request.json();
  if (!body.title) {
    return new Response(JSON.stringify({ error: "title is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const phase = await createPhase(course.id, body.title, body.description);
  return new Response(JSON.stringify(phase), { status: 201, headers: { "Content-Type": "application/json" } });
};
```

- [ ] **Step 2: Create PATCH/DELETE /api/courses/[slug]/phases/[phaseId]**

Create `website-astro/src/pages/api/courses/[slug]/phases/[phaseId]/index.ts`:

```typescript
import type { APIRoute } from "astro";
import { getSession } from "../../../../../../lib/auth";
import { getCourseBySlug, getCreatorByUserId, updatePhase, deletePhase } from "../../../../../../lib/db/lms-queries";

export const PATCH: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug, phaseId } = params;
  if (!slug || !phaseId) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator || creator.id !== course.creator_id) {
    return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const body = await request.json();
  await updatePhase(phaseId, body);
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug, phaseId } = params;
  if (!slug || !phaseId) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator || creator.id !== course.creator_id) {
    return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  await deletePhase(phaseId);
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
};
```

- [ ] **Step 3: Commit**

```bash
git add website-astro/src/pages/api/courses/\[slug\]/phases/
git commit -m "feat(lms): add phase API routes"
```

### Task 7: Module API routes

**Files:**
- Create: `website-astro/src/pages/api/courses/[slug]/phases/[phaseId]/modules/index.ts`
- Create: `website-astro/src/pages/api/courses/[slug]/phases/[phaseId]/modules/[moduleId]/index.ts`

- [ ] **Step 1: Create GET/POST modules**

Create `website-astro/src/pages/api/courses/[slug]/phases/[phaseId]/modules/index.ts`:

```typescript
import type { APIRoute } from "astro";
import { getSession } from "../../../../../../../lib/auth";
import { getCourseBySlug, getCreatorByUserId, listModules, createModule } from "../../../../../../../lib/db/lms-queries";

export const GET: APIRoute = async ({ params }) => {
  const { phaseId } = params;
  if (!phaseId) return new Response("Not found", { status: 404 });

  const modules = await listModules(phaseId);
  return new Response(JSON.stringify(modules), { headers: { "Content-Type": "application/json" } });
};

export const POST: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug, phaseId } = params;
  if (!slug || !phaseId) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator || creator.id !== course.creator_id) {
    return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const body = await request.json();
  if (!body.title) {
    return new Response(JSON.stringify({ error: "title is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const mod = await createModule(phaseId, body.title, body.description, body.is_preview);
  return new Response(JSON.stringify(mod), { status: 201, headers: { "Content-Type": "application/json" } });
};
```

- [ ] **Step 2: Create PATCH/DELETE module**

Create `website-astro/src/pages/api/courses/[slug]/phases/[phaseId]/modules/[moduleId]/index.ts`:

```typescript
import type { APIRoute } from "astro";
import { getSession } from "../../../../../../../../lib/auth";
import { getCourseBySlug, getCreatorByUserId, updateModule, deleteModule } from "../../../../../../../../lib/db/lms-queries";

export const PATCH: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug, moduleId } = params;
  if (!slug || !moduleId) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator || creator.id !== course.creator_id) {
    return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const body = await request.json();
  await updateModule(moduleId, body);
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug, moduleId } = params;
  if (!slug || !moduleId) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator || creator.id !== course.creator_id) {
    return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  await deleteModule(moduleId);
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
};
```

- [ ] **Step 3: Commit**

```bash
git add website-astro/src/pages/api/courses/\[slug\]/phases/\[phaseId\]/modules/
git commit -m "feat(lms): add module API routes"
```

### Task 8: Content Block API routes

**Files:**
- Create: `website-astro/src/pages/api/courses/[slug]/phases/[phaseId]/modules/[moduleId]/blocks/index.ts`
- Create: `website-astro/src/pages/api/courses/[slug]/phases/[phaseId]/modules/[moduleId]/blocks/[blockId].ts`

- [ ] **Step 1: Create GET/POST blocks**

Create `website-astro/src/pages/api/courses/[slug]/phases/[phaseId]/modules/[moduleId]/blocks/index.ts`:

```typescript
import type { APIRoute } from "astro";
import { getSession } from "../../../../../../../../lib/auth";
import { getCourseBySlug, getCreatorByUserId, listContentBlocks, createContentBlock } from "../../../../../../../../lib/db/lms-queries";

export const GET: APIRoute = async ({ params }) => {
  const { moduleId } = params;
  if (!moduleId) return new Response("Not found", { status: 404 });

  const blocks = await listContentBlocks(moduleId);
  return new Response(JSON.stringify(blocks), { headers: { "Content-Type": "application/json" } });
};

export const POST: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug, moduleId } = params;
  if (!slug || !moduleId) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator || creator.id !== course.creator_id) {
    return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const body = await request.json();
  if (!body.block_type || !body.content) {
    return new Response(JSON.stringify({ error: "block_type and content are required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const block = await createContentBlock(moduleId, body.block_type, typeof body.content === 'string' ? body.content : JSON.stringify(body.content));
  return new Response(JSON.stringify(block), { status: 201, headers: { "Content-Type": "application/json" } });
};
```

- [ ] **Step 2: Create PATCH/DELETE block**

Create `website-astro/src/pages/api/courses/[slug]/phases/[phaseId]/modules/[moduleId]/blocks/[blockId].ts`:

```typescript
import type { APIRoute } from "astro";
import { getSession } from "../../../../../../../../lib/auth";
import { getCourseBySlug, getCreatorByUserId, updateContentBlock, deleteContentBlock } from "../../../../../../../../lib/db/lms-queries";

export const PATCH: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug, blockId } = params;
  if (!slug || !blockId) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator || creator.id !== course.creator_id) {
    return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const body = await request.json();
  if (body.content && typeof body.content !== 'string') body.content = JSON.stringify(body.content);
  await updateContentBlock(blockId, body);
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug, blockId } = params;
  if (!slug || !blockId) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator || creator.id !== course.creator_id) {
    return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  await deleteContentBlock(blockId);
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
};
```

- [ ] **Step 3: Commit**

```bash
git add website-astro/src/pages/api/courses/\[slug\]/phases/\[phaseId\]/modules/\[moduleId\]/blocks/
git commit -m "feat(lms): add content block API routes"
```

### Task 9: Enrollment and Progress API routes

**Files:**
- Create: `website-astro/src/pages/api/courses/[slug]/enroll.ts`
- Create: `website-astro/src/pages/api/courses/[slug]/progress.ts`
- Create: `website-astro/src/pages/api/courses/[slug]/modules/[moduleId]/complete.ts`

- [ ] **Step 1: Create POST /api/courses/[slug]/enroll**

Create `website-astro/src/pages/api/courses/[slug]/enroll.ts`:

```typescript
import type { APIRoute } from "astro";
import { getSession } from "../../../../lib/auth";
import { getCourseBySlug, getEnrollment, enrollUser } from "../../../../lib/db/lms-queries";

export const POST: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug } = params;
  if (!slug) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course || course.status !== 'published') return new Response("Not found", { status: 404 });

  const existing = await getEnrollment(course.id, session.user.id);
  if (existing) {
    return new Response(JSON.stringify({ error: "Already enrolled" }), { status: 409, headers: { "Content-Type": "application/json" } });
  }

  const enrollment = await enrollUser(course.id, session.user.id, course.price_cents);
  return new Response(JSON.stringify(enrollment), { status: 201, headers: { "Content-Type": "application/json" } });
};
```

- [ ] **Step 2: Create GET /api/courses/[slug]/progress**

Create `website-astro/src/pages/api/courses/[slug]/progress.ts`:

```typescript
import type { APIRoute } from "astro";
import { getSession } from "../../../../lib/auth";
import { getCourseBySlug, getEnrollment, getCourseProgress } from "../../../../lib/db/lms-queries";

export const GET: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug } = params;
  if (!slug) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  const enrollment = await getEnrollment(course.id, session.user.id);
  if (!enrollment && course.price_cents > 0) {
    return new Response(JSON.stringify({ error: "Not enrolled" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const progress = await getCourseProgress(course.id, session.user.id);
  return new Response(JSON.stringify(progress), { headers: { "Content-Type": "application/json" } });
};
```

- [ ] **Step 3: Create POST /api/courses/[slug]/modules/[moduleId]/complete**

Create `website-astro/src/pages/api/courses/[slug]/modules/[moduleId]/complete.ts`:

```typescript
import type { APIRoute } from "astro";
import { getSession } from "../../../../../../lib/auth";
import { getCourseBySlug, getEnrollment, getModule, completeModule } from "../../../../../../lib/db/lms-queries";

export const POST: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug, moduleId } = params;
  if (!slug || !moduleId) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  // Check access: enrolled or free course
  if (course.price_cents > 0) {
    const enrollment = await getEnrollment(course.id, session.user.id);
    if (!enrollment) {
      return new Response(JSON.stringify({ error: "Not enrolled" }), { status: 403, headers: { "Content-Type": "application/json" } });
    }
  }

  const mod = await getModule(moduleId);
  if (!mod) return new Response("Not found", { status: 404 });

  const body = await request.json().catch(() => ({}));
  const quizAnswers = body.quiz_answers ? JSON.stringify(body.quiz_answers) : undefined;

  const completion = await completeModule(moduleId, session.user.id, quizAnswers);
  return new Response(JSON.stringify(completion), { status: 201, headers: { "Content-Type": "application/json" } });
};
```

- [ ] **Step 4: Commit**

```bash
git add website-astro/src/pages/api/courses/\[slug\]/enroll.ts website-astro/src/pages/api/courses/\[slug\]/progress.ts website-astro/src/pages/api/courses/\[slug\]/modules/
git commit -m "feat(lms): add enrollment and progress API routes"
```

---

## Chunk 3: Frontend — Astro Pages

### Task 10: Course catalog page

**Files:**
- Create: `website-astro/src/pages/courses/index.astro`

- [ ] **Step 1: Create courses catalog page**

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import CourseCatalog from "../../components/ui/organisms/CourseCatalog";
---

<BaseLayout title="Courses">
  <CourseCatalog client:load />
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/pages/courses/
git commit -m "feat(lms): add courses catalog page"
```

### Task 11: Course detail page

**Files:**
- Create: `website-astro/src/pages/courses/[slug]/index.astro`

- [ ] **Step 1: Create course landing page**

```astro
---
import BaseLayout from "../../../layouts/BaseLayout.astro";
import CourseLandingPage from "../../../components/ui/organisms/CourseLandingPage";

const { slug } = Astro.params;
---

<BaseLayout title="Course">
  <CourseLandingPage client:load slug={slug!} />
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/pages/courses/\[slug\]/
git commit -m "feat(lms): add course detail page"
```

### Task 12: Course learn page

**Files:**
- Create: `website-astro/src/pages/courses/[slug]/learn.astro`

- [ ] **Step 1: Create learner view page**

```astro
---
import BaseLayout from "../../../layouts/BaseLayout.astro";
import CourseLearnerView from "../../../components/ui/organisms/CourseLearnerView";
import { getSession } from "../../../lib/auth";

const session = await getSession(Astro.request);
if (!session) return Astro.redirect("/login");

const { slug } = Astro.params;
---

<BaseLayout title="Learn">
  <CourseLearnerView client:load slug={slug!} />
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/pages/courses/\[slug\]/learn.astro
git commit -m "feat(lms): add course learner view page"
```

### Task 13: Creator pages

**Files:**
- Create: `website-astro/src/pages/become-creator.astro`
- Create: `website-astro/src/pages/creator/dashboard.astro`
- Create: `website-astro/src/pages/creator/courses/new.astro`
- Create: `website-astro/src/pages/creator/courses/[slug]/edit.astro`

- [ ] **Step 1: Create become-creator page**

Create `website-astro/src/pages/become-creator.astro`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import CreatorProfileForm from "../components/ui/organisms/CreatorProfileForm";
import { getSession } from "../lib/auth";

const session = await getSession(Astro.request);
if (!session) return Astro.redirect("/login");
---

<BaseLayout title="Become a Creator">
  <CreatorProfileForm client:load mode="create" />
</BaseLayout>
```

- [ ] **Step 2: Create creator dashboard page**

Create `website-astro/src/pages/creator/dashboard.astro`:

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import CreatorDashboard from "../../components/ui/organisms/CreatorDashboard";
import { getSession } from "../../lib/auth";

const session = await getSession(Astro.request);
if (!session) return Astro.redirect("/login");
---

<BaseLayout title="Creator Dashboard">
  <CreatorDashboard client:load />
</BaseLayout>
```

- [ ] **Step 3: Create new course page**

Create `website-astro/src/pages/creator/courses/new.astro`:

```astro
---
import BaseLayout from "../../../layouts/BaseLayout.astro";
import CourseEditor from "../../../components/ui/organisms/CourseEditor";
import { getSession } from "../../../lib/auth";

const session = await getSession(Astro.request);
if (!session) return Astro.redirect("/login");
---

<BaseLayout title="New Course">
  <CourseEditor client:load />
</BaseLayout>
```

- [ ] **Step 4: Create edit course page**

Create `website-astro/src/pages/creator/courses/[slug]/edit.astro`:

```astro
---
import BaseLayout from "../../../../layouts/BaseLayout.astro";
import CourseEditor from "../../../../components/ui/organisms/CourseEditor";
import { getSession } from "../../../../lib/auth";

const session = await getSession(Astro.request);
if (!session) return Astro.redirect("/login");

const { slug } = Astro.params;
---

<BaseLayout title="Edit Course">
  <CourseEditor client:load slug={slug!} />
</BaseLayout>
```

- [ ] **Step 5: Commit**

```bash
git add website-astro/src/pages/become-creator.astro website-astro/src/pages/creator/
git commit -m "feat(lms): add creator pages (become-creator, dashboard, new course, edit course)"
```

---

## Chunk 4: Frontend — React Components (Atoms & Molecules)

### Task 14: Atom components

**Files:**
- Create: `website-astro/src/components/ui/atoms/CoursePriceBadge.tsx`
- Create: `website-astro/src/components/ui/atoms/ProgressRing.tsx`
- Create: `website-astro/src/components/ui/atoms/ContentBlockIcon.tsx`
- Create: `website-astro/src/components/ui/atoms/CompletionCheck.tsx`

- [ ] **Step 1: Create CoursePriceBadge**

```tsx
export default function CoursePriceBadge({ priceCents, currency = 'USD' }: { priceCents: number; currency?: string }) {
  if (priceCents === 0) {
    return <span className="inline-block rounded-full bg-green-900/30 px-3 py-1 text-xs font-bold text-green-400 border border-green-700">FREE</span>;
  }
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(priceCents / 100);
  return <span className="inline-block rounded-full bg-amber-900/30 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-700">{formatted}</span>;
}
```

- [ ] **Step 2: Create ProgressRing**

```tsx
export default function ProgressRing({ percent, size = 48, strokeWidth = 4 }: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-700" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-green-400 transition-all duration-500" />
      <text x="50%" y="50%" textAnchor="middle" dy=".3em" className="rotate-[90deg] origin-center fill-current text-xs text-gray-300">{Math.round(percent)}%</text>
    </svg>
  );
}
```

- [ ] **Step 3: Create ContentBlockIcon**

```tsx
const ICONS: Record<string, string> = { video: '🎬', text: '📄', quiz: '❓' };

export default function ContentBlockIcon({ type }: { type: string }) {
  return <span className="text-lg" title={type}>{ICONS[type] || '📎'}</span>;
}
```

- [ ] **Step 4: Create CompletionCheck**

```tsx
export default function CompletionCheck({ completed }: { completed: boolean }) {
  return (
    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs ${completed ? 'border-green-400 bg-green-400/20 text-green-400' : 'border-gray-600 text-transparent'}`}>
      {completed ? '✓' : '·'}
    </span>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add website-astro/src/components/ui/atoms/CoursePriceBadge.tsx website-astro/src/components/ui/atoms/ProgressRing.tsx website-astro/src/components/ui/atoms/ContentBlockIcon.tsx website-astro/src/components/ui/atoms/CompletionCheck.tsx
git commit -m "feat(lms): add atom components (CoursePriceBadge, ProgressRing, ContentBlockIcon, CompletionCheck)"
```

### Task 15: Molecule components

**Files:**
- Create: `website-astro/src/components/ui/molecules/CourseCard.tsx`
- Create: `website-astro/src/components/ui/molecules/PhaseAccordion.tsx`
- Create: `website-astro/src/components/ui/molecules/QuizBlock.tsx`
- Create: `website-astro/src/components/ui/molecules/VideoPlayer.tsx`
- Create: `website-astro/src/components/ui/molecules/ModuleNavItem.tsx`
- Create: `website-astro/src/components/ui/molecules/ContentBlockEditor.tsx`

- [ ] **Step 1: Create CourseCard**

```tsx
import CoursePriceBadge from '../atoms/CoursePriceBadge';

interface CourseCardProps {
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  creatorName: string;
  priceCents: number;
  currency: string;
  enrollmentCount: number;
}

export default function CourseCard({ title, slug, description, coverImageUrl, creatorName, priceCents, currency, enrollmentCount }: CourseCardProps) {
  return (
    <a href={`/courses/${slug}`} className="block rounded-lg border border-gray-700 bg-gray-800/50 p-4 hover:border-green-600 transition-colors">
      {coverImageUrl && <img src={coverImageUrl} alt={title} className="mb-3 h-40 w-full rounded object-cover" />}
      <h3 className="mb-1 text-lg font-bold text-white">{title}</h3>
      <p className="mb-2 text-sm text-gray-400 line-clamp-2">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">by {creatorName} · {enrollmentCount} enrolled</span>
        <CoursePriceBadge priceCents={priceCents} currency={currency} />
      </div>
    </a>
  );
}
```

- [ ] **Step 2: Create PhaseAccordion**

```tsx
import { useState } from 'react';
import CompletionCheck from '../atoms/CompletionCheck';

interface PhaseAccordionProps {
  title: string;
  description: string | null;
  modules: { id: string; title: string; is_preview: number; completed: boolean }[];
  onModuleClick: (moduleId: string) => void;
  defaultOpen?: boolean;
}

export default function PhaseAccordion({ title, description, modules, onModuleClick, defaultOpen = false }: PhaseAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const completedCount = modules.filter(m => m.completed).length;

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between bg-gray-800 px-4 py-3 text-left hover:bg-gray-750 transition-colors">
        <div>
          <h4 className="font-bold text-white">{title}</h4>
          {description && <p className="text-xs text-gray-400">{description}</p>}
        </div>
        <span className="text-xs text-gray-500">{completedCount}/{modules.length} · {open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ul className="bg-gray-900/50">
          {modules.map(mod => (
            <li key={mod.id}>
              <button onClick={() => onModuleClick(mod.id)} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 transition-colors">
                <CompletionCheck completed={mod.completed} />
                <span>{mod.title}</span>
                {mod.is_preview === 1 && <span className="ml-auto text-xs text-blue-400">Preview</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create QuizBlock**

```tsx
import { useState } from 'react';

interface QuizBlockProps {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  onAnswer: (selectedIndex: number) => void;
  disabled?: boolean;
}

export default function QuizBlock({ question, options, correctIndex, explanation, onAnswer, disabled }: QuizBlockProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    onAnswer(selected);
  };

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <p className="mb-3 font-bold text-white">{question}</p>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => !submitted && !disabled && setSelected(i)}
            disabled={submitted || disabled}
            className={`w-full rounded border px-3 py-2 text-left text-sm transition-colors ${
              submitted && i === correctIndex ? 'border-green-500 bg-green-900/30 text-green-300' :
              submitted && i === selected && i !== correctIndex ? 'border-red-500 bg-red-900/30 text-red-300' :
              selected === i ? 'border-blue-500 bg-blue-900/20 text-white' :
              'border-gray-600 text-gray-300 hover:border-gray-500'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {!submitted && !disabled && (
        <button onClick={handleSubmit} disabled={selected === null} className="mt-3 rounded bg-green-600 px-4 py-1 text-sm text-white hover:bg-green-500 disabled:opacity-40">
          Submit
        </button>
      )}
      {submitted && <p className="mt-3 text-sm text-gray-400">{explanation}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Create VideoPlayer**

```tsx
export default function VideoPlayer({ url, caption }: { url: string; caption?: string }) {
  // Support YouTube and Vimeo embeds
  let embedUrl = url;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return (
    <div className="space-y-2">
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-gray-700">
        <iframe src={embedUrl} className="h-full w-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
      </div>
      {caption && <p className="text-sm text-gray-400">{caption}</p>}
    </div>
  );
}
```

- [ ] **Step 5: Create ModuleNavItem**

```tsx
import CompletionCheck from '../atoms/CompletionCheck';

interface ModuleNavItemProps {
  title: string;
  completed: boolean;
  active: boolean;
  onClick: () => void;
}

export default function ModuleNavItem({ title, completed, active, onClick }: ModuleNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors rounded ${active ? 'bg-green-900/30 text-green-300 border border-green-700' : 'text-gray-300 hover:bg-gray-800'}`}
    >
      <CompletionCheck completed={completed} />
      <span className="truncate">{title}</span>
    </button>
  );
}
```

- [ ] **Step 6: Create ContentBlockEditor**

```tsx
import { useState } from 'react';
import ContentBlockIcon from '../atoms/ContentBlockIcon';

interface ContentBlockEditorProps {
  blockType: 'video' | 'text' | 'quiz';
  content: string;
  onChange: (content: string) => void;
  onDelete: () => void;
}

export default function ContentBlockEditor({ blockType, content, onChange, onDelete }: ContentBlockEditorProps) {
  const [parsed, setParsed] = useState(() => { try { return JSON.parse(content); } catch { return {}; } });

  const updateField = (field: string, value: unknown) => {
    const updated = { ...parsed, [field]: value };
    setParsed(updated);
    onChange(JSON.stringify(updated));
  };

  return (
    <div className="rounded border border-gray-700 bg-gray-800/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ContentBlockIcon type={blockType} />
          <span className="text-xs font-bold uppercase text-gray-400">{blockType}</span>
        </div>
        <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-300">Remove</button>
      </div>

      {blockType === 'text' && (
        <textarea
          value={parsed.markdown || ''}
          onChange={e => updateField('markdown', e.target.value)}
          className="w-full rounded border border-gray-600 bg-gray-900 p-2 text-sm text-white"
          rows={6}
          placeholder="Markdown content..."
        />
      )}

      {blockType === 'video' && (
        <div className="space-y-2">
          <input type="text" value={parsed.url || ''} onChange={e => updateField('url', e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 p-2 text-sm text-white" placeholder="Video URL (YouTube/Vimeo)" />
          <input type="text" value={parsed.caption || ''} onChange={e => updateField('caption', e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 p-2 text-sm text-white" placeholder="Caption (optional)" />
        </div>
      )}

      {blockType === 'quiz' && (
        <div className="space-y-2">
          <input type="text" value={parsed.question || ''} onChange={e => updateField('question', e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 p-2 text-sm text-white" placeholder="Question" />
          {(parsed.options || ['', '', '', '']).map((opt: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={parsed.correct_index === i} onChange={() => updateField('correct_index', i)} className="accent-green-500" />
              <input type="text" value={opt} onChange={e => { const opts = [...(parsed.options || ['', '', '', ''])]; opts[i] = e.target.value; updateField('options', opts); }} className="flex-1 rounded border border-gray-600 bg-gray-900 p-2 text-sm text-white" placeholder={`Option ${i + 1}`} />
            </div>
          ))}
          <input type="text" value={parsed.explanation || ''} onChange={e => updateField('explanation', e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 p-2 text-sm text-white" placeholder="Explanation shown after answering" />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add website-astro/src/components/ui/molecules/CourseCard.tsx website-astro/src/components/ui/molecules/PhaseAccordion.tsx website-astro/src/components/ui/molecules/QuizBlock.tsx website-astro/src/components/ui/molecules/VideoPlayer.tsx website-astro/src/components/ui/molecules/ModuleNavItem.tsx website-astro/src/components/ui/molecules/ContentBlockEditor.tsx
git commit -m "feat(lms): add molecule components (CourseCard, PhaseAccordion, QuizBlock, VideoPlayer, ModuleNavItem, ContentBlockEditor)"
```

---

## Chunk 5: Frontend — React Components (Organisms)

### Task 16: CourseCatalog organism

**Files:**
- Create: `website-astro/src/components/ui/organisms/CourseCatalog.tsx`

- [ ] **Step 1: Create CourseCatalog**

```tsx
import { useState, useEffect } from 'react';
import CourseCard from '../molecules/CourseCard';

interface CatalogCourse {
  id: string; title: string; slug: string; description: string | null;
  cover_image_url: string | null; price_cents: number; currency: string;
  creator_name: string; enrollment_count: number;
}

export default function CourseCatalog() {
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.json())
      .then(data => { setCourses(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-400">Loading courses...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-bold text-white">Courses</h1>
        <p className="mb-8 text-gray-400">Learn plant care from expert growers</p>
        {courses.length === 0 ? (
          <p className="text-gray-500">No courses available yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map(c => (
              <CourseCard key={c.id} title={c.title} slug={c.slug} description={c.description} coverImageUrl={c.cover_image_url} creatorName={c.creator_name} priceCents={c.price_cents} currency={c.currency} enrollmentCount={c.enrollment_count} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/components/ui/organisms/CourseCatalog.tsx
git commit -m "feat(lms): add CourseCatalog organism"
```

### Task 17: CourseLandingPage organism

**Files:**
- Create: `website-astro/src/components/ui/organisms/CourseLandingPage.tsx`

- [ ] **Step 1: Create CourseLandingPage**

```tsx
import { useState, useEffect } from 'react';
import CoursePriceBadge from '../atoms/CoursePriceBadge';
import PhaseAccordion from '../molecules/PhaseAccordion';

interface CourseDetail {
  id: string; title: string; slug: string; description: string | null;
  cover_image_url: string | null; price_cents: number; currency: string;
  status: string; creator_name: string;
  phases: { id: string; title: string; description: string | null; modules: { id: string; title: string; is_preview: number }[] }[];
}

export default function CourseLandingPage({ slug }: { slug: string }) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${slug}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setCourse)
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    fetch(`/api/courses/${slug}/progress`)
      .then(r => { if (r.ok) setEnrolled(true); })
      .catch(() => {});
  }, [slug]);

  const handleEnroll = async () => {
    setEnrolling(true);
    const res = await fetch(`/api/courses/${slug}/enroll`, { method: 'POST' });
    if (res.ok || res.status === 409) {
      setEnrolled(true);
      window.location.href = `/courses/${slug}/learn`;
    }
    setEnrolling(false);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-400">Loading...</div>;
  if (!course) return <div className="flex min-h-screen items-center justify-center text-gray-400">Course not found</div>;

  const totalModules = course.phases.reduce((sum, p) => sum + p.modules.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 p-8">
      <div className="mx-auto max-w-4xl">
        {course.cover_image_url && <img src={course.cover_image_url} alt={course.title} className="mb-6 h-64 w-full rounded-lg object-cover" />}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{course.title}</h1>
            <p className="mt-1 text-gray-400">by {course.creator_name} · {totalModules} modules</p>
          </div>
          <CoursePriceBadge priceCents={course.price_cents} currency={course.currency} />
        </div>
        {course.description && <div className="prose prose-invert mb-8 max-w-none"><p className="text-gray-300 whitespace-pre-wrap">{course.description}</p></div>}
        <div className="mb-8">
          {enrolled ? (
            <a href={`/courses/${slug}/learn`} className="inline-block rounded bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-500">Continue Learning</a>
          ) : (
            <button onClick={handleEnroll} disabled={enrolling} className="rounded bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-500 disabled:opacity-50">
              {enrolling ? 'Enrolling...' : course.price_cents === 0 ? 'Enroll for Free' : `Enroll · ${new Intl.NumberFormat('en-US', { style: 'currency', currency: course.currency }).format(course.price_cents / 100)}`}
            </button>
          )}
        </div>
        <h2 className="mb-4 text-xl font-bold text-white">Course Content</h2>
        <div className="space-y-3">
          {course.phases.map((phase, i) => (
            <PhaseAccordion key={phase.id} title={phase.title} description={phase.description} defaultOpen={i === 0} modules={phase.modules.map(m => ({ ...m, completed: false }))} onModuleClick={() => {}} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/components/ui/organisms/CourseLandingPage.tsx
git commit -m "feat(lms): add CourseLandingPage organism"
```

### Task 18: CourseLearnerView organism

**Files:**
- Create: `website-astro/src/components/ui/organisms/CourseLearnerView.tsx`

- [ ] **Step 1: Create CourseLearnerView**

```tsx
import { useState, useEffect } from 'react';
import ModuleNavItem from '../molecules/ModuleNavItem';
import VideoPlayer from '../molecules/VideoPlayer';
import QuizBlock from '../molecules/QuizBlock';
import ProgressRing from '../atoms/ProgressRing';

interface Block { id: string; block_type: 'video' | 'text' | 'quiz'; content: string; sort_order: number }
interface Module { id: string; title: string; is_preview: number; blocks: Block[] }
interface Phase { id: string; title: string; modules: Module[] }
interface CourseData { id: string; title: string; slug: string; phases: Phase[] }
interface Progress { total_modules: number; completed_modules: number; phases: { phase_id: string; total: number; completed: number }[] }

export default function CourseLearnerView({ slug }: { slug: string }) {
  const [course, setCourse] = useState<CourseData | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch(`/api/courses/${slug}`).then(r => r.json()),
      fetch(`/api/courses/${slug}/progress`).then(r => r.ok ? r.json() : null),
    ]).then(([courseData, progressData]) => {
      setCourse(courseData);
      setProgress(progressData);
      // Set first module as active
      if (courseData.phases?.[0]?.modules?.[0]) setActiveModuleId(courseData.phases[0].modules[0].id);
      // Build completed set from progress
      if (progressData) {
        // We need per-module completion data; for now derive from counts
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  const allModules = course?.phases.flatMap(p => p.modules) || [];
  const activeModule = allModules.find(m => m.id === activeModuleId);

  const handleComplete = async (moduleId: string, quizAnswers?: unknown) => {
    const res = await fetch(`/api/courses/${slug}/modules/${moduleId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_answers: quizAnswers }),
    });
    if (res.ok) {
      setCompletedModules(prev => new Set(prev).add(moduleId));
      // Advance to next module
      const idx = allModules.findIndex(m => m.id === moduleId);
      if (idx < allModules.length - 1) setActiveModuleId(allModules[idx + 1].id);
    }
  };

  const renderBlock = (block: Block) => {
    const parsed = JSON.parse(block.content);
    switch (block.block_type) {
      case 'video': return <VideoPlayer key={block.id} url={parsed.url} caption={parsed.caption} />;
      case 'text': return <div key={block.id} className="prose prose-invert max-w-none"><p className="whitespace-pre-wrap text-gray-300">{parsed.markdown}</p></div>;
      case 'quiz': return <QuizBlock key={block.id} question={parsed.question} options={parsed.options} correctIndex={parsed.correct_index} explanation={parsed.explanation} onAnswer={(idx) => handleComplete(activeModuleId!, { [block.id]: idx })} />;
      default: return null;
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-400">Loading...</div>;
  if (!course) return <div className="flex min-h-screen items-center justify-center text-gray-400">Course not found</div>;

  const percent = progress ? Math.round((progress.completed_modules / Math.max(progress.total_modules, 1)) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 overflow-y-auto border-r border-gray-800 bg-gray-900 p-4">
        <a href={`/courses/${slug}`} className="mb-2 block text-xs text-gray-500 hover:text-gray-300">&larr; Back to course</a>
        <h2 className="mb-1 text-lg font-bold text-white">{course.title}</h2>
        <div className="mb-4 flex items-center gap-2">
          <ProgressRing percent={percent} size={36} strokeWidth={3} />
          <span className="text-xs text-gray-400">{percent}% complete</span>
        </div>
        {course.phases.map(phase => (
          <div key={phase.id} className="mb-4">
            <h3 className="mb-1 text-xs font-bold uppercase text-gray-500">{phase.title}</h3>
            <div className="space-y-1">
              {phase.modules.map(mod => (
                <ModuleNavItem key={mod.id} title={mod.title} completed={completedModules.has(mod.id)} active={mod.id === activeModuleId} onClick={() => setActiveModuleId(mod.id)} />
              ))}
            </div>
          </div>
        ))}
      </aside>
      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {activeModule ? (
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-6 text-2xl font-bold text-white">{activeModule.title}</h1>
            <div className="space-y-6">
              {activeModule.blocks.sort((a, b) => a.sort_order - b.sort_order).map(renderBlock)}
            </div>
            {!activeModule.blocks.some(b => b.block_type === 'quiz') && (
              <button
                onClick={() => handleComplete(activeModule.id)}
                disabled={completedModules.has(activeModule.id)}
                className="mt-8 rounded bg-green-600 px-6 py-2 font-bold text-white hover:bg-green-500 disabled:opacity-40"
              >
                {completedModules.has(activeModule.id) ? 'Completed' : 'Mark as Complete'}
              </button>
            )}
          </div>
        ) : (
          <p className="text-gray-400">Select a module to begin.</p>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/components/ui/organisms/CourseLearnerView.tsx
git commit -m "feat(lms): add CourseLearnerView organism"
```

### Task 19: CreatorDashboard organism

**Files:**
- Create: `website-astro/src/components/ui/organisms/CreatorDashboard.tsx`

- [ ] **Step 1: Create CreatorDashboard**

```tsx
import { useState, useEffect } from 'react';
import CoursePriceBadge from '../atoms/CoursePriceBadge';

interface CreatorCourse {
  id: string; title: string; slug: string; status: string;
  price_cents: number; currency: string; enrollment_count: number; created_at: string;
}

export default function CreatorDashboard() {
  const [courses, setCourses] = useState<CreatorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(true);

  useEffect(() => {
    fetch('/api/creators/me')
      .then(r => r.json())
      .then(creator => {
        if (!creator) { setIsCreator(false); setLoading(false); return; }
        return fetch('/api/courses?mine=true').then(r => r.json());
      })
      .then(data => { if (data) setCourses(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-400">Loading...</div>;
  if (!isCreator) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-gray-400">
        <p>You're not a creator yet.</p>
        <a href="/become-creator" className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-500">Become a Creator</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Creator Dashboard</h1>
          <a href="/creator/courses/new" className="rounded bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-500">+ New Course</a>
        </div>
        {courses.length === 0 ? (
          <p className="text-gray-500">You haven't created any courses yet.</p>
        ) : (
          <div className="space-y-3">
            {courses.map(c => (
              <a key={c.id} href={`/creator/courses/${c.slug}/edit`} className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/50 p-4 hover:border-green-600 transition-colors">
                <div>
                  <h3 className="font-bold text-white">{c.title}</h3>
                  <span className="text-xs text-gray-500">{c.enrollment_count} enrolled · {c.status}</span>
                </div>
                <CoursePriceBadge priceCents={c.price_cents} currency={c.currency} />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/components/ui/organisms/CreatorDashboard.tsx
git commit -m "feat(lms): add CreatorDashboard organism"
```

### Task 20: CreatorProfileForm organism

**Files:**
- Create: `website-astro/src/components/ui/organisms/CreatorProfileForm.tsx`

- [ ] **Step 1: Create CreatorProfileForm**

```tsx
import { useState } from 'react';

export default function CreatorProfileForm({ mode = 'create' }: { mode?: 'create' | 'edit' }) {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('Display name is required'); return; }
    setSaving(true);
    setError(null);

    const res = mode === 'create'
      ? await fetch('/api/creators', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ display_name: displayName, bio }) })
      : await fetch('/api/creators/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ display_name: displayName, bio }) });

    if (res.ok) {
      window.location.href = '/creator/dashboard';
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Something went wrong');
    }
    setSaving(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-950 to-gray-900 p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800/50 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">{mode === 'create' ? 'Become a Creator' : 'Edit Profile'}</h2>
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-gray-400">Display Name</span>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 p-2 text-white" required />
        </label>
        <label className="mb-6 block">
          <span className="mb-1 block text-sm text-gray-400">Bio</span>
          <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 p-2 text-white" rows={4} />
        </label>
        <button type="submit" disabled={saving} className="w-full rounded bg-green-600 py-2 font-bold text-white hover:bg-green-500 disabled:opacity-50">
          {saving ? 'Saving...' : mode === 'create' ? 'Create Profile' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/components/ui/organisms/CreatorProfileForm.tsx
git commit -m "feat(lms): add CreatorProfileForm organism"
```

### Task 21: CourseEditor organism

**Files:**
- Create: `website-astro/src/components/ui/organisms/CourseEditor.tsx`

- [ ] **Step 1: Create CourseEditor**

```tsx
import { useState, useEffect } from 'react';
import ContentBlockEditor from '../molecules/ContentBlockEditor';

interface Block { id: string; block_type: 'video' | 'text' | 'quiz'; content: string; sort_order: number }
interface Module { id: string; title: string; is_preview: number; blocks: Block[] }
interface Phase { id: string; title: string; description: string | null; sort_order: number; modules: Module[] }
interface CourseData { id: string; title: string; slug: string; description: string | null; price_cents: number; currency: string; status: string; cover_image_url: string | null; phases: Phase[] }

export default function CourseEditor({ slug }: { slug?: string }) {
  const isNew = !slug;
  const [course, setCourse] = useState<CourseData | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceCents, setPriceCents] = useState(0);
  const [status, setStatus] = useState('draft');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/courses/${slug}`)
      .then(r => r.json())
      .then(data => {
        setCourse(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setPriceCents(data.price_cents);
        setStatus(data.status);
        setPhases(data.phases || []);
        if (data.phases?.[0]) setActivePhaseId(data.phases[0].id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const saveCourse = async () => {
    setSaving(true);
    if (isNew) {
      const res = await fetch('/api/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description, price_cents: priceCents }) });
      if (res.ok) { const data = await res.json(); window.location.href = `/creator/courses/${data.slug}/edit`; }
    } else {
      await fetch(`/api/courses/${slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description, price_cents: priceCents, status }) });
    }
    setSaving(false);
  };

  const addPhase = async () => {
    if (!slug) return;
    const res = await fetch(`/api/courses/${slug}/phases`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New Phase' }) });
    if (res.ok) { const phase = await res.json(); setPhases(prev => [...prev, { ...phase, modules: [] }]); setActivePhaseId(phase.id); }
  };

  const addModule = async (phaseId: string) => {
    if (!slug) return;
    const res = await fetch(`/api/courses/${slug}/phases/${phaseId}/modules`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New Module' }) });
    if (res.ok) {
      const mod = await res.json();
      setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, modules: [...p.modules, { ...mod, blocks: [] }] } : p));
      setActiveModuleId(mod.id);
    }
  };

  const addBlock = async (moduleId: string, blockType: 'video' | 'text' | 'quiz') => {
    if (!slug) return;
    const phase = phases.find(p => p.modules.some(m => m.id === moduleId));
    if (!phase) return;
    const defaultContent = blockType === 'text' ? '{"markdown":""}' : blockType === 'video' ? '{"url":"","caption":""}' : '{"question":"","options":["","","",""],"correct_index":0,"explanation":""}';
    const res = await fetch(`/api/courses/${slug}/phases/${phase.id}/modules/${moduleId}/blocks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ block_type: blockType, content: defaultContent }) });
    if (res.ok) {
      const block = await res.json();
      setPhases(prev => prev.map(p => ({ ...p, modules: p.modules.map(m => m.id === moduleId ? { ...m, blocks: [...m.blocks, block] } : m) })));
    }
  };

  const updateBlock = async (blockId: string, content: string) => {
    if (!slug) return;
    const phase = phases.find(p => p.modules.some(m => m.blocks.some(b => b.id === blockId)));
    const mod = phase?.modules.find(m => m.blocks.some(b => b.id === blockId));
    if (!phase || !mod) return;
    await fetch(`/api/courses/${slug}/phases/${phase.id}/modules/${mod.id}/blocks/${blockId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
    setPhases(prev => prev.map(p => ({ ...p, modules: p.modules.map(m => ({ ...m, blocks: m.blocks.map(b => b.id === blockId ? { ...b, content } : b) })) })));
  };

  const deleteBlock = async (blockId: string) => {
    if (!slug) return;
    const phase = phases.find(p => p.modules.some(m => m.blocks.some(b => b.id === blockId)));
    const mod = phase?.modules.find(m => m.blocks.some(b => b.id === blockId));
    if (!phase || !mod) return;
    await fetch(`/api/courses/${slug}/phases/${phase.id}/modules/${mod.id}/blocks/${blockId}`, { method: 'DELETE' });
    setPhases(prev => prev.map(p => ({ ...p, modules: p.modules.map(m => ({ ...m, blocks: m.blocks.filter(b => b.id !== blockId) })) })));
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-400">Loading...</div>;

  const activePhase = phases.find(p => p.id === activePhaseId);
  const activeModule = phases.flatMap(p => p.modules).find(m => m.id === activeModuleId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <a href="/creator/dashboard" className="text-sm text-gray-500 hover:text-gray-300">&larr; Dashboard</a>
          <div className="flex gap-2">
            {!isNew && (
              <select value={status} onChange={e => setStatus(e.target.value)} className="rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            )}
            <button onClick={saveCourse} disabled={saving} className="rounded bg-green-600 px-4 py-1 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50">
              {saving ? 'Saving...' : isNew ? 'Create Course' : 'Save'}
            </button>
          </div>
        </div>

        {/* Course metadata */}
        <div className="mb-6 rounded-lg border border-gray-700 bg-gray-800/50 p-4 space-y-3">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 p-2 text-lg font-bold text-white" placeholder="Course Title" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded border border-gray-600 bg-gray-900 p-2 text-sm text-white" rows={3} placeholder="Course description..." />
          <div className="flex gap-4">
            <label className="block">
              <span className="text-xs text-gray-400">Price (cents)</span>
              <input type="number" value={priceCents} onChange={e => setPriceCents(Number(e.target.value))} className="block w-32 rounded border border-gray-600 bg-gray-900 p-2 text-sm text-white" min={0} />
            </label>
          </div>
        </div>

        {!isNew && (
          <div className="flex gap-6">
            {/* Phases sidebar */}
            <div className="w-56 shrink-0 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-400">Phases</h3>
                <button onClick={addPhase} className="text-xs text-green-400 hover:text-green-300">+ Add</button>
              </div>
              {phases.map(phase => (
                <div key={phase.id}>
                  <button onClick={() => { setActivePhaseId(phase.id); setActiveModuleId(null); }} className={`w-full rounded px-2 py-1 text-left text-sm ${activePhaseId === phase.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
                    {phase.title}
                  </button>
                  {activePhaseId === phase.id && (
                    <div className="ml-3 mt-1 space-y-1">
                      {phase.modules.map(mod => (
                        <button key={mod.id} onClick={() => setActiveModuleId(mod.id)} className={`w-full rounded px-2 py-1 text-left text-xs ${activeModuleId === mod.id ? 'bg-green-900/30 text-green-300' : 'text-gray-500 hover:text-gray-300'}`}>
                          {mod.title}
                        </button>
                      ))}
                      <button onClick={() => addModule(phase.id)} className="w-full px-2 py-1 text-left text-xs text-green-400 hover:text-green-300">+ Module</button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Content area */}
            <div className="flex-1">
              {activeModule ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">{activeModule.title}</h3>
                  {activeModule.blocks.sort((a, b) => a.sort_order - b.sort_order).map(block => (
                    <ContentBlockEditor key={block.id} blockType={block.block_type} content={block.content} onChange={(c) => updateBlock(block.id, c)} onDelete={() => deleteBlock(block.id)} />
                  ))}
                  <div className="flex gap-2">
                    <button onClick={() => addBlock(activeModule.id, 'text')} className="rounded border border-gray-600 px-3 py-1 text-xs text-gray-400 hover:border-gray-500">+ Text</button>
                    <button onClick={() => addBlock(activeModule.id, 'video')} className="rounded border border-gray-600 px-3 py-1 text-xs text-gray-400 hover:border-gray-500">+ Video</button>
                    <button onClick={() => addBlock(activeModule.id, 'quiz')} className="rounded border border-gray-600 px-3 py-1 text-xs text-gray-400 hover:border-gray-500">+ Quiz</button>
                  </div>
                </div>
              ) : activePhase ? (
                <p className="text-gray-500">Select a module or create one to edit content.</p>
              ) : (
                <p className="text-gray-500">Add a phase to start building your course.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/components/ui/organisms/CourseEditor.tsx
git commit -m "feat(lms): add CourseEditor organism"
```

---

## Chunk 6: Migration Trigger & Final Integration

### Task 22: Add LMS migration to admin migrate endpoint

**Files:**
- Modify: `website-astro/src/pages/api/admin/migrate.ts`

- [ ] **Step 1: Import and call runLmsMigrations**

Add import and call to the existing migrate endpoint:

```typescript
import { runLmsMigrations } from "../../../lib/db/schema";
```

Add to the handler after existing migration calls:

```typescript
const lmsTables = await runLmsMigrations();
```

Include `lmsTables` in the response.

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/pages/api/admin/migrate.ts
git commit -m "feat(lms): wire LMS migration to admin migrate endpoint"
```

### Task 23: Final verification

- [ ] **Step 1: Run TypeScript check**

```bash
cd website-astro && npx tsc --noEmit
```

- [ ] **Step 2: Fix any TypeScript errors**

- [ ] **Step 3: Final commit if needed**
