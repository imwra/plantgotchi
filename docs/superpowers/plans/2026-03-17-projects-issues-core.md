# Projects & Issues (Sub-project 1: Core) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a database-backed project and issue management system with table view, custom fields, comments with reactions, and seed migration from the existing Launch Tracker — admin-only access for now.

**Architecture:** Astro SSR pages delegate to React `client:load` organisms for interactive project table and issue detail views. API endpoints under `/api/projects/`, `/api/issues/`, and `/api/comments/` use raw SQL via `@libsql/client` following the existing query pattern in `src/lib/db/queries.ts`. Auth gating reuses the `requireAdmin` guard from `src/lib/admin-guard.ts`.

**Tech Stack:** Astro 6 (SSR on Cloudflare), React 19, Tailwind v4 design tokens, `@libsql/client` raw SQL, better-auth `getSession`, existing i18n JSON files (PT-BR default, EN).

**Spec:** docs/superpowers/specs/2026-03-17-projects-issues-design.md

---

## Chunk 1: Database Schema + Migrations + FK Pragma

**Files to modify:**
- `website-astro/src/lib/db/client.ts` — add FK pragma
- `website-astro/src/lib/db/schema.ts` — **create** (migration SQL)

**Steps:**

- [ ] 1.1 Modify `src/lib/db/client.ts` to execute `PRAGMA foreign_keys = ON` after creating the client. Wrap the pragma call so it runs once per connection:
  ```ts
  db = createClient({ url, authToken });
  db.execute("PRAGMA foreign_keys = ON");
  ```

