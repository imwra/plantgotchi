# LMS Creator & Courses — Design Spec

## Purpose

Allow Plantgotchi users to become "creators" who build and sell structured learning courses about plant care. Buyers enroll, progress through phases and modules, watch videos, read text, answer quiz questions, and track their learning. This turns Plantgotchi from a plant-monitoring tool into a plant-education marketplace.

## Architecture Overview

The LMS extends the existing Astro + React islands frontend with new pages and components. The backend uses the same Turso/SQLite database with raw `getDb().execute()` queries (matching the existing query pattern in `queries.ts`, `chat-queries.ts`, etc.) and BetterAuth session pattern. No new infrastructure is required.

### ID Generation

All new tables use `crypto.randomUUID()` in JavaScript for primary key generation, matching the existing pattern in `api/plants/index.ts` and other user-facing routes. IDs are stored as `TEXT PRIMARY KEY`.

### Migration Strategy

New tables are added to `website-astro/src/lib/db/schema.sql` with corresponding migration logic in `schema.ts` using the existing `runMigrations()` batch pattern. Migration name: `add_lms_tables`.

### Slug Generation

Course slugs are auto-generated from the title using `title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')`. On collision, append `-2`, `-3`, etc. Creators can manually override the slug via the edit form.

### Data Model

```
creator_profiles
  ├── courses
  │     ├── course_phases (ordered sections)
  │     │     ├── phase_modules (ordered lessons)
  │     │     │     ├── module_content_blocks (video / text / quiz, ordered)
  │     │     │     └── module_completions (per-user progress)
  │     │     └── (phase completion derived from module completions)
  │     ├── course_enrollments (purchase + access record)
  │     └── (course completion derived from phase completions)
  └── (creator stats derived from enrollments + completions)
```

### Database Tables

**creator_profiles** — opt-in creator identity for existing users.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | `crypto.randomUUID()` |
| user_id | TEXT | References `user.id` (logical, no FK constraint — matches plants pattern) UNIQUE |
| display_name | TEXT NOT NULL | Public creator name |
| bio | TEXT | Short bio |
| avatar_url | TEXT | Profile image URL |
| created_at | TEXT NOT NULL | ISO timestamp |
| updated_at | TEXT NOT NULL | ISO timestamp |

**courses** — a sellable learning product.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | `crypto.randomUUID()` |
| creator_id | TEXT NOT NULL | References `creator_profiles.id` ON DELETE CASCADE |
| title | TEXT NOT NULL | Course title |
| slug | TEXT NOT NULL UNIQUE | URL-safe identifier, auto-generated from title |
| description | TEXT | Markdown description |
| cover_image_url | TEXT | Course thumbnail |
| price_cents | INTEGER NOT NULL DEFAULT 0 | Price in cents (0 = free) |
| currency | TEXT NOT NULL DEFAULT 'USD' | ISO 4217 |
| status | TEXT NOT NULL DEFAULT 'draft' | 'draft' / 'published' / 'archived' |
| created_at | TEXT NOT NULL | ISO timestamp |
| updated_at | TEXT NOT NULL | ISO timestamp |

**course_phases** — top-level sections within a course.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | `crypto.randomUUID()` |
| course_id | TEXT NOT NULL | References `courses.id` ON DELETE CASCADE |
| title | TEXT NOT NULL | Phase title |
| description | TEXT | Optional description |
| sort_order | INTEGER NOT NULL | Display order |
| created_at | TEXT NOT NULL | ISO timestamp |
| updated_at | TEXT NOT NULL | ISO timestamp |

**phase_modules** — individual lessons within a phase.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | `crypto.randomUUID()` |
| phase_id | TEXT NOT NULL | References `course_phases.id` ON DELETE CASCADE |
| title | TEXT NOT NULL | Module title |
| description | TEXT | Optional description |
| sort_order | INTEGER NOT NULL | Display order |
| is_preview | INTEGER NOT NULL DEFAULT 0 | 1 = free preview even for paid courses |
| created_at | TEXT NOT NULL | ISO timestamp |
| updated_at | TEXT NOT NULL | ISO timestamp |

**module_content_blocks** — ordered content within a module (video, text, quiz).

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | `crypto.randomUUID()` |
| module_id | TEXT NOT NULL | References `phase_modules.id` ON DELETE CASCADE |
| block_type | TEXT NOT NULL | 'video' / 'text' / 'quiz' |
| sort_order | INTEGER NOT NULL | Display order |
| content | TEXT NOT NULL | JSON blob — structure depends on block_type |
| created_at | TEXT NOT NULL | ISO timestamp |
| updated_at | TEXT NOT NULL | ISO timestamp |

**Content JSON shapes by block_type:**
- `video`: `{ "url": "https://...", "duration_seconds": 120, "caption": "..." }`
- `text`: `{ "markdown": "# Heading\n\nBody text..." }`
- `quiz`: `{ "question": "...", "options": ["A","B","C","D"], "correct_index": 2, "explanation": "..." }`

**course_enrollments** — purchase/access record.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | `crypto.randomUUID()` |
| course_id | TEXT NOT NULL | References `courses.id` ON DELETE CASCADE |
| user_id | TEXT NOT NULL | References `user.id` (logical, no FK constraint) |
| price_paid_cents | INTEGER NOT NULL DEFAULT 0 | What they actually paid |
| enrolled_at | TEXT NOT NULL | ISO timestamp |
| UNIQUE(course_id, user_id) | | One enrollment per user per course |

**module_completions** — per-user per-module progress.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | `crypto.randomUUID()` |
| module_id | TEXT NOT NULL | References `phase_modules.id` ON DELETE CASCADE |
| user_id | TEXT NOT NULL | References `user.id` (logical, no FK constraint) |
| completed_at | TEXT NOT NULL | ISO timestamp |
| quiz_answers | TEXT | JSON — recorded answers for quiz blocks, null if not a quiz module |
| UNIQUE(module_id, user_id) | | One completion per user per module |

### Indexes

```sql
CREATE INDEX idx_courses_creator_id ON courses(creator_id);
CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_course_phases_course_id_sort ON course_phases(course_id, sort_order);
CREATE INDEX idx_phase_modules_phase_id_sort ON phase_modules(phase_id, sort_order);
CREATE INDEX idx_content_blocks_module_id_sort ON module_content_blocks(module_id, sort_order);
CREATE INDEX idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_module_completions_user_id ON module_completions(user_id);
CREATE INDEX idx_module_completions_module_id ON module_completions(module_id);
CREATE INDEX idx_creator_profiles_user_id ON creator_profiles(user_id);
```

### API Routes

All routes follow existing patterns (`/api/...`, session auth via `getSession(request)`, raw SQL via `getDb().execute()`).

**Creator:**
- `POST /api/creators` — become a creator (creates creator_profile)
- `GET /api/creators/[id]` — public creator profile
- `PATCH /api/creators/me` — update own profile

**Courses (creator):**
- `GET /api/courses` — list courses (public: published only; creator: own courses)
- `POST /api/courses` — create course (creator only)
- `GET /api/courses/[slug]` — course detail
- `PATCH /api/courses/[slug]` — update course (owner only)
- `DELETE /api/courses/[slug]` — soft-delete / archive (owner only)

**Phases (nested under courses for consistency with projects/issues pattern):**
- `GET /api/courses/[slug]/phases` — list phases with modules
- `POST /api/courses/[slug]/phases` — create phase (owner only)
- `PATCH /api/courses/[slug]/phases/[phaseId]` — update/reorder
- `DELETE /api/courses/[slug]/phases/[phaseId]` — delete

**Modules (nested under courses for consistency):**
- `GET /api/courses/[slug]/phases/[phaseId]/modules` — list modules with content blocks
- `POST /api/courses/[slug]/phases/[phaseId]/modules` — create module (owner only)
- `PATCH /api/courses/[slug]/phases/[phaseId]/modules/[moduleId]` — update module
- `DELETE /api/courses/[slug]/phases/[phaseId]/modules/[moduleId]` — delete module