- [ ] 1.2 Create `src/lib/db/schema.ts` exporting a `runMigrations()` function that executes all CREATE TABLE IF NOT EXISTS statements via `db.batch()`. Tables in order (respecting FK dependencies):
  1. `issues`
  2. `projects`
  3. `project_members`
  4. `project_issues`
  5. `project_fields`
  6. `project_issue_fields`
  7. `issue_assignees`
  8. `issue_comments`
  9. `comment_reactions`

  Include all indexes from the spec (§2.1–2.9). Use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` for idempotency.

- [ ] 1.3 Create an API endpoint `src/pages/api/admin/migrate.ts` (`POST`) that calls `runMigrations()`. Gated behind `requireAdmin`. Returns `{ success: true, tables: [...] }`.

- [ ] 1.4 Test: call `POST /api/admin/migrate` and verify all 9 tables exist with correct columns.

**Commit:** `feat(projects): add database schema, migrations, and FK pragma`

---

## Chunk 2: API Endpoints

**Files to create:**
- `website-astro/src/lib/db/project-queries.ts` — query functions for projects, issues, comments, fields, assignees
- `website-astro/src/pages/api/projects/index.ts` — GET (list), POST (create)
- `website-astro/src/pages/api/projects/[id]/index.ts` — GET, PUT, DELETE
- `website-astro/src/pages/api/projects/[id]/members.ts` — GET, POST
- `website-astro/src/pages/api/projects/[id]/members/[userId].ts` — DELETE
- `website-astro/src/pages/api/projects/[id]/fields/index.ts` — GET, POST
- `website-astro/src/pages/api/projects/[id]/fields/[fieldId].ts` — PUT, DELETE
- `website-astro/src/pages/api/projects/[id]/issues/index.ts` — GET, POST
- `website-astro/src/pages/api/projects/[id]/issues/[issueId].ts` — DELETE
- `website-astro/src/pages/api/projects/[id]/issues/[issueId]/fields.ts` — PUT
- `website-astro/src/pages/api/issues/index.ts` — GET, POST
- `website-astro/src/pages/api/issues/[id]/index.ts` — GET, PUT, DELETE
- `website-astro/src/pages/api/issues/[id]/assignees/index.ts` — POST
- `website-astro/src/pages/api/issues/[id]/assignees/[userId].ts` — DELETE
- `website-astro/src/pages/api/issues/[id]/comments.ts` — GET, POST
- `website-astro/src/pages/api/comments/[id]/index.ts` — PUT, DELETE
- `website-astro/src/pages/api/comments/[id]/pin.ts` — POST
- `website-astro/src/pages/api/comments/[id]/reactions/index.ts` — POST
- `website-astro/src/pages/api/comments/[id]/reactions/[emoji].ts` — DELETE

### 2A: Query layer (`project-queries.ts`)

- [ ] 2A.1 Create `src/lib/db/project-queries.ts` with TypeScript interfaces matching the spec tables:
  - `Issue`, `Project`, `ProjectMember`, `ProjectField`, `ProjectIssueField`, `IssueAssignee`, `IssueComment`, `CommentReaction`

- [ ] 2A.2 Implement project CRUD functions following the pattern in `queries.ts` (raw SQL via `getDb().execute()`):
  - `listProjects(limit, offset)` — returns projects with issue count and member count via subquery
  - `getProject(id)` — returns project with fields and members
  - `createProject(name, description, createdBy)` — INSERT + add creator as owner in `project_members`
  - `updateProject(id, name, description)` — UPDATE with `updated_at = datetime('now')`
  - `deleteProject(id)` — DELETE (cascade handles project_issues, fields, members)

- [ ] 2A.3 Implement project member functions:
  - `listProjectMembers(projectId)`
  - `addProjectMember(projectId, userId, role)`
  - `removeProjectMember(projectId, userId)`

- [ ] 2A.4 Implement custom field functions:
  - `listProjectFields(projectId)`
  - `createProjectField(projectId, name, fieldType, options, position)`
  - `updateProjectField(fieldId, name, options, position)`
  - `deleteProjectField(fieldId)`

- [ ] 2A.5 Implement project-issue functions:
  - `listProjectIssues(projectId, { groupBy?, status?, limit?, offset?, search? })` — JOIN issues + project_issue_fields for field values. When `groupBy` is provided, return grouped results keyed by field value.
  - `addIssueToProject(projectId, issueId, position)` / `createIssueInProject(projectId, title, status, parentIssueId, createdBy)`
  - `removeIssueFromProject(projectId, issueId)`
  - `setIssueFieldValues(projectId, issueId, fieldValues: Record<string, string>)`

- [ ] 2A.6 Implement issue CRUD functions:
  - `listIssues({ status?, assignee?, parentId?, search?, limit?, offset? })`
  - `createIssue(title, description, status, parentIssueId, createdBy)`
  - `getIssue(id)` — returns issue with assignees, sub-issues, comments (with reactions), and projects list
  - `updateIssue(id, { title?, description?, status?, parentIssueId? })`
  - `deleteIssue(id)`

- [ ] 2A.7 Implement assignee functions:
  - `addAssignee(issueId, userId)`
  - `removeAssignee(issueId, userId)`

- [ ] 2A.8 Implement comment functions:
  - `listComments(issueId)` — with reactions aggregated
  - `createComment(issueId, userId, body)`
  - `updateComment(id, body)`
  - `deleteComment(id)`
  - `togglePin(id)`
  - `addReaction(commentId, userId, emoji)`
  - `removeReaction(commentId, userId, emoji)`

### 2B: API route handlers

- [ ] 2B.1 Create all project API routes (§3.1–3.4 of spec). Each handler:
  1. Calls `requireAdmin(request)` — return error if unauthorized
  2. Parses params/body
  3. Calls the corresponding query function
  4. Returns JSON response with appropriate status codes (200, 201, 204, 400, 404)

  Follow the exact pattern from `src/pages/api/admin/stats.ts`:
  ```ts
  export const GET: APIRoute = async ({ request, params }) => {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;
    // ...
  };
  ```

- [ ] 2B.2 Create all issue API routes (§3.5–3.6 of spec).

- [ ] 2B.3 Create all comment API routes (§3.7 of spec).

- [ ] 2B.4 Validate request bodies: return 400 for missing required fields (e.g., project name, issue title, comment body). Use simple inline validation (no schema library needed).

**Commit:** `feat(projects): add query layer and API endpoints for projects, issues, and comments`

---

## Chunk 3: UI Pages

**Files to create:**
- `website-astro/src/pages/projects/index.astro` — project list page
- `website-astro/src/pages/projects/[id].astro` — project table view page
- `website-astro/src/pages/issues/[id].astro` — issue detail page
- `website-astro/src/pages/en/projects/index.astro` — EN locale mirror
- `website-astro/src/pages/en/projects/[id].astro` — EN locale mirror
- `website-astro/src/pages/en/issues/[id].astro` — EN locale mirror

**Steps:**

- [ ] 3.1 Create `src/pages/projects/index.astro` following `garden.astro` pattern:
  1. Import `BaseLayout`, `getSession`, `getLocaleFromPath`, `useTranslations`
  2. Check session — redirect non-admins to `/garden` (or `/en/garden`)
  3. Pass locale, nav labels, and project-specific labels to `<ProjectListPage client:load />`

- [ ] 3.2 Create `src/pages/projects/[id].astro`:
  1. Same auth/admin check pattern
  2. Extract `id` from `Astro.params`
  3. Render `<ProjectView client:load projectId={id} />` with labels

- [ ] 3.3 Create `src/pages/issues/[id].astro`:
  1. Same auth/admin check pattern
  2. Extract `id` from `Astro.params`
  3. Render `<IssueDetail client:load issueId={id} />` with labels

- [ ] 3.4 Create EN locale mirrors (`src/pages/en/projects/index.astro`, `src/pages/en/projects/[id].astro`, `src/pages/en/issues/[id].astro`) — same content, locale detected from path.

**Commit:** `feat(projects): add Astro pages for projects list, project view, and issue detail`

---

## Chunk 4: Design System Components

**Files to create (molecules):**
- `website-astro/src/components/ui/molecules/ProjectCard.tsx`
- `website-astro/src/components/ui/molecules/IssueRow.tsx`
- `website-astro/src/components/ui/molecules/GroupHeader.tsx`
- `website-astro/src/components/ui/molecules/CommentItem.tsx`
- `website-astro/src/components/ui/molecules/FieldEditor.tsx`
- `website-astro/src/components/ui/molecules/IssueSidebar.tsx`

**Files to create (organisms):**
- `website-astro/src/components/ui/organisms/ProjectListPage.tsx`
- `website-astro/src/components/ui/organisms/ProjectView.tsx`
- `website-astro/src/components/ui/organisms/IssueTable.tsx`
- `website-astro/src/components/ui/organisms/IssueDetail.tsx`

**Files to modify:**
- `website-astro/src/components/ui/molecules/index.ts` — add new exports

### 4A: Molecules

- [ ] 4A.1 Create `ProjectCard.tsx`:
  - Props: `name`, `description`, `issueCount`, `memberAvatars`, `href`
  - Uses `bg-bg-card rounded-xl shadow-sm`, `font-pixel` for project name
  - Wraps in `<a>` linking to `/projects/:id`

- [ ] 4A.2 Create `IssueRow.tsx`:
  - Props: `id`, `title`, `status`, `assignees`, `customFields`, `isSubIssue`, `updatedAt`, `onStatusCycle`
  - Renders a table row. Sub-issues have `pl-8` indent and `↳` prefix
  - Status badge is clickable (calls `onStatusCycle`). Uses same color mapping as `STATUS_COLORS` in AdminPanel
  - Title is an `<a>` to `/issues/:id`

- [ ] 4A.3 Create `GroupHeader.tsx`:
  - Props: `label`, `count`, `doneCount`, `collapsed`, `onToggle`
  - Collapsible row spanning full table width. Shows phase number badge, name, progress bar, count
  - Uses `bg-bg-warm rounded-lg`

- [ ] 4A.4 Create `CommentItem.tsx`:
  - Props: `id`, `authorName`, `authorAvatar`, `body`, `createdAt`, `pinned`, `reactions`, `isAuthor`, `onEdit`, `onDelete`, `onPin`, `onReact`
  - Renders markdown body (simple: bold, italic, code, links — no heavy library needed, use regex or dangerouslySetInnerHTML with sanitization)
  - Reactions row: emoji badges with count, clickable to toggle
  - Pin indicator: small pin icon if `pinned`

- [ ] 4A.5 Create `FieldEditor.tsx`:
  - Props: `field: ProjectField`, `value: string`, `onChange: (value: string) => void`
  - Renders appropriate input based on `field.field_type`:
    - `text` → `<input type="text">`
    - `number` → `<input type="number">`
    - `date` → `<input type="date">`
    - `single_select` → `<select>` with `field.options`
    - `multi_select` → multi-checkbox or tag picker
    - `user` → `<select>` with user list (fetched from API)

- [ ] 4A.6 Create `IssueSidebar.tsx`:
  - Props: `issue`, `onStatusChange`, `onAssigneeAdd`, `onAssigneeRemove`, `projects`, `customFields`
  - 280px right sidebar. Sections: Status, Assignees, Parent issue, Projects, Custom fields
  - Each section is a labeled block with edit affordances

- [ ] 4A.7 Update `src/components/ui/molecules/index.ts` — add exports for all 6 new molecules.

### 4B: Organisms

- [ ] 4B.1 Create `ProjectListPage.tsx`:
  - Fetches `GET /api/projects` on mount
  - Renders grid of `ProjectCard` components
  - "+ New Project" button opens inline form (name + description inputs + create button)
  - Calls `POST /api/projects` to create, then refetches list
  - Includes `SiteNav` at top (same pattern as `AdminPanel.tsx`)

- [ ] 4B.2 Create `IssueTable.tsx`:
  - Props: `projectId`, `fields: ProjectField[]`, `labels`
  - Fetches `GET /api/projects/:id/issues` with query params for groupBy, status filter, search
  - Table toolbar: filter chips (status), group-by dropdown (lists single-select fields), columns show/hide dropdown, search input
  - Renders `GroupHeader` + `IssueRow` components. When grouped, rows are nested under collapsible group headers
  - Sub-issues rendered indented below their parent issue
  - Column visibility state in React state (not persisted — sub-project 2)

- [ ] 4B.3 Create `ProjectView.tsx`:
  - Props: `projectId`, `locale`, `navLabels`, `labels`
  - Fetches project details (`GET /api/projects/:id`) on mount
  - Header: project name (editable inline), description, member avatars, settings gear
  - View switcher: "Board" (disabled badge) | "Table" (active)
  - Settings gear opens modal/drawer for: edit project name/description, manage fields (add/edit/delete), manage members
  - Renders `IssueTable` organism
  - "+ Add Issue" button in toolbar: creates new issue via `POST /api/projects/:id/issues`
  - Includes `SiteNav` at top

- [ ] 4B.4 Create `IssueDetail.tsx`:
  - Props: `issueId`, `locale`, `navLabels`, `labels`
  - Fetches issue details (`GET /api/issues/:id`) on mount
  - Left panel: title (editable), metadata line, description (editable markdown), sub-issues list, comments list, comment composer
  - Right panel: `IssueSidebar`
  - Edit flows: click title to edit inline, click description to enter edit mode (textarea), submit with Save button
  - Comment composer: textarea + "Comment" button → `POST /api/issues/:id/comments`
  - Includes `SiteNav` at top

**Commit:** `feat(projects): add design system molecules and organisms for project and issue views`

---

## Chunk 5: Seed Migration + Admin Gating + Nav Update

**Files to create:**
- `website-astro/src/lib/db/seed-projects.ts` — seed script

**Files to modify:**
- `website-astro/src/pages/api/admin/seed-projects.ts` — **create** (POST endpoint)
- `website-astro/src/components/ui/organisms/SiteNav.tsx` — add "Projects" link
- `website-astro/src/components/ui/organisms/AdminPanel.tsx` — remove Launch Tracker tab

### 5A: Seed script

- [ ] 5A.1 Create `src/lib/db/seed-projects.ts` with `seedLaunchProject(adminUserId: string)`:
  1. Check if project named "Launching Plantgotchi" already exists — return early if so (idempotent)
  2. Create the project, add admin as owner in `project_members`
  3. Create "Phase" single-select field with options: `["SETUP", "PCB DESIGN", "3D CASE DESIGN", "ESP32 FIRMWARE"]`
  4. Create "Priority" single-select field with options: `["Critical", "High", "Normal", "Low"]`
  5. Iterate over `INITIAL_PHASES` data (hardcode the same data from AdminPanel.tsx):
     - Create each task as an issue. **Status mapping:** `done` → `done`, `todo` → `todo`, `in-progress` → `in_progress`, `blocked` → `blocked`
     - Add issue to project via `project_issues`
     - Set Phase field value to the phase title
     - Set Priority to "Critical" where `critical: true`, "Normal" otherwise
     - Add admin as assignee
  6. Use `db.batch()` for bulk inserts where possible for performance

- [ ] 5A.2 Create `src/pages/api/admin/seed-projects.ts` (`POST`):
  1. `requireAdmin` check
  2. Call `runMigrations()` first (ensure tables exist)
  3. Call `seedLaunchProject(auth.userId)`
  4. Return `{ success: true, message: "Seeded Launching Plantgotchi project" }`

### 5B: Navigation update

- [ ] 5B.1 Modify `SiteNav.tsx`:
  - Add "Projects" nav item between "Garden" and "Help" (or between "Garden" and "Chat" — check existing order)
  - Only render if user has admin role. The `SiteNav` component receives labels and likely a user/role prop — add `isAdmin?: boolean` prop if not present
  - Link goes to `/projects` (or `/en/projects` for EN locale)
  - Use i18n label `nav.projects`

### 5C: Remove Launch Tracker tab

- [ ] 5C.1 Modify `AdminPanel.tsx`:
  - Remove `'launch-tracker'` from the `Tab` type and `TABS` array
  - Remove the `LaunchTrackerTab` function component entirely
  - Remove the `{activeTab === 'launch-tracker' && <LaunchTrackerTab />}` render
  - Remove `INITIAL_PHASES`, `MILESTONES`, `STORAGE_KEY`, `STATUS_COLORS`, `STATUS_LABELS`, `FILTER_OPTIONS` constants
  - Remove `PhaseCard`, `TaskRow` from the imports (keep `StatCard` if still used by other tabs)
  - Keep the `PhaseCard` and `TaskRow` molecule files in the design system (spec §8 says they remain)

**Commit:** `feat(projects): add seed migration from Launch Tracker, update nav, remove Launch Tracker tab`

---

## Chunk 6: i18n + Storybook Stories + Integration Testing

**Files to modify:**
- `website-astro/src/i18n/ui/pt-br.json` — add PT-BR translation keys
- `website-astro/src/i18n/ui/en.json` — add EN translation keys

**Files to create:**
- `website-astro/src/stories/ProjectCard.stories.tsx`
- `website-astro/src/stories/IssueRow.stories.tsx`
- `website-astro/src/stories/GroupHeader.stories.tsx`
- `website-astro/src/stories/CommentItem.stories.tsx`
- `website-astro/src/stories/FieldEditor.stories.tsx`
- `website-astro/src/stories/IssueSidebar.stories.tsx`
- `website-astro/src/tests/project-queries.test.ts` (or appropriate test dir)

### 6A: i18n strings

- [ ] 6A.1 Add translation keys to `en.json`:
  ```json
  "nav.projects": "Projects",
  "projects.title": "Projects",
  "projects.newProject": "New Project",
  "projects.name": "Name",
  "projects.description": "Description",
  "projects.create": "Create",
  "projects.cancel": "Cancel",
  "projects.issues": "Issues",
  "projects.members": "Members",
  "projects.settings": "Settings",
  "projects.fields": "Custom Fields",
  "projects.addField": "Add Field",
  "projects.groupBy": "Group by",
  "projects.groupByNone": "None",
  "projects.columns": "Columns",
  "projects.search": "Search issues...",
  "projects.noProjects": "No projects yet",
  "projects.createFirst": "Create your first project to get started",
  "projects.viewTable": "Table",
  "projects.viewBoard": "Board",
  "projects.viewBoardSoon": "Coming soon",
  "projects.addIssue": "Add Issue",
  "issues.title": "Issue",
  "issues.description": "Description",
  "issues.status": "Status",
  "issues.statusTodo": "Todo",
  "issues.statusInProgress": "In Progress",
  "issues.statusDone": "Done",
  "issues.statusBlocked": "Blocked",
  "issues.statusArchived": "Archived",
  "issues.assignees": "Assignees",
  "issues.addAssignee": "Add assignee",
  "issues.parentIssue": "Parent issue",
  "issues.subIssues": "Sub-issues",
  "issues.addSubIssue": "Add sub-issue",
  "issues.projects": "Projects",
  "issues.customFields": "Custom Fields",
  "issues.noDescription": "No description",
  "issues.editDescription": "Edit description",
  "issues.save": "Save",
  "issues.delete": "Delete",
  "issues.confirmDelete": "Are you sure?",
  "issues.updated": "Updated",
  "comments.title": "Comments",
  "comments.write": "Write a comment...",
  "comments.submit": "Comment",
  "comments.edit": "Edit",
  "comments.delete": "Delete",
  "comments.pin": "Pin",
  "comments.unpin": "Unpin",
  "comments.pinned": "Pinned",
  "comments.noComments": "No comments yet",
  "comments.edited": "edited"
  ```

- [ ] 6A.2 Add corresponding PT-BR translations to `pt-br.json`:
  ```json
  "nav.projects": "Projetos",
  "projects.title": "Projetos",
  "projects.newProject": "Novo Projeto",
  "projects.name": "Nome",
  "projects.description": "Descrição",
  "projects.create": "Criar",
  "projects.cancel": "Cancelar",
  "projects.issues": "Tarefas",
  "projects.members": "Membros",
  "projects.settings": "Configurações",
  "projects.fields": "Campos Personalizados",
  "projects.addField": "Adicionar Campo",
  "projects.groupBy": "Agrupar por",
  "projects.groupByNone": "Nenhum",
  "projects.columns": "Colunas",
  "projects.search": "Buscar tarefas...",
  "projects.noProjects": "Nenhum projeto ainda",
  "projects.createFirst": "Crie seu primeiro projeto para começar",
  "projects.viewTable": "Tabela",
  "projects.viewBoard": "Quadro",
  "projects.viewBoardSoon": "Em breve",
  "projects.addIssue": "Adicionar Tarefa",
  "issues.title": "Tarefa",
  "issues.description": "Descrição",
  "issues.status": "Status",
  "issues.statusTodo": "A fazer",
  "issues.statusInProgress": "Em andamento",
  "issues.statusDone": "Concluído",
  "issues.statusBlocked": "Bloqueado",
  "issues.statusArchived": "Arquivado",
  "issues.assignees": "Responsáveis",
  "issues.addAssignee": "Adicionar responsável",
  "issues.parentIssue": "Tarefa pai",
  "issues.subIssues": "Sub-tarefas",
  "issues.addSubIssue": "Adicionar sub-tarefa",
  "issues.projects": "Projetos",
  "issues.customFields": "Campos Personalizados",
  "issues.noDescription": "Sem descrição",
  "issues.editDescription": "Editar descrição",
  "issues.save": "Salvar",
  "issues.delete": "Excluir",
  "issues.confirmDelete": "Tem certeza?",
  "issues.updated": "Atualizado",
  "comments.title": "Comentários",
  "comments.write": "Escreva um comentário...",
  "comments.submit": "Comentar",
  "comments.edit": "Editar",
  "comments.delete": "Excluir",
  "comments.pin": "Fixar",
  "comments.unpin": "Desafixar",
  "comments.pinned": "Fixado",
  "comments.noComments": "Nenhum comentário ainda",
  "comments.edited": "editado"
  ```

### 6B: Storybook stories

- [ ] 6B.1 Check existing story location (look for `*.stories.tsx` files) and follow the same directory pattern.

- [ ] 6B.2 Create stories for each new molecule:
  - `ProjectCard.stories.tsx` — default, long description, many members
  - `IssueRow.stories.tsx` — each status, with/without sub-issue indent, with custom fields
  - `GroupHeader.stories.tsx` — collapsed, expanded, various progress levels
  - `CommentItem.stories.tsx` — plain, pinned, with reactions, authored by current user (shows edit/delete)
  - `FieldEditor.stories.tsx` — each field type (text, number, date, single_select, multi_select, user)
  - `IssueSidebar.stories.tsx` — full sidebar with all sections populated

### 6C: Integration tests

- [ ] 6C.1 Check existing test location (look for `*.test.ts` files) and follow the same directory/config pattern.

- [ ] 6C.2 Write integration tests for the query layer (`project-queries.ts`):
  - Test project CRUD (create, read, update, delete)
  - Test adding/removing issues from projects
  - Test custom field creation and value setting
  - Test issue CRUD with sub-issues (verify cascade delete)
  - Test comment CRUD with reactions and pin toggle
  - Test `listProjectIssues` with `groupBy` parameter
  - Test assignee add/remove
  - Use in-memory LibSQL client if available, or mock `getDb()`

- [ ] 6C.3 Write integration tests for the seed migration:
  - Verify `seedLaunchProject` is idempotent (calling twice doesn't duplicate)
  - Verify correct number of issues created (24 across 4 phases)
  - Verify status mapping (`in-progress` → `in_progress`)
  - Verify critical tasks get "Critical" priority field value

**Commit:** `feat(projects): add i18n strings, Storybook stories, and integration tests`

---

## Summary of All Files

### New files (27+)
| File | Chunk |
|------|-------|
| `src/lib/db/schema.ts` | 1 |
| `src/pages/api/admin/migrate.ts` | 1 |
| `src/lib/db/project-queries.ts` | 2 |
| `src/pages/api/projects/index.ts` | 2 |
| `src/pages/api/projects/[id]/index.ts` | 2 |
| `src/pages/api/projects/[id]/members.ts` | 2 |
| `src/pages/api/projects/[id]/members/[userId].ts` | 2 |
| `src/pages/api/projects/[id]/fields/index.ts` | 2 |
| `src/pages/api/projects/[id]/fields/[fieldId].ts` | 2 |
| `src/pages/api/projects/[id]/issues/index.ts` | 2 |
| `src/pages/api/projects/[id]/issues/[issueId].ts` | 2 |
| `src/pages/api/projects/[id]/issues/[issueId]/fields.ts` | 2 |
| `src/pages/api/issues/index.ts` | 2 |
| `src/pages/api/issues/[id]/index.ts` | 2 |
| `src/pages/api/issues/[id]/assignees/index.ts` | 2 |
| `src/pages/api/issues/[id]/assignees/[userId].ts` | 2 |
| `src/pages/api/issues/[id]/comments.ts` | 2 |
| `src/pages/api/comments/[id]/index.ts` | 2 |
| `src/pages/api/comments/[id]/pin.ts` | 2 |
| `src/pages/api/comments/[id]/reactions/index.ts` | 2 |
| `src/pages/api/comments/[id]/reactions/[emoji].ts` | 2 |
| `src/pages/projects/index.astro` | 3 |
| `src/pages/projects/[id].astro` | 3 |
| `src/pages/issues/[id].astro` | 3 |
| `src/pages/en/projects/index.astro` | 3 |
| `src/pages/en/projects/[id].astro` | 3 |
| `src/pages/en/issues/[id].astro` | 3 |
| `src/components/ui/molecules/ProjectCard.tsx` | 4 |
| `src/components/ui/molecules/IssueRow.tsx` | 4 |
| `src/components/ui/molecules/GroupHeader.tsx` | 4 |
| `src/components/ui/molecules/CommentItem.tsx` | 4 |
| `src/components/ui/molecules/FieldEditor.tsx` | 4 |
| `src/components/ui/molecules/IssueSidebar.tsx` | 4 |
| `src/components/ui/organisms/ProjectListPage.tsx` | 4 |
| `src/components/ui/organisms/ProjectView.tsx` | 4 |
| `src/components/ui/organisms/IssueTable.tsx` | 4 |
| `src/components/ui/organisms/IssueDetail.tsx` | 4 |
| `src/lib/db/seed-projects.ts` | 5 |
| `src/pages/api/admin/seed-projects.ts` | 5 |
| 6 Storybook stories | 6 |
| Integration test file(s) | 6 |

### Modified files (5)
| File | Chunk |
|------|-------|
| `src/lib/db/client.ts` | 1 |
| `src/components/ui/molecules/index.ts` | 4 |
| `src/components/ui/organisms/SiteNav.tsx` | 5 |
| `src/components/ui/organisms/AdminPanel.tsx` | 5 |
| `src/i18n/ui/en.json` | 6 |
| `src/i18n/ui/pt-br.json` | 6 |

All paths above are relative to `website-astro/`.