**Content Blocks (nested under courses for consistency):**
- `GET /api/courses/[slug]/phases/[phaseId]/modules/[moduleId]/blocks` — list content blocks
- `POST /api/courses/[slug]/phases/[phaseId]/modules/[moduleId]/blocks` — create block
- `PATCH /api/courses/[slug]/phases/[phaseId]/modules/[moduleId]/blocks/[blockId]` — update block
- `DELETE /api/courses/[slug]/phases/[phaseId]/modules/[moduleId]/blocks/[blockId]` — delete block

**Enrollment & Progress (learner):**
- `POST /api/courses/[slug]/enroll` — enroll (free) or record purchase
- `GET /api/courses/[slug]/progress` — user's progress in course
- `POST /api/courses/[slug]/modules/[moduleId]/complete` — mark module complete, submit quiz answers

### Frontend Pages & Components

**New Pages:**
- `/courses` — course marketplace/catalog (browse published courses)
- `/courses/[slug]` — course landing page (description, phases, enroll CTA)
- `/courses/[slug]/learn` — learner view (phase sidebar, module content, progress)
- `/creator/dashboard` — creator's course management
- `/creator/courses/new` — create new course
- `/creator/courses/[slug]/edit` — course editor (phases, modules, content blocks)
- `/become-creator` — opt-in page to create a creator profile

**New Components (following existing atomic design):**

Atoms:
- `CoursePriceBadge` — displays price or "Free"
- `ProgressRing` — circular progress indicator
- `ContentBlockIcon` — icon for video/text/quiz type
- `CompletionCheck` — checkmark for completed modules

Molecules:
- `CourseCard` — course thumbnail, title, creator, price for catalog
- `PhaseAccordion` — expandable phase showing modules
- `ContentBlockEditor` — edit a single content block (video URL / markdown / quiz builder)
- `QuizBlock` — interactive quiz with answer selection and feedback
- `VideoPlayer` — embedded video player wrapper
- `ModuleNavItem` — sidebar nav item with completion state

Organisms:
- `CourseCatalog` — grid of CourseCards with filtering
- `CourseEditor` — full course editing interface (phases + modules + blocks)
- `CourseLearnerView` — learning interface with sidebar nav + content area
- `CreatorDashboard` — list of creator's courses with stats
- `CreatorProfileForm` — edit creator profile

### Access Control

- **Creator actions** (create/edit courses): requires `creator_profiles` record for session user
- **Learner actions** (view content, complete modules): requires `course_enrollments` record OR `is_preview = 1` OR `price_cents = 0`
- **Public actions** (browse catalog, view course landing page): no auth required
- Existing `getSession()` pattern handles auth; creator/enrollment checks are query-level guards

### Commerce (v1 — Simple)

For v1, commerce is record-keeping only. No payment gateway integration. The enrollment endpoint records `price_paid_cents` and grants access. This lets the full LMS flow work end-to-end. Payment gateway (Stripe) is a future enhancement — the schema is ready for it with `price_cents` and `price_paid_cents` fields.

### Progress Tracking

- Completion is per-module (smallest trackable unit)
- Phase completion = all modules in phase completed
- Course completion = all phases completed
- Quiz answers are stored in `module_completions.quiz_answers` as JSON
- Progress API returns: total modules, completed modules, per-phase breakdown

### Error Handling

- 401 for unauthenticated requests to protected routes
- 403 for non-creators trying creator actions, or non-enrolled users accessing paid content
- 404 for missing courses/phases/modules
- 400 for validation errors (missing required fields, invalid block_type)
- All mutations validate ownership before proceeding

### Testing Strategy

- Unit tests for query functions (Vitest, following existing patterns)
- API route tests with mocked sessions
- Component tests in Storybook for new UI components
- Integration test: full flow from course creation to enrollment to completion

## What This Does NOT Include (YAGNI)

- Payment gateway integration (Stripe) — future enhancement
- Video upload/hosting — v1 uses external URLs (YouTube, Vimeo)
- Certificates/badges on completion
- Course ratings/reviews
- Instructor analytics dashboard beyond basic enrollment counts
- Discussion forums per course
- Drip content / time-gated releases
- Bulk import/export of course content
- Mobile app views (iOS/Android) — web only for v1
- Advanced quiz types (multi-answer, fill-in-the-blank, etc.) — v1 supports single-correct multiple choice only
